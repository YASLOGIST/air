/* ── AIRGL · ULD shader library ───────────────────────────────────────────
   Hand-written GLSL for the digital twin's inspection modes and ambient FX.
   Rules honored throughout:
     · no dynamic branching in fragment shaders — gradients composed from
       mix()/smoothstep() chains so every pixel executes the same program;
     · mediump suffices for stylized inspection looks (vertex stage keeps
       default highp on desktop for projection accuracy);
     · all animation is uniform-driven (uTime), so the CPU uploads a single
       float per frame and touches zero per-frame attributes.
────────────────────────────────────────────────────────────────────────── */

import * as THREE from 'three';

/* ── THERMAL ──────────────────────────────────────────────────────────────
   Unlit surface-temperature map: vertical gradient floor→roof biased by
   proximity to the door face (the cold-air leak path) plus a slow shimmer.
   Lighting is faked with a fixed luminance term so form survives the swap. */

const THERMAL_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vWorldPos;
  void main() {
    vNormalV = normalMatrix * normal;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const THERMAL_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec3 vNormalV;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uFloorY;
  uniform float uCeilY;
  uniform float uDoorZ;
  uniform float uDoorOpen;
  uniform float uCooled;

  // infra palette: deep indigo → cyan → teal → amber → heat red
  vec3 thermalRamp(float t) {
    vec3 c = mix(vec3(0.12, 0.10, 0.38), vec3(0.03, 0.52, 0.82), smoothstep(0.0, 0.42, t));
    c = mix(c, vec3(0.07, 0.72, 0.63), smoothstep(0.42, 0.62, t));
    c = mix(c, vec3(0.96, 0.62, 0.04), smoothstep(0.62, 0.84, t));
    c = mix(c, vec3(0.94, 0.26, 0.21), smoothstep(0.84, 1.0, t));
    return c;
  }

  void main() {
    float heightT = clamp((vWorldPos.y - uFloorY) / max(0.001, uCeilY - uFloorY), 0.0, 1.0);
    // Cooled shells sit ~22° along the ramp; ambient units read warm-neutral.
    float base = mix(0.56, 0.18, uCooled);
    // Door aperture leaks heat once opened — an input, not an if().
    float leak = smoothstep(0.18, 0.0, abs(vWorldPos.z - uDoorZ)) * uDoorOpen * 0.38;
    float shimmer = 0.035 * sin(vWorldPos.x * 9.0 + uTime * 2.1)
                  + 0.03 * sin(vWorldPos.y * 12.0 - uTime * 1.4);
    float t = clamp(base + heightT * 0.2 + leak + shimmer, 0.0, 1.0);
    // Discrete isotherms: real radiometers quantize the palette, and the
    // banding makes gradients legible as measurement, not decoration.
    float isotherm = (floor(t * 8.0) + 0.5) / 8.0;
    t = mix(t, isotherm, 0.6);
    vec3 color = thermalRamp(t);
    float lambert = 0.55 + 0.45 * abs(dot(normalize(vNormalV), normalize(vec3(0.4, 0.85, 0.5))));
    gl_FragColor = vec4(color * lambert, 1.0);
    #include <colorspace_fragment>
  }
`;

export interface ThermalMaterialHandles {
  material: THREE.ShaderMaterial;
  uniforms: {
    uTime: { value: number };
    uDoorOpen: { value: number };
  };
}

export function createThermalMaterial(options: {
  floorY: number;
  ceilY: number;
  doorZ: number;
  cooled: boolean;
}): ThermalMaterialHandles {
  const uniforms = {
    uTime: { value: 0 },
    uFloorY: { value: options.floorY },
    uCeilY: { value: options.ceilY },
    uDoorZ: { value: options.doorZ },
    uDoorOpen: { value: 0 },
    uCooled: { value: options.cooled ? 1 : 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: THERMAL_VERTEX,
    fragmentShader: THERMAL_FRAGMENT,
    uniforms,
  });
  return { material, uniforms: { uTime: uniforms.uTime, uDoorOpen: uniforms.uDoorOpen } };
}

/* ── X-RAY ────────────────────────────────────────────────────────────────
   Fresnel edge-glow translucent shell: opaque shell goes transparent, the
   silhouette and edges glow cyan — the classic NDT radiograph read. */

const XRAY_VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vNormalV = normalMatrix * normal;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const XRAY_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  uniform vec3 uColor;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormalV), normalize(vViewDir))), 2.0);
    float alpha = 0.045 + fresnel * 0.5;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

export function createXrayMaterial(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: XRAY_VERTEX,
    fragmentShader: XRAY_FRAGMENT,
    uniforms: { uColor: { value: new THREE.Color(color) } },
    transparent: true,
    depthWrite: false,
  });
}

/* ── SCAN PLANE ───────────────────────────────────────────────────────────
   The radiograph aperture: a soft luminous sheet sweeping front→back while
   X-ray mode is live, with a bright leading edge. Uniform-driven; only its
   z-position updates on the CPU each frame. */

const SCAN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCAN_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  void main() {
    float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float vertical = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    float core = pow(abs(sin(3.14159 * vUv.x)), 24.0) * 0.9;
    float flicker = 0.9 + 0.1 * sin(uTime * 8.0);
    float alpha = (edge * 0.16 + core) * vertical * flicker;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

export function createScanPlaneMaterial(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SCAN_VERTEX,
    fragmentShader: SCAN_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/* ── COLD-AIR PARTICLES ───────────────────────────────────────────────────
   Conditioned air spilling from the open unit. One THREE.Points draw call.
   Every particle's trajectory collapses to a closed-form function of time
   evaluated entirely in the vertex shader — zero CPU math, zero attribute
   uploads after build, deterministic loop. gl_PointSize attenuation fakes
   perspective; the fragment stage cuts a soft disc. */

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uDoorOpen;
  uniform float uIntensity;
  varying float vFade;
  void main() {
    float phase = fract(uTime * (0.09 + aSeed * 0.05) + aSeed * 7.31);
    // Spawn inside the cavity, drift out of the door and rise as air warms.
    float spread = (aSeed - 0.5) * 1.1;
    vec3 origin = vec3(spread, -0.28 + 0.5 * fract(aSeed * 13.7), 0.62);
    vec3 drift = vec3(spread * 0.5, 0.9 + aSeed * 0.5, 1.15);
    vec3 pos = origin + drift * phase;
    pos.x += 0.07 * sin(uTime * 1.7 + aSeed * 40.0);
    vFade = (1.0 - phase) * uDoorOpen * uIntensity * smoothstep(0.0, 0.12, phase);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (14.0 + phase * 26.0) * (2.4 / max(0.5, -mvPos.z)) * vFade;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.05, dist) * vFade * 0.55;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

export function createColdAirParticleMaterial(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uDoorOpen: { value: 0 },
      uIntensity: { value: 1 },
      uColor: { value: new THREE.Color(color) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Deterministic seeds — Fibonacci-ish fractional scrambling, no Math.random. */
export function buildParticleGeometry(count: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i] = (i * 0.6180339887) % 1;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.4, 0.8), 3);
  return geometry;
}
