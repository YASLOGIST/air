import { afterEach, describe, expect, it } from 'vitest';
import { clamp01, documentScrollFraction, layerOpacity, stepProgress } from '../scroll-progress';

describe('clamp01', () => {
  it('clamps into [0, 1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(2)).toBe(1);
  });
});

describe('stepProgress', () => {
  it('moves a fraction of the remaining distance each frame', () => {
    const { next, settled } = stepProgress(0, 1, 0.14);
    expect(next).toBeCloseTo(0.14, 6);
    expect(settled).toBe(false);
  });

  it('settles exactly on the target when within epsilon', () => {
    const { next, settled } = stepProgress(0.9996, 1, 0.14);
    expect(next).toBe(1);
    expect(settled).toBe(true);
  });

  it('is stable when already at the target (loop can stop)', () => {
    const { next, settled } = stepProgress(1, 1, 0.14);
    expect(next).toBe(1);
    expect(settled).toBe(true);
  });

  it('eases downwards as well as upwards', () => {
    const { next } = stepProgress(1, 0, 0.14);
    expect(next).toBeCloseTo(0.86, 6);
  });
});

describe('layerOpacity', () => {
  it('is fully visible across [start, end]', () => {
    expect(layerOpacity(0.4, 0.28, 0.68)).toBe(1);
    expect(layerOpacity(0.28, 0.28, 0.68)).toBe(1);
    expect(layerOpacity(0.68, 0.28, 0.68)).toBe(1);
  });

  it('is fully hidden outside the envelope ± fade', () => {
    expect(layerOpacity(0.1, 0.28, 0.68)).toBe(0);
    expect(layerOpacity(0.9, 0.28, 0.68)).toBe(0);
  });

  it('fades linearly through the 0.1-wide shoulders', () => {
    expect(layerOpacity(0.23, 0.28, 0.68)).toBeCloseTo(0.5, 6);
    expect(layerOpacity(0.73, 0.28, 0.68)).toBeCloseTo(0.5, 6);
  });

  it('never leaves [0, 1] across the whole domain', () => {
    for (let p = -0.2; p <= 1.2; p += 0.01) {
      const o = layerOpacity(p, 0.28, 0.68);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
    }
  });
});

describe('documentScrollFraction', () => {
  afterEach(() => {
    // restore the real (zeroed) jsdom geometry
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, configurable: true });
  });

  it('returns 0 when the document is not scrollable', () => {
    expect(documentScrollFraction()).toBe(0);
  });

  it('returns the scrolled share of a scrollable document', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 1000, configurable: true });
    expect(documentScrollFraction()).toBeCloseTo(0.5, 6);
  });

  it('clamps at 1 at the very bottom', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 2000, configurable: true });
    expect(documentScrollFraction()).toBe(1);
  });
});
