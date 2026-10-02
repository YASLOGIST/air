import { describe, expect, it } from 'vitest';
import { damp, dampAngle, isSpringSettled, stepSpring, type SpringState } from './easing';

describe('damp', () => {
  it('converges to the target across many steps', () => {
    let value = 0;
    for (let i = 0; i < 600; i++) value = damp(value, 10, 7.5, 1 / 60);
    expect(value).toBeCloseTo(10, 2);
  });

  it('is frame-rate independent (two 120 Hz steps ≈ one 60 Hz step)', () => {
    const slow = damp(0, 10, 7.5, 1 / 60);
    let fast = 0;
    fast = damp(fast, 10, 7.5, 1 / 120);
    fast = damp(fast, 10, 7.5, 1 / 120);
    expect(fast).toBeCloseTo(slow, 3);
  });

  it('moves toward, never overshoots for positive smoothing', () => {
    expect(damp(0, 10, 7.5, 1 / 60)).toBeLessThan(10);
    expect(damp(10, 0, 7.5, 1 / 60)).toBeGreaterThan(0);
  });
});

describe('dampAngle', () => {
  it('takes the short way around ±π instead of the long way', () => {
    // From just below π to just above -π the short path is a tiny step
    // forward through π, not a full rotation backwards.
    const from = Math.PI - 0.05;
    const to = -Math.PI + 0.05;
    const next = dampAngle(from, to, 20, 1 / 60);
    expect(next).toBeGreaterThan(from);
  });
});

describe('stepSpring', () => {
  it('settles on the target with zero residual energy', () => {
    const state: SpringState = { position: 0, velocity: 0 };
    for (let i = 0; i < 1200; i++) stepSpring(state, 1, 1 / 60);
    expect(state.position).toBeCloseTo(1, 2);
    expect(Math.abs(state.velocity)).toBeLessThan(0.02);
    expect(isSpringSettled(state, 1, 0.005)).toBe(true);
  });

  it('starts from rest toward the target on the very first step', () => {
    const state: SpringState = { position: 0, velocity: 0 };
    stepSpring(state, 1, 1 / 60);
    expect(state.position).toBeGreaterThan(0);
    expect(state.velocity).toBeGreaterThan(0);
  });

  it('never produces NaN with a clamped dt from a long tab suspension', () => {
    const state: SpringState = { position: 0.2, velocity: 3 };
    stepSpring(state, 1, 0.05);
    expect(Number.isFinite(state.position)).toBe(true);
    expect(Number.isFinite(state.velocity)).toBe(true);
  });
});
