/* ── AIRGL · great-circle network globe ───────────────────────────────
   A chart of the planet, not a photograph of it. One 66 KiB coastline mask
   rasterised from Natural Earth 1:50m drives flat land, ocean and coastline
   ink; everything else is drawn as line art on top. The palette follows the
   page: white ground with blue coastlines in daylight, deep navy after dark.

   The point of the section is the network, so the sphere is deliberately the
   quietest thing in the frame and the corridors are the loudest.

   Everything that moves on the sphere is a closed-form function of time
   evaluated on the GPU, so the CPU cost of the whole scene is one camera
   update per frame:

     1. Earth surface    — one sphere, one draw, one texture fetch: land,
                           ocean, coastline and a limb falloff in one shader.
     2. Graticule        — one merged LineSegments, faint reference lattice.
     3. Great-circle arcs— tapered ribbons (two triangles per segment) that fade
                           at the edges, so lines glow instead of stair-stepping.
     4. Live traffic     — one Points cloud; the shader slerps each aircraft
                           along its great circle and rotates an aircraft
                           silhouette to match its ground track on screen.
     5. Airport hubs     — one Points cloud with pulsing rings; CAI reads largest.

   Cost policy: five draw calls, no atmosphere shells, no noise, no cloud
   layer. Textures load once (66 KiB), idle frames are budgeted to 30 fps, and
   the loop parks itself whenever the section is off-screen, the tab is hidden
   or the user prefers reduced motion.
────────────────────────────────────────────────────────────────────────── */

import * as THREE from 'three';
import { createAirRenderer, releaseWebGL, watchContextLoss } from '../gl';
import { damp, dampAngle } from '../easing';
import {
  arcApexHeight,
  facingTiltFor,
  facingYawFor,
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
const ARC_SEGMENTS = 96;
const PLANES_PER_CORRIDOR = 3;
/** Slow, stately drift — a planet seen from orbit, not a carousel. */
const AUTO_SPIN = 0.021;
const ROTATION_SMOOTH = 3.2;
const ZOOM_SMOOTH = 5.5;
/* A 34° vertical FOV puts the sphere's limb at asin(1/d) from centre; d = 4.35
   frames the planet with enough margin above the northern limb for corridors
   to arc clear of it without being cropped by the canvas. */
const REST_RADIUS = 4.35;
const MIN_RADIUS = 3.4;
const MAX_RADIUS = 5.9;
/* Idle redraw budget. The globe drifts slowly, so 30 fps is indistinguishable
   from 60 while halving the GPU work that competes with page scrolling. Drag,
   zoom and focus animations still render on every frame. */
const IDLE_FRAME_MS = 1000 / 30;
const TEXTURE_BASE = '/assets/earth';

/** One flat palette per theme. The globe is a chart, not a photograph: every
 *  value here is chosen to keep the corridor network the highest-contrast
 *  thing on the sphere. */
export type GlobeTheme = 'light' | 'dark';

interface GlobePalette {
  ocean: number;
  land: number;
  coast: number;
  limb: number;
  graticule: number;
  graticuleOpacity: number;
  arc: number;
  arcActive: number;
  traffic: number;
  /** Line art is added on dark and painted on light: additive blending over a
   *  white ground would erase the network. */
  additive: boolean;
}

const PALETTES: Record<GlobeTheme, GlobePalette> = {
  light: {
    /* Land carries the blue, ocean stays paper-white. The eye reads the
       smaller, tinted mass as the figure; a pale ocean on a white ground
       dissolved the coastline entirely. */
    ocean: 0xffffff,
    land: 0xc2dbee,
    coast: 0x2f7aa8,
    limb: 0x7fb0d0,
    graticule: 0x7fa8c4,
    graticuleOpacity: 0.38,
    arc: 0x3d8fbd,
    arcActive: 0x0369a1,
    traffic: 0x0b4a6f,
    additive: false,
  },
  dark: {
    ocean: 0x08192b,
    land: 0x13324a,
    coast: 0x3579a3,
    limb: 0x2e6e97,
    graticule: 0x86b6d8,
    graticuleOpacity: 0.085,
    arc: 0x3fa8d4,
    arcActive: 0x63e6ff,
    traffic: 0xd8f6ff,
    additive: true,
  },
};

/* ── GLSL ───────────────────────────────────────────────────────────────── */

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalV;
  void main() {
    vLocal = normalize(position);
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* A chart of the planet, not a photograph of it. One texture fetch, two
   smoothsteps and a limb term: no noise, no clouds, no sun simulation, so the
   shader costs almost nothing to re-rasterise while the page scrolls.

   The coastline is the edge of the same mask, which is why the outline stays
   crisp at any zoom without a second map or a line layer. */
const SURFACE_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform sampler2D uLand;
  uniform float uLandReady;
  uniform vec3 uOcean;
  uniform vec3 uLandColor;
  uniform vec3 uCoast;
  uniform vec3 uLimb;
  varying vec3 vLocal;
  varying vec3 vNormalV;

  const float PI = 3.14159265359;

  void main() {
    vec3 n = normalize(vLocal);
    float lon = atan(n.x, n.z);
    float lat = asin(clamp(n.y, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);

    float mask = texture2D(uLand, uv).r * uLandReady;
    float land = smoothstep(0.47, 0.53, mask);
    float coast = smoothstep(0.455, 0.49, mask) * (1.0 - smoothstep(0.51, 0.545, mask));

    vec3 col = mix(uOcean, uLandColor, land);
    col = mix(col, uCoast, coast * 0.9);

    /* One soft falloff toward the silhouette so a flat disc still reads as a
       sphere, plus a thin rim of atmosphere colour on the very edge. */
    float facing = clamp(dot(normalize(vNormalV), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    col *= 1.0 - 0.16 * (1.0 - smoothstep(0.0, 0.85, facing));
    col = mix(col, uLimb, pow(1.0 - facing, 5.0) * 0.6);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const ARC_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aArc;
  attribute float aSide;
  varying float vT;
  varying float vArc;
  varying float vSide;
  varying float vHidden;
  uniform float uGlobeViewZ;
  void main() {
    vT = aT;
    vArc = aArc;
    vSide = aSide;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    /* The camera orbits a unit sphere at the origin, so in view space the
       planet's centre sits at (0, 0, uGlobeViewZ). A point on an arc is behind
       the planet when the segment from the eye to that point passes within one
       radius of the centre. That test is three dot products, so corridors on
       the far side can be dimmed instead of being sliced off by the depth
       buffer — the whole network stays readable in one draw call. */
    vec3 eyeToPoint = normalize(mv.xyz);
    float along = dot(vec3(0.0, 0.0, uGlobeViewZ), eyeToPoint);
    float missDistance = length(vec3(0.0, 0.0, uGlobeViewZ) - along * eyeToPoint);
    vHidden = along <= 0.0 ? 0.0 : 1.0 - smoothstep(0.90, 1.10, missDistance);
  }
`;

/* A ribbon rather than a hairline: the alpha falls off to both edges, which is
   what makes a corridor read as a beam of light with a bright core. */
const ARC_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vT;
  varying float vArc;
  varying float vSide;
  varying float vHidden;
  uniform float uTime;
  uniform float uActiveArc;
  uniform float uFocus;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uActiveColor;
  void main() {
    float noneSelected = step(uActiveArc, -0.5);
    float isActive = (1.0 - min(abs(vArc - uActiveArc), 1.0)) * uFocus;
    float focus = max(noneSelected * 0.25, isActive);

    /* A packet travelling origin -> destination, plus a faint return flow. */
    float travel = fract(vT - uTime * 0.14);
    float spark = pow(1.0 - travel, 9.0);
    float counter = pow(fract(vT + uTime * 0.07), 14.0) * 0.4;

    float edge = smoothstep(1.0, 0.1, abs(vSide));
    /* Additive on navy, where extra light is the glow. On the white chart the
       same maths would clip to white, so the spark only boosts alpha there. */
    vec3 color = mix(uColor, uActiveColor, clamp(focus * 1.4, 0.0, 1.0))
      * (0.75 + (spark * 2.2 + counter * focus) * mix(0.22, 1.0, uGlow));
    float alpha = (0.30 + focus * 0.55 + (spark + counter) * (0.45 + focus * 0.5)) * edge;
    /* Far-side lanes survive as a faint underlay: they are drawn over the disc,
       which reads as a transparent network globe rather than a solid ball with
       secrets. On paper they sit lighter still so the near face stays dominant. */
    alpha *= mix(1.0, mix(0.16, 0.30, uGlow), vHidden);
    /* Ink lines are heavier than light lines, so thin them on the white chart. */
    alpha *= mix(0.58, 1.0, uGlow);
    gl_FragColor = vec4(color, alpha);
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
  varying vec2 vHeading;
  uniform float uTime;
  uniform float uPointScale;

  vec3 gcPos(vec3 a, vec3 b, float t, float lift) {
    float omega = acos(clamp(dot(a, b), -1.0, 1.0));
    float sinOmega = max(sin(omega), 1e-4);
    vec3 dir = normalize((a * sin((1.0 - t) * omega) + b * sin(t * omega)) / sinOmega);
    return dir * (1.0 + lift * sin(3.14159 * t));
  }

  void main() {
    float t = fract(uTime * aSpeed + aPhase);
    vEnroute = sin(3.14159 * t);
    vec3 pos = gcPos(aOrigin, aDest, t, aLift);

    /* Project a point slightly ahead to get the on-screen ground track, so the
       silhouette can point where the aircraft is actually going. */
    vec3 ahead = gcPos(aOrigin, aDest, min(t + 0.01, 1.0), aLift);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 mvAhead = modelViewMatrix * vec4(ahead, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec4 clipAhead = projectionMatrix * mvAhead;
    vec2 delta = clipAhead.xy / max(0.001, clipAhead.w) - clip.xy / max(0.001, clip.w);
    vHeading = length(delta) > 1e-5 ? normalize(delta) : vec2(0.0, 1.0);

    gl_PointSize = (15.0 + 9.0 * vEnroute) * uPointScale / max(0.6, -mv.z);
    gl_Position = clip;
  }
`;

/* Aircraft silhouette drawn inside the point sprite, rotated onto the ground
   track computed above. Reads as traffic in motion at 10 px, which a dot does
   not. */
const TRAFFIC_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vEnroute;
  varying vec2 vHeading;
  uniform vec3 uColor;
  uniform float uGlow;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    p.y = -p.y;
    float angle = atan(vHeading.y, vHeading.x);
    float ca = cos(-angle), sa = sin(-angle);
    p = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);

    float fuselage = smoothstep(0.085, 0.015, abs(p.y)) * smoothstep(0.68, 0.50, p.x) * smoothstep(-0.58, -0.42, p.x);
    float wings = smoothstep(0.055, 0.0, abs(p.x + 0.02)) * smoothstep(0.44, 0.30, abs(p.y));
    float tail = smoothstep(0.038, 0.0, abs(p.x + 0.42)) * smoothstep(0.20, 0.10, abs(p.y));
    float body = clamp(fuselage + wings + tail, 0.0, 1.0);

    float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * 0.30 * vEnroute * uGlow;
    /* The silhouette is dark ink on paper, so it needs less weight than a
       glowing sprite on navy. */
    float alpha = (body * (0.75 + 0.25 * vEnroute) + glow) * mix(0.62, 1.0, uGlow);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
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
    vPulse = 0.7 + 0.3 * sin(uTime * 1.8 + aPhase * 6.2831);
    vColor = aColor;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aEminence * (0.85 + 0.3 * vPulse) * uPointScale / max(0.6, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const HUB_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vPulse;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(0.20, 0.02, r);
    float ring = smoothstep(0.66, 0.52, r) * smoothstep(0.30, 0.46, r) * vPulse;
    float halo = smoothstep(1.0, 0.0, r) * 0.18;
    float alpha = core + ring * 0.8 + halo;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
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
  private readonly textures: THREE.Texture[] = [];

  private readonly pointScale = { value: 1 };
  private arcMaterial: THREE.ShaderMaterial | null = null;
  private hubMaterial: THREE.ShaderMaterial | null = null;
  private trafficMaterial: THREE.ShaderMaterial | null = null;
  private surfaceMaterial: THREE.ShaderMaterial | null = null;
  private graticuleMaterial: THREE.LineBasicMaterial | null = null;

  /* Focus easing: the active arc blooms in rather than snapping. */
  private focusTarget = 0;
  private focusValue = 0;

  /* The coastline arrives asynchronously; the surface fades it in. */
  private landReady = 0;
  private landReadyTarget = 0;
  private readyCallback: (() => void) | null = null;

  /* Rest pose centres the network's centroid (~30°N, 30°E): the Mediterranean,
     with Europe above it and the Gulf below, so every hub sits well inside the
     disc instead of being foreshortened against the limb. */
  private yaw = -0.62;
  private yawGoal = -0.62;
  private tilt = 0.56;
  private tiltGoal = 0.56;
  private radius = REST_RADIUS;
  private radiusGoal = REST_RADIUS;
  private spinVelocity = 0;
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private idleBefore = 0;

  /* Theme. The wrapper mirrors documentElement[data-theme] into this; the
     scene owns nothing but the palette it renders with. */
  private theme: GlobeTheme = 'dark';
  private readonly hubColors: number[] = [];
  /* Rebound to the real attribute once the beacon cloud is built. */
  private hubGeometryColors = new THREE.BufferAttribute(new Float32Array(0), 3);

  private rafId = 0;
  private lastTime = 0;
  private lastDrawTime = 0;
  private elapsed = 0;
  private visible = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private disposed = false;

  private statsCallback: ((stats: { fps: number; draws: number; dpr: number }) => void) | null = null;
  private frames = 0;
  private statsAccumulator = 0;
  private lastStatTime = 0;

  private contextLost = false;
  private contextCallback: ((lost: boolean) => void) | null = null;
  private readonly stopWatchingContext: () => void;

  constructor(canvas: HTMLCanvasElement, corridors: GlobeCorridor[], hubs: GlobeHub[]) {
    this.canvas = canvas;
    this.renderer = createAirRenderer(canvas, { alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    this.camera.up.set(0, 1, 0);

    this.scene.add(this.globeGroup);
    this.buildSurface();
    this.buildGraticule();
    this.buildHubs(hubs);
    this.buildArcsAndTraffic(corridors);
    this.applyPalette();

    this.attachPointer(canvas);
    this.stopWatchingContext = watchContextLoss(canvas, {
      onLost: () => this.handleContextLost(),
      onRestored: () => this.handleContextRestored(),
    });
    const host = canvas.parentElement ?? canvas;
    this.resizeObserver = new ResizeObserver(() => this.applySize());
    this.resizeObserver.observe(host);
    this.applySize();
  }

  onContextChange(callback: (lost: boolean) => void): void {
    this.contextCallback = callback;
  }

  /** Fires once both map layers are resident; the wrapper uses it to retire
      its loading shimmer at the right moment instead of on a timer. */
  onReady(callback: () => void): void {
    this.readyCallback = callback;
  }

  private handleContextLost(): void {
    this.contextLost = true;
    if (this.rafId !== 0) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.contextCallback?.(true);
  }

  private handleContextRestored(): void {
    this.contextLost = false;
    this.contextCallback?.(false);
    this.renderOnce();
    this.wake();
  }

  /* 1 — the planet. */
  private buildSurface(): void {
    const land = new THREE.TextureLoader().load(`${TEXTURE_BASE}/earth-land.png`, () => {
      this.landReadyTarget = 1;
      this.readyCallback?.();
      this.wake();
    });
    land.colorSpace = THREE.NoColorSpace; // data map: raw coverage, no sRGB decode
    land.wrapS = THREE.RepeatWrapping; // longitude wraps at the antimeridian
    land.wrapT = THREE.ClampToEdgeWrapping;
    land.minFilter = THREE.LinearMipmapLinearFilter;
    land.magFilter = THREE.LinearFilter;
    land.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.push(land);

    const palette = PALETTES[this.theme];
    this.surfaceMaterial = new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      uniforms: {
        uLand: { value: land },
        uLandReady: { value: 0 },
        uOcean: { value: new THREE.Color(palette.ocean) },
        uLandColor: { value: new THREE.Color(palette.land) },
        uCoast: { value: new THREE.Color(palette.coast) },
        uLimb: { value: new THREE.Color(palette.limb) },
      },
    });
    /* 96×48 segments: the silhouette is this canvas's only curve, and 48 bands
       keep it clean at the sizes the card is displayed without a vertex buffer
       that costs more than the fragment work it feeds. */
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 48);
    this.globeGroup.add(new THREE.Mesh(geometry, this.surfaceMaterial));
  }

  /* 2 — reference lattice, deliberately faint: the geography is the subject. */
  private buildGraticule(): void {
    const verts: number[] = [];
    const radius = GLOBE_RADIUS * 1.001;
    const push = (a: Vec3Tuple, b: Vec3Tuple) => verts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
      let from = latLonToVec3(latDeg, -180, radius);
      for (let i = 1; i <= 120; i++) {
        const to = latLonToVec3(latDeg, -180 + (i / 120) * 360, radius);
        push(from, to);
        from = to;
      }
    }
    for (let lonDeg = -180; lonDeg < 180; lonDeg += 30) {
      let from = latLonToVec3(-85, lonDeg, radius);
      for (let lat = -85 + 2.5; lat <= 85; lat += 2.5) {
        const to = latLonToVec3(lat, lonDeg, radius);
        push(from, to);
        from = to;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const palette = PALETTES[this.theme];
    this.graticuleMaterial = new THREE.LineBasicMaterial({
      color: palette.graticule,
      transparent: true,
      opacity: palette.graticuleOpacity,
      depthWrite: false,
    });
    this.globeGroup.add(new THREE.LineSegments(geometry, this.graticuleMaterial));
  }

  /* 3 — airport beacons. */
  private buildHubs(hubs: GlobeHub[]): void {
    const count = hubs.length;
    const positions = new Float32Array(count * 3);
    const eminence = new Float32Array(count);
    const phase = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    hubs.forEach((hub, i) => {
      const [x, y, z] = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.004);
      positions.set([x, y, z], i * 3);
      eminence[i] = 15 * hub.eminence;
      phase[i] = (i * 0.37) % 1;
      /* Hues are authored by the wrapper; applyPalette() derives the ink that
         actually reads against the current ground. */
      this.hubColors.push(hub.color);
    });
    const geometry = new THREE.BufferGeometry();
    this.hubGeometryColors = new THREE.BufferAttribute(colors, 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aEminence', new THREE.BufferAttribute(eminence, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute('aColor', this.hubGeometryColors);
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

  /* 4+5 — corridors as tapered ribbons, and the traffic riding them. */
  private buildArcsAndTraffic(corridors: GlobeCorridor[]): void {
    const origin: Vec3Tuple = [0, 0, 0];
    const dest: Vec3Tuple = [0, 0, 0];
    const current: Vec3Tuple = [0, 0, 0];
    const next: Vec3Tuple = [0, 0, 0];

    const ribbonPositions: number[] = [];
    const ribbonT: number[] = [];
    const ribbonArc: number[] = [];
    const ribbonSide: number[] = [];

    const trafficCount = corridors.length * PLANES_PER_CORRIDOR;
    const tOrigin = new Float32Array(trafficCount * 3);
    const tDest = new Float32Array(trafficCount * 3);
    const tPhase = new Float32Array(trafficCount);
    const tSpeed = new Float32Array(trafficCount);
    const tLift = new Float32Array(trafficCount);
    const tPositions = new Float32Array(trafficCount * 3); // required by three; shader ignores it

    /* Ribbon half-width in world units. Wide enough to read as a beam at rest
       zoom, narrow enough that it never swallows the coastline. */
    const HALF_WIDTH = 0.0052;

    corridors.forEach((corridor, arcIndex) => {
      this.arcIds.push(corridor.id);
      const from = latLonToVec3(corridor.fromLat, corridor.fromLon, GLOBE_RADIUS, origin);
      const to = latLonToVec3(corridor.toLat, corridor.toLon, GLOBE_RADIUS, dest);
      const lift = arcApexHeight(greatCircleAngle(from, to), GLOBE_RADIUS);

      for (let s = 0; s < ARC_SEGMENTS; s++) {
        const t0 = s / ARC_SEGMENTS;
        const t1 = (s + 1) / ARC_SEGMENTS;
        const p0 = greatCirclePoint(from, to, t0, GLOBE_RADIUS, lift, current).slice() as Vec3Tuple;
        const p1 = greatCirclePoint(from, to, t1, GLOBE_RADIUS, lift, next).slice() as Vec3Tuple;
        const tangent: Vec3Tuple = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
        const up: Vec3Tuple = [p1[0], p1[1], p1[2]];
        /* width axis = tangent × up, normalised; falls back to the radial
           direction at degenerate points (never hit in practice). */
        let wx = tangent[1] * up[2] - tangent[2] * up[1];
        let wy = tangent[2] * up[0] - tangent[0] * up[2];
        let wz = tangent[0] * up[1] - tangent[1] * up[0];
        const wlen = Math.hypot(wx, wy, wz) || 1;
        wx /= wlen;
        wy /= wlen;
        wz /= wlen;
        /* Taper: thin at both ends so a corridor leaves and joins the field
           cleanly instead of stopping in mid-air. */
        const taper0 = Math.sin(Math.PI * t0) ** 0.55;
        const taper1 = Math.sin(Math.PI * t1) ** 0.55;
        const w0 = HALF_WIDTH * taper0;
        const w1 = HALF_WIDTH * taper1;

        // Two triangles: (p0-, p0+, p1+) and (p0-, p1+, p1-)
        const v = (p: Vec3Tuple, w: number, side: number, t: number) => {
          ribbonPositions.push(p[0] + wx * w * side, p[1] + wy * w * side, p[2] + wz * w * side);
          ribbonT.push(t);
          ribbonArc.push(arcIndex);
          ribbonSide.push(side);
        };
        v(p0, w0, -1, t0);
        v(p0, w0, 1, t0);
        v(p1, w1, 1, t1);
        v(p0, w0, -1, t0);
        v(p1, w1, 1, t1);
        v(p1, w1, -1, t1);
      }

      for (let plane = 0; plane < PLANES_PER_CORRIDOR; plane++) {
        const idx = arcIndex * PLANES_PER_CORRIDOR + plane;
        tOrigin.set(from, idx * 3);
        tDest.set(dest, idx * 3);
        tPhase[idx] = plane / PLANES_PER_CORRIDOR + ((arcIndex * 0.17) % 1);
        tSpeed[idx] = 2200 / (corridor.distanceKm * 60);
        tLift[idx] = lift;
      }
    });

    const arcGeometry = new THREE.BufferGeometry();
    arcGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ribbonPositions, 3));
    arcGeometry.setAttribute('aT', new THREE.Float32BufferAttribute(ribbonT, 1));
    arcGeometry.setAttribute('aArc', new THREE.Float32BufferAttribute(ribbonArc, 1));
    arcGeometry.setAttribute('aSide', new THREE.Float32BufferAttribute(ribbonSide, 1));
    this.arcMaterial = new THREE.ShaderMaterial({
      vertexShader: ARC_VERTEX,
      fragmentShader: ARC_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uActiveArc: { value: -1 },
        uFocus: { value: 0 },
        uGlow: { value: 1 },
        uColor: { value: new THREE.Color(0x3fa8d4) },
        uActiveColor: { value: new THREE.Color(0x63e6ff) },
        uGlobeViewZ: { value: -REST_RADIUS },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.globeGroup.add(new THREE.Mesh(arcGeometry, this.arcMaterial));


    const trafficGeometry = new THREE.BufferGeometry();
    trafficGeometry.setAttribute('position', new THREE.BufferAttribute(tPositions, 3));
    trafficGeometry.setAttribute('aOrigin', new THREE.BufferAttribute(tOrigin, 3));
    trafficGeometry.setAttribute('aDest', new THREE.BufferAttribute(tDest, 3));
    trafficGeometry.setAttribute('aPhase', new THREE.BufferAttribute(tPhase, 1));
    trafficGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(tSpeed, 1));
    trafficGeometry.setAttribute('aLift', new THREE.BufferAttribute(tLift, 1));
    trafficGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);
    this.trafficMaterial = new THREE.ShaderMaterial({
      vertexShader: TRAFFIC_VERTEX,
      fragmentShader: TRAFFIC_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPointScale: this.pointScale,
        uColor: { value: new THREE.Color(0xd8f6ff) },
        uGlow: { value: 1 },
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
  setActiveCorridor(
    id: string | null,
    endpoints?: { fromLat: number; fromLon: number; toLat: number; toLon: number },
  ): void {
    const index = id ? this.arcIds.indexOf(id) : -1;
    if (this.arcMaterial) this.arcMaterial.uniforms.uActiveArc.value = index;
    this.focusTarget = index >= 0 ? 1 : 0;
    this.focusValue = 0;
    if (index >= 0 && endpoints) {
      const from = latLonToVec3(endpoints.fromLat, endpoints.fromLon, GLOBE_RADIUS);
      const to = latLonToVec3(endpoints.toLat, endpoints.toLon, GLOBE_RADIUS);
      /* Centre the corridor both ways: yaw brings it around, tilt lifts or
         drops it to the middle of the view. */
      this.yawGoal = facingYawFor(from, to);
      this.tiltGoal = THREE.MathUtils.clamp(facingTiltFor(from, to) * 0.85 + 0.12, -1.05, 1.05);
    }
    if (this.reducedMotion) {
      this.yaw = this.yawGoal;
      this.tilt = this.tiltGoal;
      this.focusValue = this.focusTarget;
      this.renderOnce();
    }
    this.wake();
  }

  /**
   * Follow the page theme. The wrapper mirrors `documentElement[data-theme]`
   * into this, so the globe is white-with-blue in daylight and deep navy after
   * dark without either side owning the other's state.
   */
  setTheme(theme: GlobeTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.applyPalette();
    this.renderOnce();
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

  /**
   * Push one palette onto every material. Kept in one place so the surface,
   * the lattice, the corridors, the traffic and the beacons can never drift
   * into different themes, and so a theme flip costs a handful of uniform
   * writes rather than a rebuild.
   */
  private applyPalette(): void {
    const palette = PALETTES[this.theme];
    const blending = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;

    if (this.surfaceMaterial) {
      this.surfaceMaterial.uniforms.uOcean.value.setHex(palette.ocean);
      this.surfaceMaterial.uniforms.uLandColor.value.setHex(palette.land);
      this.surfaceMaterial.uniforms.uCoast.value.setHex(palette.coast);
      this.surfaceMaterial.uniforms.uLimb.value.setHex(palette.limb);
    }
    if (this.graticuleMaterial) {
      this.graticuleMaterial.color.setHex(palette.graticule);
      this.graticuleMaterial.opacity = palette.graticuleOpacity;
    }
    if (this.arcMaterial) {
      this.arcMaterial.uniforms.uColor.value.setHex(palette.arc);
      this.arcMaterial.uniforms.uActiveColor.value.setHex(palette.arcActive);
      this.arcMaterial.uniforms.uGlow.value = palette.additive ? 1 : 0;
      this.arcMaterial.blending = blending;
    }
    if (this.trafficMaterial) {
      this.trafficMaterial.uniforms.uColor.value.setHex(palette.traffic);
      this.trafficMaterial.uniforms.uGlow.value = palette.additive ? 1 : 0;
      this.trafficMaterial.blending = blending;
    }
    if (this.hubMaterial) {
      this.hubMaterial.blending = blending;
      /* Beacons keep their own hues but are deepened for the white chart: the
         bright cyan that reads on navy drops below 3:1 on paper. */
      const colors = this.hubGeometryColors;
      this.hubColors.forEach((hex, i) => {
        const color = new THREE.Color(hex);
        if (this.theme === 'light') {
          const hsl = { h: 0, s: 0, l: 0 };
          color.getHSL(hsl);
          color.setHSL(hsl.h, Math.min(1, hsl.s * 0.9), hsl.l * 0.42);
        }
        colors.setXYZ(i, color.r, color.g, color.b);
      });
      colors.needsUpdate = true;
    }
  }

  /* ── Loop ───────────────────────────────────────────────────────────── */
  private wake(): void {
    if (this.disposed || this.reducedMotion || !this.visible || this.contextLost) return;
    if (this.rafId === 0) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private renderOnce(): void {
    if (this.disposed || !this.visible || this.contextLost || this.rafId !== 0) return;
    this.draw(performance.now());
  }

  private readonly tick = (time: number): void => {
    this.rafId = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (time - this.lastTime) / 1000));
    this.lastTime = time;
    this.elapsed += dt;

    /* Auto-spin only when the reader is not steering, and it eases back in
       after a gesture rather than snapping the moment the pointer lifts. */
    if (!this.dragging) {
      this.idleBefore = Math.min(1, this.idleBefore + dt * 0.35);
      this.yawGoal += AUTO_SPIN * dt * this.idleBefore;
    } else {
      this.idleBefore = 0;
    }
    this.spinVelocity *= Math.exp(-4.5 * dt);
    this.yaw += this.spinVelocity * dt;
    this.yaw = dampAngle(this.yaw, this.yawGoal + this.spinVelocity * 18, ROTATION_SMOOTH, dt);
    this.tilt = damp(this.tilt, this.tiltGoal, ROTATION_SMOOTH, dt);
    this.radius = damp(this.radius, this.radiusGoal, ZOOM_SMOOTH, dt);
    this.globeGroup.rotation.set(this.tilt, this.yaw, 0);

    /* Focus bloom and texture fade-in. */
    if (this.arcMaterial) {
      this.arcMaterial.uniforms.uTime.value = this.elapsed;
      this.arcMaterial.uniforms.uGlobeViewZ.value = -this.radius;
      this.focusValue = damp(this.focusValue, this.focusTarget, 5.5, dt);
      this.arcMaterial.uniforms.uFocus.value = this.focusValue;
    }
    if (this.surfaceMaterial) {
      this.landReady = damp(this.landReady, this.landReadyTarget, 2.4, dt);
      this.surfaceMaterial.uniforms.uLandReady.value = this.landReady;
    }
    if (this.hubMaterial) this.hubMaterial.uniforms.uTime.value = this.elapsed;
    if (this.trafficMaterial) this.trafficMaterial.uniforms.uTime.value = this.elapsed;

    /* Idle frames are budgeted to 30 fps; anything the reader is actively
       steering renders at the display's own rate. */
    const steering =
      this.dragging ||
      Math.abs(this.spinVelocity) > 5e-4 ||
      Math.abs(this.focusValue - this.focusTarget) > 1e-3;
    if (steering || time - this.lastDrawTime >= IDLE_FRAME_MS) {
      this.lastDrawTime = time;
      this.draw(time);
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(time: number): void {
    if (this.arcMaterial) this.arcMaterial.uniforms.uFocus.value = this.focusValue;
    if (this.surfaceMaterial) this.surfaceMaterial.uniforms.uLandReady.value = this.landReady;
    this.camera.position.set(0, 0.052 * this.radius, this.radius);
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);

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
    this.spinVelocity = 0;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastPointerX;
    const dy = event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.yawGoal += dx * 0.005;
    this.spinVelocity = dx * 0.0012;
    this.tiltGoal = THREE.MathUtils.clamp(this.tiltGoal + dy * 0.0035, -1.15, 1.15);
    this.wake();
  };

  private readonly onPointerUp = (): void => {
    this.dragging = false;
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.radiusGoal = THREE.MathUtils.clamp(
      this.radiusGoal + event.deltaY * 0.0016,
      MIN_RADIUS,
      MAX_RADIUS,
    );
    this.wake();
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
    this.stopWatchingContext();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    for (const texture of this.textures) texture.dispose();
    releaseWebGL(this.renderer, this.scene);
  }
}
