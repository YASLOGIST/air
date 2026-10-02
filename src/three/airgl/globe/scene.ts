/* ── AIRGL · corridor network globe ───────────────────────────────────────
   The airway network rendered the way the data actually exists: great
   circles on a sphere. One scene, six draw calls, zero CPU animation —
   every moving element (arc sparks, aircraft traffic, hub pulses) is a
   closed-form function of time evaluated in the vertex shader.

   Draw calls (steady state):
     1. Fibonacci dot-shell (the planet, 2 400 points, one Points)
     2. Graticule (one merged LineSegments)
     3. Atmosphere rim (one inverted-hull additive sphere)
     4. Airport hubs (one Points, per-point shader pulse; CAI reads largest)
     5. Corridor arcs (all arcs merged into one LineSegments)
     6. Live traffic (one Points; GLSL great-circle slerp per aircraft)
────────────────────────────────────────────────────────────────────────── */

import * as THREE from 'three';
import { createAirRenderer, releaseWebGL } from '../gl';
import { damp, dampAngle } from '../easing';
import {
  arcApexHeight,
  facingYawFor,
  fibonacciSpherePoint,
  greatCircleAngle,
  greatCirclePoint,
  latLonToVec3,
  type Vec3Tuple,
} from '../geo';

export interface GlobeCorridor {
  id: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  /** Great-circle distance in km — drives traffic cadence. */
  distanceKm: number;
}

export interface GlobeHub {
  lat: number;
  lon: number;
  /** Multiplier on the pulsing disc. The hub airport (CAI) renders largest. */
  eminence: number;
  color: number;
}

const GLOBE_RADIUS = 1;
const SHELL_POINTS = 2400;
const ARC_SEGMENTS = 72;
const PLANES_PER_CORRIDOR = 2;
const AUTO_SPIN = 0.05;
const ROTATION_SMOOTH = 4.2;

/* ── GLSL ───────────────────────────────────────────────────────────────── */

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec3 vNormalV;
  uniform vec3 uColor;
  void main() {
    float rim = pow(max(0.68 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0), 3.2);
    gl_FragColor = vec4(uColor, rim * 0.85);
    #include <colorspace_fragment>
  }
`;

const ARC_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aArc;
  varying float vT;
  varying float vArc;
  void main() {
    vT = aT;
    vArc = aArc;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ARC_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vT;
  varying float vArc;
  uniform float uTime;
  uniform float uActiveArc;
  uniform vec3 uColor;
  uniform vec3 uActiveColor;
  void main() {
    // step() arithmetic keeps the focus test branch-free.
    float noneSelected = step(uActiveArc, -0.5);
    float focus = max(noneSelected, 1.0 - min(abs(vArc - uActiveArc), 1.0));
    float spark = pow(1.0 - fract(vT - uTime * 0.16), 6.0) * focus;
    vec3 color = mix(uColor * 0.22, uActiveColor, focus) * (0.55 + spark * 2.6);
    float alpha = 0.14 + focus * 0.5 + spark * 0.35;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const HUB_VERTEX = /* glsl */ `
  attribute float aEminence;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vPulse;
  uniform float uTime;
  uniform float uPointScale;
  void main() {
    vPulse = 0.7 + 0.3 * sin(uTime * 2.2 + aPhase * 6.2831);
    vColor = aColor;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aEminence * vPulse * uPointScale / max(0.6, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const HUB_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vPulse;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float halo = smoothstep(0.5, 0.08, dist) * 0.5;
    float core = smoothstep(0.16, 0.02, dist);
    gl_FragColor = vec4(vColor, (halo * vPulse + core));
    #include <colorspace_fragment>
  }
`;

const TRAFFIC_VERTEX = /* glsl */ `
  attribute vec3 aOrigin;
  attribute vec3 aDest;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aLift;
  varying float vEnroute;
  uniform float uTime;
  uniform float uPointScale;

  vec3 greatCirclePos(vec3 a, vec3 b, float t, float lift) {
    float omega = acos(clamp(dot(a, b), -1.0, 1.0));
    float sinOmega = max(sin(omega), 1e-4);
    vec3 dir = normalize((a * sin((1.0 - t) * omega) + b * sin(t * omega)) / sinOmega);
    return dir * (1.0 + lift * sin(3.14159 * t));
  }

  void main() {
    float t = fract(uTime * aSpeed + aPhase);
    vEnroute = sin(3.14159 * t);
    vec3 pos = greatCirclePos(aOrigin, aDest, t, aLift);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (5.0 + 3.0 * vEnroute) * uPointScale / max(0.6, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const TRAFFIC_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vEnroute;
  uniform vec3 uColor;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float core = smoothstep(0.42, 0.05, dist);
    float cross = smoothstep(0.06, 0.0, abs(gl_PointCoord.x - 0.5)) + smoothstep(0.06, 0.0, abs(gl_PointCoord.y - 0.5));
    float alpha = core * (0.55 + 0.45 * vEnroute) + cross * 0.18 * vEnroute;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

/* ── Scene ──────────────────────────────────────────────────────────────── */

export class CorridorGlobeScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly scene = new THREE.Scene();
  private readonly canvas: HTMLCanvasElement;
  private readonly globeGroup = new THREE.Group();
  private readonly resizeObserver: ResizeObserver;
  private readonly arcIds: string[] = [];

  private readonly pointScale = { value: 1 };
  private arcMaterial: THREE.ShaderMaterial | null = null;
  private hubMaterial: THREE.ShaderMaterial | null = null;
  private trafficMaterial: THREE.ShaderMaterial | null = null;
  private atmosphereMaterial: THREE.ShaderMaterial | null = null;

  /* Rest yaw presents the Mediterranean (CAI longitude ≈ 31.4°E) head-on. */
  private yaw = -0.55;
  private yawGoal = -0.55;
  private tilt = 0.34;
  private tiltGoal = 0.34;
  private spinVelocity = 0;
  private dragging = false;
  private lastPointerX = 0;

  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private visible = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private disposed = false;

  private statsCallback: ((stats: { fps: number; draws: number; dpr: number }) => void) | null = null;
  private frames = 0;
  private statsAccumulator = 0;
  private lastStatTime = 0;

  constructor(canvas: HTMLCanvasElement, corridors: GlobeCorridor[], hubs: GlobeHub[]) {
    this.canvas = canvas;
    // Alpha context: the section's CSS radial backdrop shows through the void.
    this.renderer = createAirRenderer(canvas, { alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    this.camera.up.set(0, 1, 0);

    this.scene.add(this.globeGroup);
    this.buildDotShell();
    this.buildGraticule();
    this.buildAtmosphere();
    this.buildHubs(hubs);
    this.buildArcsAndTraffic(corridors);

    this.attachPointer(canvas);
    const host = canvas.parentElement ?? canvas;
    this.resizeObserver = new ResizeObserver(() => this.applySize());
    this.resizeObserver.observe(host);
    this.applySize();
  }

  /* 1 — the planet shell. */
  private buildDotShell(): void {
    const positions = new Float32Array(SHELL_POINTS * 3);
    const colors = new Float32Array(SHELL_POINTS * 3);
    const base = new THREE.Color(0x14364c);
    const bright = new THREE.Color(0x2a6a8a);
    const mixed = new THREE.Color();
    for (let i = 0; i < SHELL_POINTS; i++) {
      const [x, y, z] = fibonacciSpherePoint(i, SHELL_POINTS, GLOBE_RADIUS);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      // Longitude bands brighten the tropics where the corridors actually live.
      const band = 0.5 + 0.5 * Math.sin(y * Math.PI * 1.6 + x * 0.5);
      mixed.copy(base).lerp(bright, band * 0.8);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    this.globeGroup.add(points);
  }

  /* 2 — merged lat/lon lattice. */
  private buildGraticule(): void {
    const verts: number[] = [];
    const radius = GLOBE_RADIUS * 0.995;
    const push = (a: Vec3Tuple, b: Vec3Tuple) => verts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    for (let latDeg = -60; latDeg <= 60; latDeg += 20) {
      let from = latLonToVec3(latDeg, -180, radius);
      for (let i = 1; i <= 120; i++) {
        const to = latLonToVec3(latDeg, -180 + (i / 120) * 360, radius);
        push(from, to);
        from = to;
      }
    }
    for (let lonDeg = -180; lonDeg < 180; lonDeg += 20) {
      let from = latLonToVec3(-85, lonDeg, radius);
      for (let lat = -85 + 2; lat <= 85; lat += 2) {
        const to = latLonToVec3(lat, lonDeg, radius);
        push(from, to);
        from = to;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const material = new THREE.LineBasicMaterial({ color: 0x0e2c40, transparent: true, opacity: 0.5 });
    this.globeGroup.add(new THREE.LineSegments(geometry, material));
  }

  /* 3 — fresnel atmosphere rim. */
  private buildAtmosphere(): void {
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      uniforms: { uColor: { value: new THREE.Color(0x1d9ee0) } },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1.13, 48, 32), this.atmosphereMaterial));
  }

  /* 4 — airport hub beacons (CAI eminence 2.6 reads as the destination). */
  private buildHubs(hubs: GlobeHub[]): void {
    const count = hubs.length;
    const positions = new Float32Array(count * 3);
    const eminence = new Float32Array(count);
    const phase = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();
    hubs.forEach((hub, i) => {
      const [x, y, z] = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.002);
      positions.set([x, y, z], i * 3);
      eminence[i] = 14 * hub.eminence;
      phase[i] = (i * 0.37) % 1;
      scratch.setHex(hub.color);
      colors.set([scratch.r, scratch.g, scratch.b], i * 3);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aEminence', new THREE.BufferAttribute(eminence, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.hubMaterial = new THREE.ShaderMaterial({
      vertexShader: HUB_VERTEX,
      fragmentShader: HUB_FRAGMENT,
      uniforms: { uTime: { value: 0 }, uPointScale: this.pointScale },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.globeGroup.add(new THREE.Points(geometry, this.hubMaterial));
  }

  /* 5+6 — arcs and the traffic riding them. */
  private buildArcsAndTraffic(corridors: GlobeCorridor[]): void {
    const origin: Vec3Tuple = [0, 0, 0];
    const dest: Vec3Tuple = [0, 0, 0];
    const current: Vec3Tuple = [0, 0, 0];

    const arcVertices: number[] = [];
    const arcT: number[] = [];
    const arcIndex: number[] = [];

    const trafficCount = corridors.length * PLANES_PER_CORRIDOR;
    const tOrigin = new Float32Array(trafficCount * 3);
    const tDest = new Float32Array(trafficCount * 3);
    const tPhase = new Float32Array(trafficCount);
    const tSpeed = new Float32Array(trafficCount);
    const tLift = new Float32Array(trafficCount);
    const tPositions = new Float32Array(trafficCount * 3); // required by three; shader ignores it

    corridors.forEach((corridor, i) => {
      this.arcIds.push(corridor.id);
      const from = latLonToVec3(corridor.fromLat, corridor.fromLon, GLOBE_RADIUS, origin);
      const to = latLonToVec3(corridor.toLat, corridor.toLon, GLOBE_RADIUS, dest);
      const lift = arcApexHeight(greatCircleAngle(from, to), GLOBE_RADIUS);

      // GL_LINES pairs; aT drives the inbound spark, aArc the focus test.
      let px = 0;
      let py = 0;
      let pz = 0;
      for (let s = 0; s <= ARC_SEGMENTS; s++) {
        const t = s / ARC_SEGMENTS;
        const dir = greatCirclePoint(from, to, t, GLOBE_RADIUS, lift, current);
        if (s > 0) {
          arcVertices.push(px, py, pz, dir[0], dir[1], dir[2]);
          arcT.push((s - 1) / ARC_SEGMENTS, t);
          arcIndex.push(i, i);
        }
        px = dir[0];
        py = dir[1];
        pz = dir[2];
      }

      for (let plane = 0; plane < PLANES_PER_CORRIDOR; plane++) {
        const idx = i * PLANES_PER_CORRIDOR + plane;
        tOrigin.set(from, idx * 3);
        tDest.set(dest, idx * 3);
        tPhase[idx] = plane / PLANES_PER_CORRIDOR + (i * 0.17) % 1;
        // Long hauls keep aircraft aloft longer between departures.
        tSpeed[idx] = 2200 / (corridor.distanceKm * 60);
        tLift[idx] = lift;
      }
    });

    const arcGeometry = new THREE.BufferGeometry();
    arcGeometry.setAttribute('position', new THREE.Float32BufferAttribute(arcVertices, 3));
    arcGeometry.setAttribute('aT', new THREE.Float32BufferAttribute(arcT, 1));
    arcGeometry.setAttribute('aArc', new THREE.Float32BufferAttribute(arcIndex, 1));
    this.arcMaterial = new THREE.ShaderMaterial({
      vertexShader: ARC_VERTEX,
      fragmentShader: ARC_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uActiveArc: { value: -1 },
        uColor: { value: new THREE.Color(0x155e75) },
        uActiveColor: { value: new THREE.Color(0x22d3ee) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.globeGroup.add(new THREE.LineSegments(arcGeometry, this.arcMaterial));

    const trafficGeometry = new THREE.BufferGeometry();
    trafficGeometry.setAttribute('position', new THREE.BufferAttribute(tPositions, 3));
    trafficGeometry.setAttribute('aOrigin', new THREE.BufferAttribute(tOrigin, 3));
    trafficGeometry.setAttribute('aDest', new THREE.BufferAttribute(tDest, 3));
    trafficGeometry.setAttribute('aPhase', new THREE.BufferAttribute(tPhase, 1));
    trafficGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(tSpeed, 1));
    trafficGeometry.setAttribute('aLift', new THREE.BufferAttribute(tLift, 1));
    const bounding = new THREE.Sphere(new THREE.Vector3(), 3);
    trafficGeometry.boundingSphere = bounding;
    this.trafficMaterial = new THREE.ShaderMaterial({
      vertexShader: TRAFFIC_VERTEX,
      fragmentShader: TRAFFIC_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPointScale: this.pointScale,
        uColor: { value: new THREE.Color(0xa5f3fc) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const traffic = new THREE.Points(trafficGeometry, this.trafficMaterial);
    traffic.frustumCulled = false;
    this.globeGroup.add(traffic);
  }

  /* ── Public API (react wrapper intents) ─────────────────────────────── */
  setActiveCorridor(id: string | null, endpoints?: { fromLat: number; fromLon: number; toLat: number; toLon: number }): void {
    const index = id ? this.arcIds.indexOf(id) : -1;
    if (this.arcMaterial) this.arcMaterial.uniforms.uActiveArc.value = index;
    if (index >= 0 && endpoints) {
      const from = latLonToVec3(endpoints.fromLat, endpoints.fromLon, GLOBE_RADIUS);
      const to = latLonToVec3(endpoints.toLat, endpoints.toLon, GLOBE_RADIUS);
      this.yawGoal = facingYawFor(from, to);
    }
    if (this.reducedMotion) {
      this.yaw = this.yawGoal;
      this.renderOnce();
    }
    this.wake();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) this.wake();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (!reduced) this.wake();
    this.renderOnce();
  }

  onStats(callback: (stats: { fps: number; draws: number; dpr: number }) => void): void {
    this.statsCallback = callback;
  }

  /* ── Loop: damped spin + two uniforms + camera. That's the whole frame. ── */
  private wake(): void {
    if (this.disposed || this.reducedMotion || !this.visible) return;
    if (this.rafId === 0) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private renderOnce(): void {
    if (this.disposed || !this.visible || this.rafId !== 0) return;
    this.draw(performance.now());
  }

  private readonly tick = (time: number): void => {
    this.rafId = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (time - this.lastTime) / 1000));
    this.lastTime = time;
    this.elapsed += dt;

    if (!this.dragging) this.yawGoal += AUTO_SPIN * dt + this.spinVelocity;
    this.spinVelocity *= Math.exp(-4.5 * dt);
    this.yaw = dampAngle(this.yaw, this.yawGoal, ROTATION_SMOOTH, dt);
    this.tilt = damp(this.tilt, this.tiltGoal, ROTATION_SMOOTH, dt);
    this.globeGroup.rotation.set(this.tilt, this.yaw, 0);

    if (this.arcMaterial) this.arcMaterial.uniforms.uTime.value = this.elapsed;
    if (this.hubMaterial) this.hubMaterial.uniforms.uTime.value = this.elapsed;
    if (this.trafficMaterial) this.trafficMaterial.uniforms.uTime.value = this.elapsed;

    this.draw(time);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(time: number): void {
    this.camera.position.set(0, 0.16, 3.05);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);

    this.frames += 1;
    this.statsAccumulator += time - (this.lastStatTime || time);
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

  private attachPointer(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.dragging = true;
    this.spinVelocity = 0;
    this.lastPointerX = event.clientX;
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastPointerX;
    this.lastPointerX = event.clientX;
    this.yawGoal += dx * 0.005;
    this.spinVelocity = dx * 0.0016;
    this.wake();
  };

  private readonly onPointerUp = (): void => {
    this.dragging = false;
  };

  private applySize(): void {
    const host = this.canvas.parentElement ?? this.canvas;
    const rect = host.getBoundingClientRect();
    const width = Math.max(2, Math.round(rect.width));
    const height = Math.max(2, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const heightPx = height * Math.min(window.devicePixelRatio || 1, 2);
    this.pointScale.value = (0.5 * heightPx * this.camera.projectionMatrix.elements[5]) / 240;
    this.renderOnce();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    releaseWebGL(this.renderer, this.scene);
  }
}


