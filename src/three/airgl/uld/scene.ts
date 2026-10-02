/* ── AIRGL · ULD digital-twin scene controller ────────────────────────────
   The imperative heart of the viewer. Owns exactly one WebGLRenderer, one
   PerspectiveCamera and one rAF loop, and speaks to React exclusively
   through method calls (no re-render per frame; stats emit at 2 Hz).

   Frame-budget contract:
     · zero allocations inside the loop — every transform/scratch vector was
       allocated once at construction;
     · one damped spring per animated state (door · explosion · camera),
       with a quiescence-aware loop: once every spring, easing curve and
       ambient effect has settled, the rAF itself goes to sleep — a paused,
       door-closed twin in material mode costs zero frames per second;
     · hotspot pills are occlusion-tested against the unit's world AABB each
       frame, so labels dim when the body stands between them and the camera;
     · geometries/materials replaced between units are disposed recursively
       before the next build is attached (see gl.ts zero-leak policy);
     · off-screen (IntersectionObserver) or reduced-motion → no rAF at all.
────────────────────────────────────────────────────────────────────────── */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createAirRenderer, disposeObjectGraph, releaseWebGL } from '../gl';
import { damp, dampAngle, isSpringSettled, stepSpring, type SpringState } from '../easing';
import {
  buildUldModel,
  ROLE_FLOOR,
  ROLE_SHELL,
  type UldCode,
  type UldModel,
} from './model';
import {
  buildParticleGeometry,
  createColdAirParticleMaterial,
  createScanPlaneMaterial,
  createThermalMaterial,
  createXrayMaterial,
  type ThermalMaterialHandles,
} from './shaders';

export type RenderMode = 'material' | 'thermal' | 'xray';
export type CameraPreset = 'iso' | 'front' | 'side' | 'top' | 'inside';

export interface SceneStats {
  fps: number;
  draws: number;
  dpr: number;
}

export interface HotspotSpec {
  id: 'temp' | 'cargo' | 'acid';
  color: string;
  label: string;
  element: HTMLElement | null;
}

interface OrbitState {
  theta: number;
  phi: number;
  radius: number;
}

const CAMERA_SMOOTH = 7.5;
const DOOR_SPRING_STIFFNESS = 42;
const EXPLODE_SMOOTH = 8;
const EXPLODE_OFFSET = 0.34;
const PARTICLE_COUNT = 140;
/** How long a fully settled, unanimated scene keeps the rAF loop alive. */
const QUIESCENT_GRACE_MS = 300;

/** Orbit targets per preset; radius is resolved per-unit from its size. */
const PRESETS: Record<CameraPreset, { theta: number; phi: number; radiusScale: number }> = {
  iso: { theta: -0.65, phi: Math.PI / 2 - 0.35, radiusScale: 1 },
  front: { theta: 0, phi: Math.PI / 2 - 0.06, radiusScale: 0.86 },
  side: { theta: Math.PI / 2, phi: Math.PI / 2 - 0.05, radiusScale: 0.9 },
  top: { theta: 0, phi: 0.16, radiusScale: 1.05 },
  inside: { theta: 0.02, phi: Math.PI / 2 - 0.1, radiusScale: 0.42 },
};

export class UldScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly scene = new THREE.Scene();
  private readonly canvas: HTMLCanvasElement;
  private readonly resizeObserver: ResizeObserver;

  private model: UldModel | null = null;
  private code: UldCode | null = null;

  /* Pre-allocated loop scratch — the loop allocates nothing, ever. */
  private readonly scratchVec = new THREE.Vector3();
  private readonly scratchVec2 = new THREE.Vector3();
  private readonly orbitTarget = new THREE.Vector3(0, 0.55, 0);

  /* Hotspot occlusion: one ray-vs-AABB test per hotspot per frame. */
  private readonly occlusionRay = new THREE.Ray();
  private readonly occlusionHit = new THREE.Vector3();
  private readonly anchorDir = new THREE.Vector3();
  private occlusionBox: THREE.Box3 | null = null;
  private readonly hotspotOccluded: [boolean, boolean, boolean] = [false, false, false];

  private orbit: OrbitState = { theta: -0.65, phi: Math.PI / 2 - 0.35, radius: 4 };
  private orbitGoal: OrbitState = { theta: -0.65, phi: Math.PI / 2 - 0.35, radius: 4 };
  private dragVelocity = { theta: 0, phi: 0 };
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private radiusBase = 4;

  private readonly doorSpring: SpringState = { position: 0, velocity: 0 };
  private doorTarget = 0;
  private explosion = 0;
  private explosionTarget = 0;
  private autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private mode: RenderMode = 'material';
  private visible = false;

  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;

  private thermal: ThermalMaterialHandles | null = null;
  private xrayMaterial: THREE.ShaderMaterial | null = null;
  private scanPlane: THREE.Mesh | null = null;
  private scanMaterial: THREE.ShaderMaterial | null = null;
  private particleMaterial: THREE.ShaderMaterial | null = null;
  private edgeLines: THREE.LineSegments | null = null;

  private readonly floorHelpers = new THREE.Group();
  private floorDisc: THREE.Mesh | null = null;

  private envRenderTarget: THREE.RenderTarget | null = null;
  private pmrem: THREE.PMREMGenerator | null = null;

  private hotspots: HotspotSpec[] = [];
  private hotspotAnchors: { temp: THREE.Vector3; cargo: THREE.Vector3; acid: THREE.Vector3 } = {
    temp: new THREE.Vector3(),
    cargo: new THREE.Vector3(),
    acid: new THREE.Vector3(),
  };

  private statsCallback: ((stats: SceneStats) => void) | null = null;
  private frames = 0;
  private statsAccumulator = 0;
  private idleTime = 0;

  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = createAirRenderer(canvas);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);

    this.scene.background = new THREE.Color(0x04070d);
    this.scene.fog = new THREE.Fog(0x04070d, 8.5, 16);

    /* IBL from a procedural studio environment — physically motivated
       reflections without a single external HDR asset (CSP-clean, 0 network).
       The RT (not only its texture) and the room scene are both released in
       dispose(): the generator uploads the room's geometry during conversion
       and a naive boot/dispose cycle would strand it. */
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnvironment = new RoomEnvironment();
    this.envRenderTarget = this.pmrem.fromScene(roomEnvironment, 0.06);
    this.scene.environment = this.envRenderTarget.texture;
    this.scene.environmentIntensity = 0.55;
    disposeObjectGraph(roomEnvironment);

    const key = new THREE.DirectionalLight(0xd6ecff, 1.35);
    key.position.set(3.2, 5.4, 2.6);
    const rim = new THREE.DirectionalLight(0x22d3ee, 0.5);
    rim.position.set(-4, 2, -3.5);
    this.scene.add(key, rim);

    this.buildFloor();
    this.attachPointer(canvas);

    this.resizeObserver = new ResizeObserver(() => this.applySize());
    const host = canvas.parentElement ?? canvas;
    this.resizeObserver.observe(host);
    this.applySize();
  }

  /* ── Studio floor: merged grid (1 call) + radial contact shadow (1 call) ── */
  private buildFloor(): void {
    const grid = new THREE.GridHelper(6, 30, 0x1a3a52, 0x0d2233);
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.34;
    this.floorHelpers.add(grid);

    const size = 128;
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = size;
    shadowCanvas.height = size;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(0.55, 'rgba(2,32,52,0.34)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 40),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.004;
    this.floorDisc = disc;
    this.floorHelpers.add(disc);
    this.scene.add(this.floorHelpers);
  }

  /* ── Model lifecycle ──────────────────────────────────────────────────── */
  setModel(code: UldCode): void {
    if (this.code === code) return;
    this.code = code;
    if (this.model) {
      this.scene.remove(this.model.group);
      this.unloadActiveModel();
      this.model = null;
      this.scanPlane = null;
      this.scanMaterial = null;
      this.particleMaterial = null;
      this.edgeLines = null;
    }

    const model = buildUldModel(code);
    this.model = model;
    model.group.position.y = model.restLift;
    this.scene.add(model.group);

    // Parts explode away from their authored rest positions.
    model.explodeParts.forEach((part) => {
      (part.object.userData as { explodeBase?: THREE.Vector3 }).explodeBase = part.object.position.clone();
      part.direction.multiplyScalar(EXPLODE_OFFSET);
    });
    model.group.updateMatrixWorld(true);

    // Inspection materials.
    const half = model.size.h / 2;
    this.thermal = createThermalMaterial({
      floorY: 0,
      ceilY: model.size.h + 0.25,
      doorZ: model.size.d / 2,
      cooled: model.cooled,
    });
    this.xrayMaterial = createXrayMaterial(model.accent);

    this.scanMaterial = createScanPlaneMaterial(model.accent);
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(model.size.w * 1.12, model.size.h * 1.08),
      this.scanMaterial,
    );
    scan.position.y = 0.04; // model-local units: walls are centered on y=0
    scan.visible = false;
    model.group.add(scan);
    this.scanPlane = scan;

    this.particleMaterial = createColdAirParticleMaterial(0x67e8f9);
    const particles = new THREE.Points(buildParticleGeometry(PARTICLE_COUNT), this.particleMaterial);
    particles.frustumCulled = false;
    particles.position.y = -model.restLift + half;
    model.group.add(particles);


    this.edgeLines = model.group.children.find(
      (child): child is THREE.LineSegments => (child as THREE.LineSegments).isLineSegments === true,
    ) ?? null;

    // Hotspot anchors track the unit's architecture.
    this.hotspotAnchors.temp.set(code === 'PMC' ? 0.3 : 0.42, model.size.h * 0.62, model.size.d / 2 + 0.06);
    this.hotspotAnchors.cargo.set(-model.size.w * 0.12, model.size.h * 0.34 + 0.35, -model.size.d * 0.16);
    this.hotspotAnchors.acid.set(model.size.w * 0.3, model.size.h * 0.34 + 0.3, model.size.d * 0.2);

    const rawRadius = Math.max(model.size.w, model.size.h, model.size.d) * 2.0;
    this.radiusBase = THREE.MathUtils.clamp(rawRadius, 3.0, 5.4);
    this.orbitTarget.set(0, THREE.MathUtils.clamp(model.size.h * 0.42, 0.5, 0.85), 0);
    this.orbitGoal.radius = this.radiusBase;
    this.orbit.radius = this.radiusBase;
    if (this.floorDisc) {
      const s = Math.max(model.size.w, model.size.d) * 0.62;
      this.floorDisc.scale.set(s, s, 1);
    }

    /* World-space occlusion hull for the hotspot fade, in rest pose: the
       exploded assembly suspends occlusion anyway, so a rest box keeps
       surface-mounted anchors from being shadowed by their own face.
       Computed once per unit swap — the group never moves after this. */
    this.occlusionBox = new THREE.Box3().setFromObject(model.group);

    this.applyMode(this.mode);
    this.applyDoorImmediate();
    this.applyExplosionImmediate();
    this.renderOnce();
    // A fresh unit may carry machinery (fan, LED) or animated inspection
    // modes — re-arm the loop even if the previous one had gone to sleep.
    this.wake();
  }

  private lastDoorApplied = -1;
  private lastExplosionApplied = -1;

  private applyDoorImmediate(): void {
    if (!this.model) return;
    this.model.applyDoor(this.doorSpring.position);
    this.lastDoorApplied = this.doorSpring.position;
  }

  private applyExplosionImmediate(): void {
    if (!this.model) return;
    for (const part of this.model.explodeParts) {
      const base = (part.object.userData as { explodeBase?: THREE.Vector3 }).explodeBase;
      const bx = base?.x ?? 0;
      const by = base?.y ?? 0;
      const bz = base?.z ?? 0;
      part.object.position.set(
        bx + part.direction.x * this.explosion,
        by + part.direction.y * this.explosion,
        bz + part.direction.z * this.explosion,
      );
    }
    this.lastExplosionApplied = this.explosion;
  }

  /**
   * Tears down the current unit. The group traversal disposes every attached
   * resource; the two inspection shaders may be *detached* while another mode
   * is live, so they are disposed explicitly — that is the one place a naive
   * traverse-only policy leaks GPU programs.
   */
  private unloadActiveModel(): void {
    if (!this.model) return;
    disposeObjectGraph(this.model.group);
    this.thermal?.material.dispose();
    this.thermal = null;
    this.xrayMaterial?.dispose();
    this.xrayMaterial = null;
    this.occlusionBox = null;
  }

  /* ── Render modes: swap materials by role, never rebuild geometry ─────── */
  private applyMode(mode: RenderMode): void {
    this.mode = mode;
    if (!this.model) return;
    const { group } = this.model;
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.userData.originalMaterial) mesh.userData.originalMaterial = mesh.material;
      const role = mesh.userData.role as string | undefined;
      const isShell = role === ROLE_SHELL || role === ROLE_FLOOR;
      if (mode === 'thermal' && isShell && this.thermal) {
        mesh.material = this.thermal.material;
      } else if (mode === 'xray' && isShell && this.xrayMaterial) {
        mesh.material = this.xrayMaterial;
      } else {
        mesh.material = mesh.userData.originalMaterial as THREE.Material;
      }
    });
    if (this.edgeLines) {
      const material = this.edgeLines.material as THREE.LineBasicMaterial;
      material.opacity = mode === 'xray' ? 0.95 : mode === 'thermal' ? 0.75 : 0.55;
    }
    if (this.scanPlane) this.scanPlane.visible = mode === 'xray';
    if (this.particleMaterial) {
      // X-ray keeps airflow faintly visible even through a sealed door.
      this.particleMaterial.uniforms.uIntensity.value = mode === 'xray' ? 0.55 : 1;
    }
    this.renderOnce();
  }

  setRenderMode(mode: RenderMode): void {
    if (mode !== this.mode) {
      this.applyMode(mode);
      // Thermal shimmer and the x-ray sweep are time-driven — the loop must
      // run for them; every other input path wakes on its own.
      this.wake();
    }
  }

  /* ── Interaction ──────────────────────────────────────────────────────── */
  setDoorOpen(open: boolean): void {
    this.doorTarget = open ? 1 : 0;
    if (this.reducedMotion) {
      this.doorSpring.position = this.doorTarget;
      this.applyDoorImmediate();
      this.renderOnce();
    }
    this.wake();
  }

  setExploded(exploded: boolean): void {
    this.explosionTarget = exploded ? 1 : 0;
    if (this.reducedMotion) {
      this.explosion = this.explosionTarget;
      this.applyExplosionImmediate();
      this.renderOnce();
    }
    this.wake();
  }

  setAutoRotate(active: boolean): void {
    this.autoRotate = active;
    this.wake();
  }

  setPreset(preset: CameraPreset): void {
    const target = PRESETS[preset];
    this.orbitGoal.theta = target.theta;
    this.orbitGoal.phi = target.phi;
    this.orbitGoal.radius = this.radiusBase * target.radiusScale;
    this.dragVelocity.theta = 0;
    this.dragVelocity.phi = 0;
    if (this.reducedMotion) {
      this.orbit.theta = this.orbitGoal.theta;
      this.orbit.phi = this.orbitGoal.phi;
      this.orbit.radius = this.orbitGoal.radius;
      this.renderOnce();
    }
    this.wake();
  }

  orbitBy(deltaTheta: number, deltaPhi: number): void {
    this.orbitGoal.theta += deltaTheta;
    this.orbitGoal.phi = THREE.MathUtils.clamp(this.orbitGoal.phi + deltaPhi, 0.12, Math.PI - 0.35);
    this.dragVelocity.theta = 0;
    this.dragVelocity.phi = 0;
    if (this.reducedMotion) {
      this.orbit.theta = this.orbitGoal.theta;
      this.orbit.phi = this.orbitGoal.phi;
      this.renderOnce();
    }
    this.wake();
  }

  zoomBy(deltaRadius: number): void {
    this.orbitGoal.radius = THREE.MathUtils.clamp(
      this.orbitGoal.radius + deltaRadius,
      this.radiusBase * 0.3,
      this.radiusBase * 2.4,
    );
    if (this.reducedMotion) {
      this.orbit.radius = this.orbitGoal.radius;
      this.renderOnce();
    }
    this.wake();
  }

  private attachPointer(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.dragging = true;
    this.dragVelocity.theta = 0;
    this.dragVelocity.phi = 0;
    this.lastPointer.x = event.clientX;
    this.lastPointer.y = event.clientY;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.wake();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer.x = event.clientX;
    this.lastPointer.y = event.clientY;
    const dTheta = dx * 0.008;
    const dPhi = THREE.MathUtils.clamp(dy, -80, 80) * 0.008;
    this.orbitGoal.theta += dTheta;
    this.orbitGoal.phi = THREE.MathUtils.clamp(this.orbitGoal.phi + dPhi, 0.12, Math.PI - 0.35);
    this.dragVelocity.theta = dTheta;
    this.dragVelocity.phi = dPhi;
    this.wake();
  };

  private readonly onPointerUp = (): void => {
    this.dragging = false;
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.zoomBy(event.deltaY * 0.0022);
  };

  /* ── Hotspots: projected to CSS, drawn by the DOM, pixel-sharp text ─────
     Each anchor is also occlusion-tested against the unit's world AABB:
     when the body of the container stands between the camera and the
     anchor, the pill fades instead of lying about what is visible. X-ray
     mode suspends the test — the shell is transparent by definition. */
  setHotspots(hotspots: HotspotSpec[]): void {
    this.hotspots = hotspots;
  }

  private projectHotspots(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;
    /* Occlusion only speaks while the interior is genuinely hidden: X-ray
       sees through walls, an open door exposes the payload bay, and an
       exploded assembly has no hull to hide behind. */
    const interiorVisible =
      this.mode === 'xray' || this.doorSpring.position > 0.55 || this.explosion > 0.4;
    const occlusionEnabled = !interiorVisible && this.occlusionBox !== null;
    for (let i = 0; i < this.hotspots.length; i++) {
      const hotspot = this.hotspots[i];
      const el = hotspot.element;
      if (!el) continue;
      const anchor = this.scratchVec.copy(this.hotspotAnchors[hotspot.id]);
      if (this.model) this.model.group.localToWorld(anchor);
      this.scratchVec2.copy(anchor).project(this.camera);
      const behindCamera = this.scratchVec2.z > 1;
      const x = (this.scratchVec2.x * 0.5 + 0.5) * w;
      const y = (-this.scratchVec2.y * 0.5 + 0.5) * h;
      const offscreen = behindCamera || x < -80 || x > w + 80 || y < -80 || y > h + 80;
      const display = offscreen ? 'none' : '';
      if (el.style.display !== display) el.style.display = display;
      if (offscreen) continue;

      let occluded = false;
      if (occlusionEnabled) {
        // Ray from camera toward the anchor: blocked when it crosses the
        // unit's hull meaningfully before the anchor — the margin keeps
        // surface-mounted pills from being shadowed by their own wall.
        this.anchorDir.copy(anchor).sub(this.camera.position);
        const anchorDistance = this.anchorDir.length();
        this.occlusionRay.origin.copy(this.camera.position);
        this.occlusionRay.direction.copy(this.anchorDir).multiplyScalar(1 / Math.max(1e-6, anchorDistance));
        const hit = this.occlusionRay.intersectBox(this.occlusionBox as THREE.Box3, this.occlusionHit);
        occluded = hit !== null && this.camera.position.distanceTo(hit) < anchorDistance - 0.22;
      }
      if (occluded !== this.hotspotOccluded[i]) {
        this.hotspotOccluded[i] = occluded;
        el.style.opacity = occluded ? '0.24' : '1';
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }

  /* ── Loop ─────────────────────────────────────────────────────────────── */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) this.wake();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (!reduced) this.wake();
    this.renderOnce();
  }

  onStats(callback: (stats: SceneStats) => void): void {
    this.statsCallback = callback;
  }

  private wake(): void {
    if (this.disposed || this.reducedMotion || !this.visible) return;
    if (this.rafId === 0) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private renderOnce(): void {
    if (this.disposed || !this.visible) return;
    if (this.rafId === 0) {
      this.draw(performance.now());
    }
    // When the loop is alive it will render the next frame anyway.
  }

  private readonly tick = (time: number): void => {
    this.rafId = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (time - this.lastTime) / 1000));
    this.lastTime = time;
    this.elapsed += dt;

    /* Camera easing (drag inertia decays into the goal orbit). */
    if (!this.dragging) {
      this.orbitGoal.theta += this.dragVelocity.theta;
      this.orbitGoal.phi = THREE.MathUtils.clamp(this.orbitGoal.phi + this.dragVelocity.phi, 0.12, Math.PI - 0.35);
      const inertia = Math.exp(-5.2 * dt);
      this.dragVelocity.theta *= inertia;
      this.dragVelocity.phi *= inertia;
    }
    if (this.autoRotate && !this.dragging) this.orbitGoal.theta += 0.28 * dt;
    this.orbit.theta = dampAngle(this.orbit.theta, this.orbitGoal.theta, CAMERA_SMOOTH, dt);
    this.orbit.phi = damp(this.orbit.phi, this.orbitGoal.phi, CAMERA_SMOOTH, dt);
    this.orbit.radius = damp(this.orbit.radius, this.orbitGoal.radius, CAMERA_SMOOTH, dt);

    /* Door + explosion springs. */
    stepSpring(this.doorSpring, this.doorTarget, dt, DOOR_SPRING_STIFFNESS);
    if (isSpringSettled(this.doorSpring, this.doorTarget)) {
      this.doorSpring.position = this.doorTarget;
      this.doorSpring.velocity = 0;
    }
    if (this.model && this.doorSpring.position !== this.lastDoorApplied) {
      this.model.applyDoor(this.doorSpring.position);
      this.lastDoorApplied = this.doorSpring.position;
    }

    this.explosion = damp(this.explosion, this.explosionTarget, EXPLODE_SMOOTH, dt);
    if (Math.abs(this.explosion - this.explosionTarget) < 0.003) this.explosion = this.explosionTarget;
    if (this.model && this.explosion !== this.lastExplosionApplied) {
      this.applyExplosionImmediate();
    }

    /* Machinery: condenser fan, status LED, scan aperture, particles. */
    const model = this.model;
    if (model?.machinery) {
      for (const spinner of model.machinery.spin) {
        spinner.rotation.y += dt * 7.5;
      }
      if (model.machinery.led) {
        model.machinery.led.emissiveIntensity = 1.1 + 0.75 * Math.sin(this.elapsed * 6.0);
      }
    }
    if (this.thermal) {
      this.thermal.uniforms.uTime.value = this.elapsed;
      this.thermal.uniforms.uDoorOpen.value = this.doorSpring.position;
    }
    if (this.scanMaterial && this.scanPlane && model) {
      this.scanMaterial.uniforms.uTime.value = this.elapsed;
      const span = model.size.d / 2 + 0.1;
      this.scanPlane.position.z = Math.sin(this.elapsed * 0.65) * span;
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime.value = this.elapsed;
      this.particleMaterial.uniforms.uDoorOpen.value = this.doorSpring.position;
    }

    this.draw(time);

    /* Quiescence: once every spring, easing curve and ambient effect is at
       rest, the honest frame budget is zero. Sleep after a short grace
       period; any intent (pointer, zoom, mode, door) re-wakes the loop. */
    if (this.isAmbientAnimated()) {
      this.idleTime = 0;
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.idleTime += dt * 1000;
      if (this.idleTime < QUIESCENT_GRACE_MS) {
        this.rafId = requestAnimationFrame(this.tick);
      } else {
        this.idleTime = 0;
        this.rafId = 0; // asleep — the last drawn frame stays valid.
      }
    }
  };

  /**
   * Everything that legitimately changes the picture from one frame to the
   * next. False means the scene is visually settled and the loop may sleep.
   */
  private isAmbientAnimated(): boolean {
    if (this.dragging) return true;
    if (this.autoRotate) return true;
    if (this.mode === 'thermal' || this.mode === 'xray') return true; // uTime drives both
    if (!isSpringSettled(this.doorSpring, this.doorTarget)) return true;
    if (Math.abs(this.explosion - this.explosionTarget) >= 0.003) return true;
    // Particles stream only while the aperture is open.
    if (this.doorSpring.position > 0.001) return true;
    const machinery = this.model?.machinery;
    if (machinery && (machinery.spin.length > 0 || machinery.led)) return true;
    // Camera still easing toward its goal, or drag inertia still decaying.
    if (Math.abs(this.orbit.theta - this.orbitGoal.theta) > 1e-3) return true;
    if (Math.abs(this.orbit.phi - this.orbitGoal.phi) > 1e-3) return true;
    if (Math.abs(this.orbit.radius - this.orbitGoal.radius) > 1e-3) return true;
    if (Math.abs(this.dragVelocity.theta) > 1e-4 || Math.abs(this.dragVelocity.phi) > 1e-4) return true;
    return false;
  }

  private draw(time: number): void {
    const { camera, orbit, orbitTarget } = this;
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      orbitTarget.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
      orbitTarget.y + orbit.radius * Math.cos(orbit.phi),
      orbitTarget.z + orbit.radius * sinPhi * Math.cos(orbit.theta),
    );
    camera.lookAt(orbitTarget);

    this.renderer.render(this.scene, camera);
    this.projectHotspots();

    /* 500 ms stat windows: fps, live draw calls, capped DPR. The per-frame
       contribution is capped so a sleep/wake gap can't poison the window. */
    this.frames += 1;
    this.statsAccumulator += Math.min(100, time - (this.lastStatTime || time));
    this.lastStatTime = time;
    if (this.statsAccumulator >= 500 && this.statsCallback) {
      this.statsCallback({
        fps: Math.round((this.frames * 1000) / this.statsAccumulator),
        draws: this.renderer.info.render.calls,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
      this.frames = 0;
      this.statsAccumulator = 0;
    }
  }

  private lastStatTime = 0;

  private applySize(): void {
    const host = this.canvas.parentElement ?? this.canvas;
    const rect = host.getBoundingClientRect();
    const width = Math.max(2, Math.round(rect.width));
    const height = Math.max(2, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  /* ── Zero-leak teardown ───────────────────────────────────────────────── */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.unloadActiveModel();
    disposeObjectGraph(this.floorHelpers);
    this.scene.remove(this.floorHelpers);
    if (this.envRenderTarget) this.envRenderTarget.dispose();
    if (this.pmrem) this.pmrem.dispose();
    releaseWebGL(this.renderer, this.scene);
  }
}
