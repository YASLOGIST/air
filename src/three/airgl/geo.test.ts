import { describe, expect, it } from 'vitest';
import {
  arcApexHeight,
  dot3,
  facingYawFor,
  fibonacciSpherePoint,
  greatCircleAngle,
  greatCirclePoint,
  latLonToVec3,
  normalize3,
  norm3,
  slerpUnit,
} from './geo';

const CAI = latLonToVec3(30.1219, 31.4056);
const FRA = latLonToVec3(50.0379, 8.5622);
const PVG = latLonToVec3(31.1443, 121.8083);

describe('latLonToVec3', () => {
  it('places the north pole at +Y', () => {
    const [x, y, z] = latLonToVec3(90, 0);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(1, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it('places longitude 0 on the +Z meridian and +90E toward +X', () => {
    const zero = latLonToVec3(0, 0);
    expect(zero[2]).toBeCloseTo(1, 6);
    const east = latLonToVec3(0, 90);
    expect(east[0]).toBeCloseTo(1, 6);
  });

  it('respects radius scaling', () => {
    expect(norm3(latLonToVec3(30, 31, 2.5))).toBeCloseTo(2.5, 6);
  });
});

describe('slerpUnit', () => {
  it('returns endpoints at t=0 and t=1', () => {
    const start = slerpUnit(CAI, FRA, 0);
    const end = slerpUnit(CAI, FRA, 1);
    expect(start[0]).toBeCloseTo(CAI[0], 5);
    expect(end[1]).toBeCloseTo(FRA[1], 5);
  });

  it('stays on the unit sphere at every t', () => {
    for (const t of [0.13, 0.42, 0.5, 0.77, 0.98]) {
      expect(norm3(slerpUnit(CAI, FRA, t))).toBeCloseTo(1, 6);
    }
  });

  it('handles nearly identical vectors without NaN (parallel singularity)', () => {
    const a = normalize3([1, 0, 0]);
    const b = normalize3([1 + 1e-7, 1e-7, 0]);
    const mid = slerpUnit(a, b, 0.5);
    expect(Number.isFinite(mid[0])).toBe(true);
    expect(norm3(mid)).toBeCloseTo(1, 5);
  });
});

describe('greatCirclePoint', () => {
  it('touches both endpoints at radius exactly', () => {
    const start = greatCirclePoint(CAI, FRA, 0, 1, 0.2);
    const end = greatCirclePoint(CAI, FRA, 1, 1, 0.2);
    expect(norm3(start)).toBeCloseTo(1, 6);
    expect(norm3(end)).toBeCloseTo(1, 6);
    expect(start[0]).toBeCloseTo(CAI[0], 5);
  });

  it('crests at the apex altitude mid-route', () => {
    const apex = greatCirclePoint(CAI, FRA, 0.5, 1, 0.2);
    expect(norm3(apex)).toBeCloseTo(1.2, 4);
  });

  it('is monotonically shelved above the surface between ~5% and 95%', () => {
    for (let s = 5; s <= 95; s += 10) {
      const t = s / 100;
      expect(norm3(greatCirclePoint(CAI, PVG, t, 1, 0.3))).toBeGreaterThan(1.02);
    }
  });

  it('writes into the caller-provided out tuple (no allocation)', () => {
    const out: [number, number, number] = [7, 7, 7];
    const returned = greatCirclePoint(CAI, FRA, 0.5, 1, 0.2, out);
    expect(returned).toBe(out);
    expect(out[0]).not.toBe(7);
  });
});

describe('arcApexHeight', () => {
  it('grows with arc length but stays bounded', () => {
    const short = arcApexHeight(0.3, 1);
    const long = arcApexHeight(0.8, 1);
    expect(long).toBeGreaterThan(short);
    expect(arcApexHeight(3.0, 1)).toBeLessThanOrEqual(0.42);
    expect(short).toBeGreaterThanOrEqual(0.06);
  });
});

describe('facingYawFor', () => {
  it('rotates the arc midpoint onto the camera meridian (+Z facing)', () => {
    const yaw = facingYawFor(CAI, FRA);
    const mid = slerpUnit(CAI, FRA, 0.5);
    // Apply the yaw (rotation about +Y) to the midpoint: x must cross ~0
    // with z positive for the arc to face the camera.
    const x = mid[0] * Math.cos(yaw) + mid[2] * Math.sin(yaw);
    const z = -mid[0] * Math.sin(yaw) + mid[2] * Math.cos(yaw);
    expect(Math.abs(x)).toBeLessThan(1e-6);
    expect(z).toBeGreaterThan(0);
  });
});

describe('fibonacciSpherePoint', () => {
  it('distributes on the sphere surface exactly', () => {
    for (const i of [0, 1, 7, 500, 2399]) {
      expect(norm3(fibonacciSpherePoint(i, 2400))).toBeCloseTo(1, 6);
    }
  });

  it('is deterministic', () => {
    expect(fibonacciSpherePoint(42, 100)).toEqual(fibonacciSpherePoint(42, 100));
  });
});

describe('greatCircleAngle', () => {
  it('matches the haversine distance for FRA→CAI within tolerance', () => {
    // FRA→CAI great-circle ≈ 2910 km on a 6371 km sphere → ≈ 0.4569 rad.
    const angle = greatCircleAngle(FRA, CAI);
    expect(angle * 6371).toBeGreaterThan(2800);
    expect(angle * 6371).toBeLessThan(3000);
  });

  it('dot3/normalize3 agree', () => {
    const n = normalize3([3, 4, 0]);
    expect(dot3(n, n)).toBeCloseTo(1, 6);
  });
});
