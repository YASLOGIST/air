/* ── AIRGL · ULD procedural model shop ────────────────────────────────────
   Builds the four IATA Unit Load Devices as real meshes with wall thickness,
   hinged/rolling door rigs, instanced payloads and per-unit engineering
   detail (condenser fan, LCD setpoint panel, rivet belts, airflow rails).

   Draw-call discipline: everything slow-in-the-state-machine is instanced
   (payload crates = 1 call, rivets = 1 call), every edge highlight for the
   whole unit is merged into a single LineSegments, and each unit assembles
   into one Group with ≤ 18 draw calls — cheap enough that the whole scene,
   including floor/grid/particles/scan-plane, stays under 35 draw calls.

   Geometry is authored in metres-scaled units (1 unit ≈ the real ULD's
   longest dimension ≈ 1.6–3.2 m downscaled), y-up, door face at z > 0.
────────────────────────────────────────────────────────────────────────── */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type UldCode = 'AKE' | 'PMC' | 'RKN' | 'RAP';

export interface ExplodePart {
  object: THREE.Object3D;
  /** Unit direction this part travels when the assembly explodes. */
  direction: THREE.Vector3;
}

export interface UldModel {
  /** Root node; add to scene, position so the unit rests on the floor. */
  group: THREE.Group;
  /** Applies door/curtain opening progress 0 → 1. Called from the spring. */
  applyDoor: (progress: number) => void;
  /** Parts that separate during exploded inspection. */
  explodeParts: ExplodePart[];
  /** Lift for group.position.y so the unit rests exactly on y = 0. */
  restLift: number;
  /** Half-extents of the whole unit for scan-plane sizing and hotspot anchoring. */
  size: { w: number; h: number; d: number };
  /** Accent hex used for edges, LED wash and hotspot beacons. */
  accent: number;
  /** Whether the unit has active cooling (drives particles + thermal baseline). */
  cooled: boolean;
  /** Optional animated machinery the scene ticks. */
  machinery?: {
    spin: THREE.Object3D[];
    led?: THREE.MeshStandardMaterial;
  };
}

/* ── Paint book ───────────────────────────────────────────────────────────
   One shared instance per finish across all units keeps program switches at
   zero and lets the render-mode controller swap materials by userData.role. */

export const ROLE_SHELL = 'shell';
export const ROLE_FLOOR = 'floor';
export const ROLE_CARGO = 'cargo';
export const ROLE_DETAIL = 'detail';
export const ROLE_NET = 'net';

export interface PaintBook {
  shell: THREE.MeshStandardMaterial;
  shellDark: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  cargo: THREE.MeshStandardMaterial;
  detail: THREE.MeshStandardMaterial;
  detailBright: THREE.MeshStandardMaterial;
  strap: THREE.MeshStandardMaterial;
  net: THREE.MeshStandardMaterial;
  lcd: THREE.MeshBasicMaterial | null;
}

export function createPaintBook(accent: number): PaintBook {
  const metal = (color: number, roughness: number, metalness: number) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    shell: metal(0x22303f, 0.42, 0.82),
    shellDark: metal(0x141f2c, 0.5, 0.75),
    door: new THREE.MeshStandardMaterial({ color: accent, roughness: 0.38, metalness: 0.65 }),
    floor: metal(0x0d151f, 0.55, 0.7),
    cargo: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.08 }),
    detail: metal(0x3b4c5f, 0.35, 0.9),
    detailBright: metal(0x9db8cc, 0.25, 0.95),
    strap: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
      metalness: 0.2,
      emissive: 0x7c3f00,
      emissiveIntensity: 0.35,
    }),
    net: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    }),
    lcd: null,
  };
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

interface BoxOptions {
  role?: string;
  /**
   * Edge-highlight strategy:
   *   'merge' — baked into the unit-wide single-draw-call LineSegments
   *             (static parts; cheapest);
   *   'self'  — own LineSegments child that inherits the mesh's transform,
   *             required for anything that hinges, swings or scales (doors);
   *   'none'  — no highlight (small detail pieces; keeps the merge light).
   */
  edges?: 'merge' | 'self' | 'none';
}

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempEuler = new THREE.Euler();

function box(
  parent: THREE.Group,
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rotZ = 0,
  options: BoxOptions = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  if (rotZ !== 0) mesh.rotation.z = rotZ;
  mesh.userData.role = options.role ?? ROLE_DETAIL;
  mesh.userData.edges = options.edges ?? 'merge';
  (parent as THREE.Group).add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Group,
  material: THREE.Material,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  x: number,
  y: number,
  z: number,
  radialSegments = 20,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.userData.role = ROLE_DETAIL;
  mesh.userData.edges = 'none';
  (parent as THREE.Group).add(mesh);
  return mesh;
}

/**
 * Instanced payload boxes. One InstancedMesh, one draw call, per-instance
 * colour so pharma teal and general-cargo amber read as distinct manifests.
 */
function instancedCrates(
  parent: THREE.Group,
  material: THREE.MeshStandardMaterial,
  crates: { x: number; y: number; z: number; w: number; h: number; d: number; color: number }[],
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, crates.length);
  const color = new THREE.Color();
  crates.forEach((crate, i) => {
    tempPosition.set(crate.x, crate.y, crate.z);
    tempQuaternion.identity();
    tempScale.set(crate.w, crate.h, crate.d);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    mesh.setMatrixAt(i, tempMatrix);
    mesh.setColorAt(i, color.setHex(crate.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.role = ROLE_CARGO;
  mesh.userData.edges = false;
  (parent as THREE.Group).add(mesh);
  return mesh;
}

/**
 * One merged LineSegments for every edge-merge mesh below `root` — whatever
 * the unit's part count, the static edge overlay costs exactly one draw call
 * in one program. Meshes marked 'self' (doors/curtain, i.e. anything the
 * door spring moves) receive their own edge child so highlights follow the
 * hinge exactly; each door costs at most two extra draws on the whole scene.
 */
export function mergeEdgeLines(root: THREE.Group, color: number): THREE.LineSegments {
  const edgeGeometries: THREE.BufferGeometry[] = [];
  const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
  const selfEdged: { mesh: THREE.Mesh; line: THREE.LineSegments }[] = [];
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.edges === 'none') return;
    const edges = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry, 42);
    if (mesh.userData.edges === 'self') {
      const line = new THREE.LineSegments(edges, lineMaterial);
      line.userData.role = ROLE_DETAIL;
      mesh.add(line);
      selfEdged.push({ mesh, line });
      return;
    }
    // Bake the mesh's transform relative to the unit root, not world space.
    tempMatrix.copy(root.matrixWorld).invert().multiply(mesh.matrixWorld);
    edges.applyMatrix4(tempMatrix);
    edgeGeometries.push(edges);
  });
  const merged = edgeGeometries.length > 0 ? mergeGeometries(edgeGeometries, false) : new THREE.BufferGeometry();
  edgeGeometries.forEach((geometry) => geometry.dispose());
  const lines = new THREE.LineSegments(merged, lineMaterial);
  lines.userData.role = ROLE_DETAIL;
  root.add(lines);
  return lines;
}

/** Stainless rivet belt: one instanced mesh, one draw call. */
function rivetBelt(
  parent: THREE.Group,
  material: THREE.Material,
  points: { x: number; y: number; z: number }[],
): void {
  const geometry = new THREE.CylinderGeometry(0.016, 0.016, 0.014, 10);
  const mesh = new THREE.InstancedMesh(geometry, material, points.length);
  tempEuler.set(Math.PI / 2, 0, 0);
  tempQuaternion.setFromEuler(tempEuler);
  points.forEach((point, i) => {
    tempPosition.set(point.x, point.y, point.z);
    tempScale.set(1, 1, 1);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    mesh.setMatrixAt(i, tempMatrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.userData.role = ROLE_DETAIL;
  mesh.userData.edges = false;
  (parent as THREE.Group).add(mesh);
}

/** LCD setpoint readout — text rendered once to a canvas, never per frame. */
function lcdPanel(parent: THREE.Group, width: number, height: number, line1: string, line2: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#041019';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#134e4a';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 52px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, canvas.width / 2, canvas.height / 2 - 14);
    ctx.fillStyle = '#99f6e4';
    ctx.font = '17px "IBM Plex Mono", monospace';
    ctx.fillText(line2, canvas.width / 2, canvas.height - 24);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  mesh.userData.role = ROLE_DETAIL;
  mesh.userData.edges = false;
  (parent as THREE.Group).add(mesh);
  return mesh;
}

/* ── Unit builders ──────────────────────────────────────────────────────── */

function buildAke(paint: PaintBook): UldModel {
  const group = new THREE.Group();
  const w = 0.9; // half width
  const h = 0.8; // half height
  const d = 0.8; // half depth
  const ch = 0.45; // belly-lobe chamfer
  const t = 0.056; // wall thickness

  // Contoured back wall: polygon extrusion gives the real LD3 profile.
  const profile = new THREE.Shape();
  profile.moveTo(-w, -h);
  profile.lineTo(w, -h);
  profile.lineTo(w, h - ch);
  profile.lineTo(w - ch, h);
  profile.lineTo(-w, h);
  profile.closePath();
  const backWall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(profile, { depth: t, bevelEnabled: false }),
    paint.shell,
  );
  backWall.position.z = -d - t / 2;
  backWall.userData.role = ROLE_SHELL;
  group.add(backWall);

  // Left wall, truncated right wall and the belly-lobe chamfer slope.
  const leftWall = box(group, paint.shell, t, h * 2, d * 2, -w + t / 2, 0, 0, 0, { role: ROLE_SHELL });
  const slopeLen = Math.hypot(ch, ch);
  const chamfer = box(
    group,
    paint.shell,
    slopeLen + t,
    t,
    d * 2,
    w - ch / 2,
    h - ch / 2,
    0,
    (Math.PI * 3) / 4,
    { role: ROLE_SHELL },
  );
  const rightWall = box(
    group,
    paint.shellDark,
    t,
    h - ch + 0.02,
    d * 2,
    w - t / 2,
    -h + (h - ch + 0.02) / 2,
    0,
    0,
    { role: ROLE_SHELL },
  );

  // Roof spans only up to where the chamfer starts.
  const roof = box(
    group,
    paint.shell,
    w * 2 - ch,
    t,
    d * 2,
    -w + (w * 2 - ch) / 2,
    h - t / 2,
    0,
    0,
    { role: ROLE_SHELL },
  );
  const floor = box(group, paint.floor, w * 2, t, d * 2, 0, -h + t / 2, 0, 0, { role: ROLE_FLOOR });

  // Payload: dense industrial crates on the false floor.
  const payload = new THREE.Group();
  box(payload, paint.detail, 0.9, 0.05, 0.62, -0.2, -h + t + 0.025, -0.05, 0, { role: ROLE_DETAIL, edges: 'none' });
  instancedCrates(payload, paint.cargo, [
    { x: -0.4, y: -h + t + 0.24, z: -0.2, w: 0.34, h: 0.34, d: 0.34, color: 0xb45309 },
    { x: 0.0, y: -h + t + 0.24, z: -0.2, w: 0.34, h: 0.34, d: 0.34, color: 0x92400e },
    { x: -0.2, y: -h + t + 0.56, z: -0.1, w: 0.3, h: 0.28, d: 0.3, color: 0x78350f },
  ]);
  group.add(payload);

  // Roll-up curtain door: geometry anchored at its top edge so the curtain
  // genuinely rolls away upward; a cylinder above the header grows as the
  // curtain coils into it.
  const curtainHeight = h * 2 - 0.12;
  const curtainGeometry = new THREE.BoxGeometry(w * 2 - 0.08, curtainHeight, 0.03);
  curtainGeometry.translate(0, -curtainHeight / 2, 0);
  const curtain = new THREE.Mesh(curtainGeometry, paint.door);
  curtain.position.set(0, h - 0.06, d + 0.02);
  curtain.userData.role = ROLE_SHELL;
  curtain.userData.edges = 'self';
  const roll = cylinder(group, paint.detail, 0.034, 0.034, w * 2 - 0.06, 0, h + 0.02, d + 0.02);
  roll.rotation.z = Math.PI / 2;
  const doorGroup = new THREE.Group();
  doorGroup.add(curtain);
  group.add(doorGroup);

  const applyDoor = (progress: number) => {
    curtain.scale.y = Math.max(0.001, 1 - progress * 0.985);
    // The coil grows radially only — local y is the axle (never lengthens).
    roll.scale.set(1 + progress * 2.6, 1, 1 + progress * 2.6);
  };

  mergeEdgeLines(group, 0x38bdf8);

  return {
    group,
    applyDoor,
    explodeParts: [
      { object: roof, direction: new THREE.Vector3(0, 1, 0) },
      { object: leftWall, direction: new THREE.Vector3(-1, 0.15, 0) },
      { object: rightWall, direction: new THREE.Vector3(1, 0.1, 0) },
      { object: chamfer, direction: new THREE.Vector3(0.8, 0.8, 0) },
      { object: backWall, direction: new THREE.Vector3(0, 0.2, -1) },
      { object: floor, direction: new THREE.Vector3(0, -0.5, 0) },
      { object: doorGroup, direction: new THREE.Vector3(0, -0.2, 0.9) },
      { object: payload, direction: new THREE.Vector3(0, -0.9, 0.2) },
    ],
    restLift: h,
    size: { w: w * 2, h: h * 2, d: d * 2 },
    accent: 0x38bdf8,
    cooled: false,
  };
}

function buildPmc(paint: PaintBook): UldModel {
  const group = new THREE.Group();
  const w = 1.35;
  const d = 1.05;

  // Pallet plate and the IATA seat-track rim.
  const pallet = box(group, paint.shell, w * 2, 0.09, d * 2, 0, 0.045, 0, 0, { role: ROLE_SHELL });
  box(group, paint.detail, w * 2 + 0.04, 0.03, d * 2 + 0.04, 0, 0.095, 0, 0, { role: ROLE_DETAIL, edges: 'none' });

  // Heavy load: stacked industrial cases.
  const payload = new THREE.Group();
  instancedCrates(payload, paint.cargo, [
    { x: -0.62, y: 0.36, z: -0.4, w: 1.04, h: 0.5, d: 0.72, color: 0x334155 },
    { x: 0.62, y: 0.36, z: -0.4, w: 1.04, h: 0.5, d: 0.72, color: 0x3f4f63 },
    { x: -0.62, y: 0.36, z: 0.44, w: 1.04, h: 0.5, d: 0.72, color: 0x2b3a4c },
    { x: 0.62, y: 0.36, z: 0.44, w: 1.04, h: 0.5, d: 0.72, color: 0x39485a },
    { x: -0.3, y: 0.82, z: 0.02, w: 1.6, h: 0.4, d: 1.5, color: 0x46586c },
    { x: 0.55, y: 1.18, z: 0.1, w: 0.9, h: 0.32, d: 1.0, color: 0x536477 },
  ]);
  group.add(payload);

  // Restraint strap set over the load (static, part of the payload story).
  box(payload, paint.strap, 0.04, 1.28, d * 2 + 0.02, -0.05, 0.68, 0, 0, { role: ROLE_DETAIL, edges: 'none' });
  box(payload, paint.strap, 0.04, 1.28, d * 2 + 0.02, 0.62, 0.68, 0.05, 0, { role: ROLE_DETAIL, edges: 'none' });

  // Certified restraint net: a shell of meridian/parallel lines slightly
  // larger than the load. Opening the "door" = lifting the net free.
  const netGroup = new THREE.Group();
  const netHalf = { w: 1.32, h: 1.3, d: 0.98 };
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
  const netPoints: number[] = [];
  const spanY = 1.36;
  const push = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
    netPoints.push(ax, ay, az, bx, by, bz);
  };
  // Verticals around the four walls.
  for (let i = 0; i <= 8; i++) {
    const fx = -netHalf.w + (i / 8) * netHalf.w * 2;
    push(fx, 0.1, -netHalf.d, fx, 0.1 + spanY, -netHalf.d);
    push(fx, 0.1, netHalf.d, fx, 0.1 + spanY, netHalf.d);
  }
  for (let i = 1; i < 6; i++) {
    const fz = -netHalf.d + (i / 6) * netHalf.d * 2;
    push(-netHalf.w, 0.1, fz, -netHalf.w, 0.1 + spanY, fz);
    push(netHalf.w, 0.1, fz, netHalf.w, 0.1 + spanY, fz);
  }
  // Horizontals.
  for (let j = 0; j <= 6; j++) {
    const fy = 0.1 + (j / 6) * spanY;
    push(-netHalf.w, fy, -netHalf.d, netHalf.w, fy, -netHalf.d);
    push(-netHalf.w, fy, netHalf.d, netHalf.w, fy, netHalf.d);
    push(-netHalf.w, fy, -netHalf.d, -netHalf.w, fy, netHalf.d);
    push(netHalf.w, fy, -netHalf.d, netHalf.w, fy, netHalf.d);
  }
  const netGeometry = new THREE.BufferGeometry();
  netGeometry.setAttribute('position', new THREE.Float32BufferAttribute(netPoints, 3));
  const netLines = new THREE.LineSegments(netGeometry, netMaterial);
  netLines.userData.role = ROLE_NET;
  netGroup.add(netLines);
  // Corner net anchors.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 18), paint.detailBright);
      ring.position.set(sx * netHalf.w, 0.1, sz * netHalf.d);
      ring.rotation.x = Math.PI / 2;
      ring.userData.role = ROLE_NET;
      ring.userData.edges = 'none';
      netGroup.add(ring);
    }
  }
  group.add(netGroup);

  const netBaseY = 0;
  const applyDoor = (progress: number) => {
    netGroup.position.y = netBaseY + progress * 1.7;
    netMaterial.opacity = 0.8 * (1 - progress * 0.88);
  };

  mergeEdgeLines(group, 0x94a3b8);

  return {
    group,
    applyDoor,
    explodeParts: [
      { object: pallet, direction: new THREE.Vector3(0, -0.4, 0) },
      { object: payload, direction: new THREE.Vector3(0, 0.6, 0) },
      { object: netGroup, direction: new THREE.Vector3(0, 1, 0) },
    ],
    restLift: 0,
    size: { w: w * 2, h: 1.6, d: d * 2 },
    accent: 0x94a3b8,
    cooled: false,
  };
}

function buildRkn(paint: PaintBook): UldModel {
  const group = new THREE.Group();
  const w = 0.85;
  const h = 0.8;
  const d = 0.85;
  const t = 0.06;

  const back = box(group, paint.shell, w * 2, h * 2, t, 0, 0, -d + t / 2, 0, { role: ROLE_SHELL });
  const left = box(group, paint.shellDark, t, h * 2, d * 2, -w + t / 2, 0, 0, 0, { role: ROLE_SHELL });
  const right = box(group, paint.shell, t, h * 2, d * 2, w - t / 2, 0, 0, 0, { role: ROLE_SHELL });
  // Compressor head unit (the recognizable Envirotainer crown).
  const roof = new THREE.Group();
  box(roof, paint.door, w * 2, 0.2, d * 2, 0, 0.1, 0, 0, { role: ROLE_SHELL });
  box(roof, paint.shellDark, 0.7, 0.1, 0.5, -0.35, 0.24, -0.3, 0, { role: ROLE_DETAIL, edges: 'none' });
  box(roof, paint.shellDark, 0.5, 0.1, 0.5, 0.5, 0.24, -0.3, 0, { role: ROLE_DETAIL, edges: 'none' });
  roof.position.y = h;
  group.add(roof);
  const floor = box(group, paint.floor, w * 2, t, d * 2, 0, -h + t / 2, 0, 0, { role: ROLE_FLOOR });

  // Airflow floor rails keep circulation below the pallet.
  for (const railX of [-0.58, -0.2, 0.18, 0.56]) {
    box(group, paint.detailBright, 0.05, 0.05, d * 2 - 0.2, railX, -h + t + 0.025, 0, 0, {
      role: ROLE_DETAIL,
      edges: 'none',
    });
  }

  // Condenser fan on the crown — spins in the render loop.
  const fan = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 10, 28), paint.detailBright);
  ring.rotation.x = Math.PI / 2;
  ring.userData.role = ROLE_DETAIL;
  ring.userData.edges = 'none';
  fan.add(ring);
  for (let i = 0; i < 5; i++) {
    const blade = box(fan, paint.detail, 0.05, 0.008, 0.26, 0, 0, 0, 0, { role: ROLE_DETAIL, edges: 'none' });
    blade.rotation.y = (i / 5) * Math.PI * 2;
    blade.translateZ(0.075);
    blade.position.y = 0;
  }
  fan.position.set(-0.45, h + 0.22, 0.35);
  group.add(fan);

  // Control panel + LCD setpoint on the front-right wall.
  box(group, paint.shellDark, 0.56, 0.42, 0.03, 0.47, 0.31, d + 0.015 - t, 0, { role: ROLE_DETAIL, edges: 'none' });
  const lcd = lcdPanel(group, 0.42, 0.26, '+4.2°C', 'ACTIVE SETPOINT · SIM');
  lcd.position.set(0.47, 0.33, d + 0.032 - t);

  // Status LED next to the LCD — emissive pulsed by the loop.
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0x052e1f,
    emissive: 0x34d399,
    emissiveIntensity: 1.4,
    roughness: 0.4,
    metalness: 0,
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), ledMaterial);
  led.position.set(0.2, 0.47, d + 0.02 - t);
  led.userData.role = ROLE_DETAIL;
  led.userData.edges = false;
  group.add(led);

  // Identity rivet belt framing the door aperture.
  const rivets: { x: number; y: number; z: number }[] = [];
  for (const x of [-0.78, 0.78]) for (let y = -0.66; y <= 0.67; y += 0.19) rivets.push({ x, y, z: d - t + 0.06 });
  for (const y of [-0.7, 0.7]) for (let x = -0.57; x <= 0.58; x += 0.19) rivets.push({ x, y, z: d - t + 0.06 });
  rivetBelt(group, paint.detailBright, rivets);

  // Payload: single euro pallet with GDP thermal shippers + restraint bands.
  const payload = new THREE.Group();
  box(payload, paint.detail, 1.1, 0.07, 0.78, 0, -h + t + 0.07, 0, 0, { role: ROLE_DETAIL, edges: 'none' });
  instancedCrates(payload, paint.cargo, [
    { x: -0.26, y: -h + t + 0.34, z: -0.15, w: 0.42, h: 0.34, d: 0.36, color: 0x0f766e },
    { x: 0.24, y: -h + t + 0.34, z: -0.15, w: 0.42, h: 0.34, d: 0.36, color: 0x115e59 },
    { x: -0.01, y: -h + t + 0.63, z: -0.08, w: 0.4, h: 0.24, d: 0.34, color: 0x134e4a },
  ]);
  box(payload, paint.strap, 0.035, 0.78, 0.05, -0.28, -h + t + 0.42, 0.09, 0, { role: ROLE_DETAIL, edges: 'none' });
  box(payload, paint.strap, 0.035, 0.78, 0.05, 0.24, -h + t + 0.42, 0.09, 0, { role: ROLE_DETAIL, edges: 'none' });
  group.add(payload);

  // Hinged insulated door at the left jamb, swinging ~103° outward.
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-w, 0, d - t);
  box(doorGroup, paint.door, w * 1.8 - 0.04, h * 2 - 0.1, 0.045, w * 0.9, -0.02, 0, 0, { role: ROLE_SHELL, edges: 'self' });
  box(doorGroup, paint.detailBright, w * 1.8 - 0.14, h * 2 - 0.2, 0.012, w * 0.9, -0.02, 0.028, 0, {
    role: ROLE_DETAIL,
    edges: 'none',
  });
  group.add(doorGroup);

  const applyDoor = (progress: number) => {
    doorGroup.rotation.y = progress * 1.8;
  };

  mergeEdgeLines(group, 0x2dd4bf);

  return {
    group,
    applyDoor,
    explodeParts: [
      { object: roof, direction: new THREE.Vector3(0, 1, 0) },
      { object: left, direction: new THREE.Vector3(-1, 0.1, 0) },
      { object: right, direction: new THREE.Vector3(1, 0.1, 0) },
      { object: back, direction: new THREE.Vector3(0, 0.15, -1) },
      { object: floor, direction: new THREE.Vector3(0, -0.5, 0) },
      { object: doorGroup, direction: new THREE.Vector3(-0.35, -0.1, 0.5) },
      { object: payload, direction: new THREE.Vector3(0.1, -0.85, 0.3) },
    ],
    restLift: h,
    size: { w: w * 2, h: h * 2 + 0.2, d: d * 2 },
    accent: 0x2dd4bf,
    cooled: true,
    machinery: { spin: [fan], led: ledMaterial },
  };
}

function buildRap(paint: PaintBook): UldModel {
  const group = new THREE.Group();
  const w = 1.35;
  const h = 0.85;
  const d = 0.95;
  const t = 0.06;

  const back = box(group, paint.shell, w * 2, h * 2, t, 0, 0, -d + t / 2, 0, { role: ROLE_SHELL });
  const left = box(group, paint.shellDark, t, h * 2, d * 2, -w + t / 2, 0, 0, 0, { role: ROLE_SHELL });
  const right = box(group, paint.shell, t, h * 2, d * 2, w - t / 2, 0, 0, 0, { role: ROLE_SHELL });
  const roof = new THREE.Group();
  box(roof, paint.shell, w * 2, 0.16, d * 2, 0, 0.08, 0, 0, { role: ROLE_SHELL });
  box(roof, paint.door, 0.8, 0.12, 0.6, -0.6, 0.22, -0.35, 0, { role: ROLE_DETAIL, edges: 'none' });
  box(roof, paint.door, 0.8, 0.12, 0.6, 0.6, 0.22, -0.35, 0, { role: ROLE_DETAIL, edges: 'none' });
  roof.position.y = h;
  group.add(roof);
  const floor = box(group, paint.floor, w * 2, t, d * 2, 0, -h + t / 2, 0, 0, { role: ROLE_FLOOR });

  // Five euro-pallet bays, pallets + pharma cases both instanced.
  const payload = new THREE.Group();
  const palletCratesAmber: { x: number; y: number; z: number; w: number; h: number; d: number; color: number }[] = [];
  const latticeXs = [-1.05, -0.52, 0.0, 0.52, 1.05];
  const palletMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.07, 0.66), paint.detail, 5);
  latticeXs.forEach((x, i) => {
    tempPosition.set(x, -h + t + 0.035, 0);
    tempQuaternion.identity();
    tempScale.set(1, 1, 1);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    palletMesh.setMatrixAt(i, tempMatrix);
    palletCratesAmber.push(
      { x, y: -h + t + 0.26, z: -0.1, w: 0.42, h: 0.3, d: 0.5, color: i % 2 ? 0x115e59 : 0x0f766e },
      { x, y: -h + t + 0.53, z: -0.06, w: 0.4, h: 0.24, d: 0.46, color: i % 2 ? 0x134e4a : 0x0d5f57 },
    );
  });
  palletMesh.instanceMatrix.needsUpdate = true;
  palletMesh.userData.role = ROLE_DETAIL;
  palletMesh.userData.edges = false;
  payload.add(palletMesh);
  instancedCrates(payload, paint.cargo, palletCratesAmber);
  group.add(payload);

  // Bi-fold double doors, each hinged at its own jamb.
  const doorGroup = new THREE.Group();
  const leftDoor = new THREE.Group();
  leftDoor.position.set(-w, 0, d - t);
  box(leftDoor, paint.door, w * 0.95, h * 2 - 0.1, 0.045, w * 0.475, -0.02, 0, 0, { role: ROLE_SHELL, edges: 'self' });
  box(leftDoor, paint.detailBright, w * 0.95 - 0.12, h * 2 - 0.2, 0.012, w * 0.475, -0.02, 0.03, 0, {
    role: ROLE_DETAIL,
    edges: 'none',
  });
  const rightDoor = new THREE.Group();
  rightDoor.position.set(w, 0, d - t);
  box(rightDoor, paint.door, w * 0.95, h * 2 - 0.1, 0.045, -w * 0.475, -0.02, 0, 0, { role: ROLE_SHELL, edges: 'self' });
  box(rightDoor, paint.detailBright, w * 0.95 - 0.12, h * 2 - 0.2, 0.012, -w * 0.475, -0.02, 0.03, 0, {
    role: ROLE_DETAIL,
    edges: 'none',
  });
  doorGroup.add(leftDoor, rightDoor);
  group.add(doorGroup);

  const applyDoor = (progress: number) => {
    leftDoor.rotation.y = progress * 1.6;
    rightDoor.rotation.y = -progress * 1.6;
  };

  mergeEdgeLines(group, 0x38bdf8);

  return {
    group,
    applyDoor,
    explodeParts: [
      { object: roof, direction: new THREE.Vector3(0, 1, 0) },
      { object: left, direction: new THREE.Vector3(-1, 0.1, 0) },
      { object: right, direction: new THREE.Vector3(1, 0.1, 0) },
      { object: back, direction: new THREE.Vector3(0, 0.15, -1) },
      { object: floor, direction: new THREE.Vector3(0, -0.5, 0) },
      { object: doorGroup, direction: new THREE.Vector3(0, 0, 0.9) },
      { object: payload, direction: new THREE.Vector3(0, -0.85, 0.25) },
    ],
    restLift: h,
    size: { w: w * 2, h: h * 2 + 0.16, d: d * 2 },
    accent: 0x38bdf8,
    cooled: true,
    machinery: { spin: [], led: undefined },
  };
}

export function buildUldModel(code: UldCode): UldModel {
  const accent = code === 'RKN' ? 0x2dd4bf : code === 'PMC' ? 0xf59e0b : 0x38bdf8;
  const paint = createPaintBook(accent);
  switch (code) {
    case 'AKE':
      return buildAke(paint);
    case 'PMC':
      return buildPmc(paint);
    case 'RKN':
      return buildRkn(paint);
    default:
      return buildRap(paint);
  }
}
