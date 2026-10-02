/* ── AIRGL geodesy ────────────────────────────────────────────────────────
   Pure spherical math for the corridor globe and the digital twin. Kept
   dependency-free (plain number tuples, no THREE objects) so the whole module
   is verifiable in jsdom unit tests without a WebGL context, and recyclable
   by both the globe scene and any future spatial view.

   Conventions:
     · Vec3Tuple = [x, y, z], unit sphere centered at origin, +Y = north pole.
     · Angles in degrees at the API boundary, radians internally.
     · Longitude 0° faces +Z and positive longitude rotates toward +X, which
       keeps the Mediterranean front-facing at the globe's rest rotation.
────────────────────────────────────────────────────────────────────────── */

export type Vec3Tuple = [number, number, number];

const DEG2RAD = Math.PI / 180;

/**
 * Geographic coordinate → unit-sphere direction (radius applied by caller).
 * East longitude positive, north latitude positive. Pass `out` to write into
 * a caller-owned tuple and keep allocation off the hot path.
 */
export function latLonToVec3(latDeg: number, lonDeg: number, radius = 1, out?: Vec3Tuple): Vec3Tuple {
  const lat = latDeg * DEG2RAD;
  const lon = lonDeg * DEG2RAD;
  const cosLat = Math.cos(lat);
  const x = radius * cosLat * Math.sin(lon);
  const y = radius * Math.sin(lat);
  const z = radius * cosLat * Math.cos(lon);
  if (out) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  return [x, y, z];
}

/** Dot product of two tuples. */
export function dot3(a: Vec3Tuple, b: Vec3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Euclidean norm. */
export function norm3(a: Vec3Tuple): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Normalize in place semantics avoided: returns a fresh tuple. */
export function normalize3(a: Vec3Tuple): Vec3Tuple {
  const n = norm3(a) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
}

/**
 * Spherical linear interpolation between two unit vectors.
 * Handles the near-parallel singularity with the standard sin(Ω)/Ω → 1 limit,
 * falling back to linear interpolation once the vectors are closer than ~1e-4 rad.
 */
export function slerpUnit(a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple {
  const clamped = Math.max(-1, Math.min(1, dot3(a, b)));
  const omega = Math.acos(clamped);
  if (omega < 1e-4) {
    return normalize3([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]);
  }
  const sinOmega = Math.sin(omega);
  const ka = Math.sin((1 - t) * omega) / sinOmega;
  const kb = Math.sin(t * omega) / sinOmega;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

/**
 * Point on an elevated great-circle flight arc.
 *
 * The altitude profile is sin(π·t), peaking mid-route at `apexHeight` above
 * `radius` — the same visual grammar flight trackers use, and cheap: three
 * trigonometric evaluations, no allocation when an out tuple is supplied.
 */
export function greatCirclePoint(
  a: Vec3Tuple,
  b: Vec3Tuple,
  t: number,
  radius: number,
  apexHeight: number,
  out: Vec3Tuple = [0, 0, 0],
): Vec3Tuple {
  const clamped = Math.max(-1, Math.min(1, dot3(a, b)));
  const omega = Math.acos(clamped);
  let ka: number;
  let kb: number;
  if (omega < 1e-4) {
    ka = 1 - t;
    kb = t;
  } else {
    const sinOmega = Math.sin(omega);
    ka = Math.sin((1 - t) * omega) / sinOmega;
    kb = Math.sin(t * omega) / sinOmega;
  }
  const lift = radius + apexHeight * Math.sin(Math.PI * t);
  const ix = a[0] * ka + b[0] * kb;
  const iy = a[1] * ka + b[1] * kb;
  const iz = a[2] * ka + b[2] * kb;
  const n = Math.hypot(ix, iy, iz) || 1;
  out[0] = (ix / n) * lift;
  out[1] = (iy / n) * lift;
  out[2] = (iz / n) * lift;
  return out;
}

/** Angular length of a great-circle arc in radians. */
export function greatCircleAngle(a: Vec3Tuple, b: Vec3Tuple): number {
  return Math.acos(Math.max(-1, Math.min(1, dot3(normalize3(a), normalize3(b)))));
}

/**
 * Arc apex altitude from arc length: longer hauls crest higher, with a floor so
 * short regional hops still read as airborne. Bounded to keep far-side arcs
 * inside the atmosphere shell.
 */
export function arcApexHeight(angleRad: number, radius: number): number {
  return Math.min(radius * 0.42, Math.max(radius * 0.06, angleRad * radius * 0.24));
}

/**
 * Yaw (radians about +Y) that rotates the arc's surface midpoint onto the
 * camera-facing meridian (+Z). Used to ease the globe so the selected
 * corridor is always presented dead center.
 */
export function facingYawFor(a: Vec3Tuple, b: Vec3Tuple): number {
  const mid = slerpUnit(normalize3(a), normalize3(b), 0.5);
  return -Math.atan2(mid[0], mid[2]);
}

/**
 * Even point distribution on a sphere via the Fibonacci lattice. Deterministic
 * (no RNG state), which keeps SSR/tests stable and avoids cluster artifacts
 * that naive random sampling produces near the poles.
 */
export function fibonacciSpherePoint(index: number, count: number, radius = 1): Vec3Tuple {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / Math.max(1, count - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * index;
  return [radius * r * Math.cos(theta), radius * y, radius * r * Math.sin(theta)];
}
