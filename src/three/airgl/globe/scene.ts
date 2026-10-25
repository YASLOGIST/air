/* ── AIRGL · great-circle network globe ───────────────────────────────
   A real Earth, not a diagram of one: an equirectangular land mask rasterised
   from Natural Earth 1:50m coastlines drives a daylit surface with oceans,
   climate bands, ice caps and a night side lit by city lights; the terminator
   comes from the actual subsolar point; clouds drift on their own layer.

   Two deliberate departures from a photograph, both for legibility:
   · the key light is never more than 72° from the viewing axis, so the
     featured hemisphere always carries light (see updateSunLocal);
   · far-side corridors stay faintly visible through the planet instead of
     being clipped by it (see vHidden in ARC_VERTEX).

   Everything that moves on the sphere is a closed-form function of time
   evaluated on the GPU, so the CPU cost of the whole scene is one camera
   update per frame:

     1. Earth surface    — one sphere, one draw. Land/ocean/ice/clouds/terminator
                           are all composed in the fragment shader.
     2. Atmosphere       — inverted-hull fresnel shell, sun-biased limb glow.
     3. Graticule        — one merged LineSegments, faint reference lattice.
     4. Great-circle arcs— tapered ribbons (two triangles per segment) that fade
                           at the edges, so lines glow instead of stair-stepping.
     5. Live traffic     — one Points cloud; the shader slerps each aircraft
                           along its great circle and rotates an aircraft
                           silhouette to match its ground track on screen.
     6. Airport hubs     — one Points cloud with pulsing rings; CAI reads largest.

   Cost policy: textures load once (305 KiB total, from public/), the
   terminator is recomputed once a minute, everything else is per-frame on the
   GPU, and the loop parks itself whenever the section is off-screen, the tab
   is hidden or the user prefers reduced motion.
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
  subsolarLatLon,
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
/** The sun moves ~0.25°/min; re-deriving it every minute is invisible. */
const SUN_REFRESH_MS = 60_000;
const CLOUD_DRIFT = 0.0016;
const TEXTURE_BASE = '/assets/earth';

/* ── GLSL ───────────────────────────────────────────────────────────────── */

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vLocal = normalize(position);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

/* The whole planet in one fragment shader. Order matters: oceans get depth and
   a specular glint, land gets climate bands from latitude plus noise, the
   sun direction paints a soft terminator, and the cloud layer is composited
   on top with the same light so it dims at dusk instead of glowing. */
const SURFACE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D uLand;
  uniform sampler2D uClouds;
  uniform vec3 uSunLocal;
  uniform float uLandReady;
  uniform float uTime;
  uniform float uCloudDrift;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  const float PI = 3.14159265359;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  /* Hash without sine. hash21() above is fine for smooth noise but aliases
     badly on integer cell coordinates (fract(0.34 * i) repeats every 50), which
     turned the city lights into a visible lattice. */
  float cellHash(vec2 cell) {
    vec3 p3 = fract(vec3(cell.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  /* Smooth value noise. Albedo variation has to happen at a scale the eye
     reads as terrain, not at the pixel scale — per-pixel hashing produced a
     sandpaper texture across every continent. */
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 n = normalize(vLocal);
    float lon = atan(n.x, n.z);
    float lat = asin(clamp(n.y, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
    float absLat = abs(n.y);

    /* Coastline. The mask is linearly filtered, then tightened so a 2048-wide
       texture still reads as a crisp shore rather than a soft gradient. */
    float mask = texture2D(uLand, uv).r * uLandReady;
    float land = smoothstep(0.485, 0.515, mask);
    float shelf = smoothstep(0.12, 0.38, mask) * (1.0 - land);

    /* Terrain: two octaves of smooth noise at continent and region scale. */
    float macro = vnoise(vec2(uv.x * 26.0, uv.y * 18.0));
    float meso = vnoise(vec2(uv.x * 96.0, uv.y * 64.0));
    float detail = mix(macro, meso, 0.45);

    /* Subtropical dryness: the great deserts sit in bands around 15–33°. */
    float arid = smoothstep(0.10, 0.30, absLat) * (1.0 - smoothstep(0.38, 0.55, absLat));

    vec3 forest = vec3(0.055, 0.135, 0.078);
    vec3 grass  = vec3(0.135, 0.205, 0.105);
    vec3 desert = vec3(0.395, 0.315, 0.180);
    vec3 tundra = vec3(0.205, 0.215, 0.200);
    vec3 ice    = vec3(0.820, 0.870, 0.915);

    vec3 landCol = mix(forest, grass, smoothstep(0.25, 0.75, detail));
    landCol = mix(landCol, desert, clamp(arid * (0.35 + 1.1 * meso), 0.0, 1.0));
    landCol = mix(landCol, tundra, smoothstep(0.50, 0.68, absLat));
    landCol = mix(landCol, ice, smoothstep(0.76, 0.90, absLat));
    landCol *= 0.88 + 0.24 * macro;

    vec3 deep = vec3(0.008, 0.036, 0.082);
    vec3 mid = vec3(0.016, 0.080, 0.152);
    vec3 shallow = vec3(0.038, 0.180, 0.250);
    vec3 oceanCol = mix(deep, mid, smoothstep(0.0, 0.45, macro));
    oceanCol = mix(oceanCol, shallow, shelf);

    vec3 base = mix(oceanCol, landCol, land);

    vec3 sunDir = normalize(uSunLocal);
    float sun = dot(n, sunDir);
    float day = smoothstep(-0.22, 0.30, sun);
    /* A second, tighter mask for when the sun is actually below the horizon.
       Reusing the soft day term here made city lights glow over sunlit land. */
    float nightL = 1.0 - smoothstep(-0.10, 0.08, sun);
    float dusk = exp(-pow(sun / 0.22, 2.0));

    /* Real terminator, with enough ambient on the dark side to keep coastlines
       and the corridor geography readable. */
    vec3 col = base * (0.10 + 1.18 * day) + vec3(0.012, 0.024, 0.052) * nightL * 1.2;

    /* Specular glint on water only. */
    vec3 halfVec = normalize(sunDir + normalize(vViewDir));
    float spec = pow(max(dot(n, halfVec), 0.0), 260.0) * (1.0 - land);
    col += vec3(0.62, 0.80, 1.0) * spec * 0.55;

    /* Settlements: sparse cells, denser near coasts, only where the sun is
       down. Small enough to read as lights, not as texture. */
    vec2 cityCell = floor(vec2(uv.x * 1200.0, uv.y * 780.0));
    float coastal = smoothstep(0.46, 0.57, mask) * (1.0 - smoothstep(0.68, 0.90, mask));
    float cityPick = cellHash(cityCell);
    /* Cities belong to deep night only. The night mask still passes a little
       light at grazing sun angles, where a glowing settlement would be wrong. */
    float deepNight = 1.0 - smoothstep(0.0, 0.22, day);
    float cities = step(0.986, cityPick + coastal * 0.04) * land * deepNight;
    col += vec3(1.0, 0.80, 0.52) * cities * 0.62;

    /* Warm scattering into the night edge. */
    col += vec3(0.45, 0.20, 0.08) * dusk * 0.22;

    /* Clouds drift eastward; they are lit by the same sun so they darken into
       the night side instead of glowing over it. */
    float cloudMask = texture2D(uClouds, vec2(fract(uv.x + uCloudDrift), uv.y)).r;
    /* The map stores soft coverage, so a gentle ramp is enough; the threshold
       only trims the faintest wisps. */
    float cloud = smoothstep(0.30, 0.88, cloudMask) * 0.82;
    vec3 cloudCol = vec3(0.97, 0.98, 1.0) * (0.18 + 0.88 * day);
    col = mix(col, cloudCol, cloud * (0.42 + 0.58 * day));

    /* Atmospheric limb: the horizon scatters blue, and more so by day. */
    float limb = 1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir)));
    col += vec3(0.16, 0.36, 0.66) * pow(limb, 3.6) * (0.10 + 0.90 * day) * 0.28;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vLocal;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vLocal = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Two-term limb: a tight bright rim plus a wide soft halo, biased toward the
   lit side so the atmosphere reads as scattered sunlight, not a neon outline. */
const ATMOSPHERE_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec3 vNormalV;
  varying vec3 vLocal;
  uniform vec3 uColor;
  uniform vec3 uSunLocal;
  void main() {
    /* The shell is a sphere, so the limb is where the view-space normal turns
       away from the camera. Both terms are zero over the disc and peak in a
       narrow band at the edge. */
    /* Only the annulus between the planet's silhouette and this shell's is
       visible, so the glow should be strongest where the shell turns away
       (near the planet's limb) and fade out toward its own outer edge. */
    float facing = abs(dot(vNormalV, vec3(0.0, 0.0, 1.0)));
    float rim = pow(facing, 1.6);
    float halo = pow(facing, 5.0);
    float lit = clamp(dot(normalize(vLocal), normalize(uSunLocal)) * 0.9 + 0.55, 0.15, 1.0);
    gl_FragColor = vec4(uColor, (rim * 0.075 + halo * 0.10) * lit);
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
    vec3 color = mix(uColor, uActiveColor, clamp(focus * 1.4, 0.0, 1.0)) * (0.75 + spark * 2.2 + counter * focus);
    float alpha = (0.30 + focus * 0.55 + (spark + counter) * (0.45 + focus * 0.5)) * edge;
    /* Far-side lanes survive at 30%: they are drawn over the disc, which reads
       as a transparent network globe rather than a solid ball with secrets. */
    alpha *= mix(1.0, 0.30, vHidden);
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

    float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * 0.30 * vEnroute;
    float alpha = body * (0.75 + 0.25 * vEnroute) + glow;
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

  /** The key light is never allowed further than this from the viewing axis.
   *  See updateSunLocal(). */
  private static readonly MAX_SUN_ANGLE = 1.256; // 72°

  private readonly arcIds: string[] = [];
  private readonly textures: THREE.Texture[] = [];

  private readonly pointScale = { value: 1 };
  private arcMaterial: THREE.ShaderMaterial | null = null;
  private hubMaterial: THREE.ShaderMaterial | null = null;
  private trafficMaterial: THREE.ShaderMaterial | null = null;
  private atmosphereMaterial: THREE.ShaderMaterial | null = null;
  private surfaceMaterial: THREE.ShaderMaterial | null = null;
  private graticuleMaterial: THREE.LineBasicMaterial | null = null;

  /* Focus easing: the active arc blooms in rather than snapping. */
  private focusTarget = 0;
  private focusValue = 0;

  /* Textures arrive asynchronously; the surface fades them in. */
  private landReady = 0;
  private landReadyTarget = 0;
  private cloudDrift = 0;
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

  /* Solar state — world-space direction, refreshed on a slow clock. */
  private readonly sunWorld = new THREE.Vector3(1, 0, 0);
  private readonly sunLocal = new THREE.Vector3(1, 0, 0);
  /** True subsolar direction, before the viewer fill is folded in. */
  private readonly sunTrue = new THREE.Vector3(1, 0, 0);
  /** Direction from the globe to the camera, in the globe's local frame. */
  private readonly eyeLocal = new THREE.Vector3(0, 0, 1);
  private readonly sunAxis = new THREE.Vector3(1, 0, 0);
  private readonly sunSwing = new THREE.Quaternion();
  private readonly inverseSpin = new THREE.Quaternion();
  private sunLastComputed = 0;

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
    this.buildAtmosphere();
    this.buildGraticule();
    this.buildHubs(hubs);
    this.buildArcsAndTraffic(corridors);
    this.refreshSun(true);

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
    const loader = new THREE.TextureLoader();
    const land = loader.load(`${TEXTURE_BASE}/earth-land.png`, () => {
      this.landReadyTarget = 1;
      this.readyCallback?.();
      this.wake();
    });
    const clouds = loader.load(`${TEXTURE_BASE}/clouds.png`, () => {
      this.cloudReady = true;
      if (this.landReadyTarget === 1) this.readyCallback?.();
      this.wake();
    });
    for (const texture of [land, clouds]) {
      texture.colorSpace = THREE.NoColorSpace; // data map: raw values, no sRGB decode
      texture.wrapS = THREE.RepeatWrapping; // longitude wraps at the antimeridian
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      texture.generateMipmaps = true;
      this.textures.push(texture);
    }

    this.surfaceMaterial = new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      uniforms: {
        uLand: { value: land },
        uClouds: { value: clouds },
        uSunLocal: { value: this.sunLocal },
        uLandReady: { value: 0 },
        uTime: { value: 0 },
        uCloudDrift: { value: 0 },
      },
    });
    /* 192×96 segments: smooth enough that the limb stays a clean curve at the
       sizes this canvas is displayed, without inflating the vertex buffer. */
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 192, 96);
    this.globeGroup.add(new THREE.Mesh(geometry, this.surfaceMaterial));
  }

  private cloudReady = false;

  /** Subsolar direction in world space; refreshed on the slow sun clock. */
  private refreshSun(force = false): void {
    const now = performance.now();
    if (!force && now - this.sunLastComputed < SUN_REFRESH_MS) return;
    this.sunLastComputed = now;
    const { lat, lon } = subsolarLatLon(new Date());
    const latRad = THREE.MathUtils.degToRad(lat);
    const lonRad = THREE.MathUtils.degToRad(lon);
    this.sunWorld.set(
      Math.cos(latRad) * Math.sin(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.cos(lonRad),
    );
  }

  /** Rotate the world-space sun into the globe's local frame so the terminator
      stays glued to the geography while the planet spins.
   *
   *  On top of the true subsolar direction the key light is pulled part of the
   *  way toward the camera. Without this the section is a lottery: at some UTC
   *  values the featured hemisphere is entirely in shadow and every corridor
   *  sits on a near-black disc. The blend keeps the real terminator tracking
   *  UTC — it still sweeps across the globe over a day — but guarantees that
   *  the face the reader is looking at carries enough light to read. */
  private updateSunLocal(): void {
    this.inverseSpin.copy(this.globeGroup.quaternion).invert();
    this.sunTrue.copy(this.sunWorld).applyQuaternion(this.inverseSpin);
    this.eyeLocal.copy(this.camera.position).applyQuaternion(this.inverseSpin).normalize();

    /* Keep the true subsolar point unless it wanders more than MAX_SUN_ANGLE
       away from the camera axis, in which case swing it back along the
       shortest arc. The terminator stays a genuine great circle — it is only
       re-aimed, never reshaped — so at most a crescent is in shadow and the
       featured hemisphere always carries enough light to read. */
    const cosine = THREE.MathUtils.clamp(this.sunTrue.dot(this.eyeLocal), -1, 1);
    const angle = Math.acos(cosine);
    this.sunAxis.crossVectors(this.sunTrue, this.eyeLocal);
    if (angle <= CorridorGlobeScene.MAX_SUN_ANGLE || this.sunAxis.lengthSq() < 1e-8) {
      this.sunLocal.copy(this.sunTrue);
      return;
    }
    this.sunAxis.normalize();
    this.sunSwing.setFromAxisAngle(this.sunAxis, angle - CorridorGlobeScene.MAX_SUN_ANGLE);
    this.sunLocal.copy(this.sunTrue).applyQuaternion(this.sunSwing);
  }

  /* 2 — atmosphere. */
  private buildAtmosphere(): void {
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      uniforms: {
        uColor: { value: new THREE.Color(0x5aa9f8) },
        uSunLocal: { value: this.sunLocal },
      },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.globeGroup.add(
      new THREE.Mesh(new THREE.SphereGeometry(1.045, 96, 64), this.atmosphereMaterial),
    );
    this.globeGroup.add(
      new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 48), this.atmosphereMaterial.clone()),
    );
  }

  /* 3 — reference lattice, deliberately faint: the geography is the subject. */
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
    this.graticuleMaterial = new THREE.LineBasicMaterial({
      color: 0x86b6d8,
      transparent: true,
      opacity: 0.085,
      depthWrite: false,
    });
    this.globeGroup.add(new THREE.LineSegments(geometry, this.graticuleMaterial));
  }

  /* 4 — airport beacons. */
  private buildHubs(hubs: GlobeHub[]): void {
    const count = hubs.length;
    const positions = new Float32Array(count * 3);
    const eminence = new Float32Array(count);
    const phase = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();
    hubs.forEach((hub, i) => {
      const [x, y, z] = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.004);
      positions.set([x, y, z], i * 3);
      eminence[i] = 15 * hub.eminence;
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

  /* 5+6 — corridors as tapered ribbons, and the traffic riding them. */
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
      this.surfaceMaterial.uniforms.uTime.value = this.elapsed;
      this.landReady = damp(this.landReady, this.landReadyTarget, 2.4, dt);
      this.surfaceMaterial.uniforms.uLandReady.value = this.landReady;
      /* Clouds drift eastward; pause the drift when only one layer is in. */
      if (this.cloudReady) this.cloudDrift = (this.cloudDrift + CLOUD_DRIFT * dt) % 1;
      this.surfaceMaterial.uniforms.uCloudDrift.value = this.cloudDrift;
    }
    if (this.hubMaterial) this.hubMaterial.uniforms.uTime.value = this.elapsed;
    if (this.trafficMaterial) this.trafficMaterial.uniforms.uTime.value = this.elapsed;

    this.draw(time);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(time: number): void {
    /* Sun state belongs here, not only in the loop: the reduced-motion path
       renders via renderOnce() and still deserves a correct terminator. */
    this.refreshSun();
    this.updateSunLocal();
    if (this.arcMaterial) this.arcMaterial.uniforms.uFocus.value = this.focusValue;
    if (this.surfaceMaterial) {
      this.surfaceMaterial.uniforms.uLandReady.value = this.landReady;
      this.surfaceMaterial.uniforms.uCloudDrift.value = this.cloudDrift;
    }
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
