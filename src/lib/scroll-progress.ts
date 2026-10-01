/**
 * YASLOGIST AIR — Scroll-driven animation math.
 *
 * Extracted from CinematicStage so the descent-simulation arithmetic (the
 * lerp easing, the settle threshold and the layer cross-fades) can be unit
 * tested without a rendering surface, and reused by the scroll-progress FAB.
 */

/** Clamp a number into [0, 1]. */
export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export const SETTLE_EPSILON = 0.00045;

/**
 * One frame of exponential smoothing towards `target`.
 * `settled` is true when the remaining distance is below the settle epsilon,
 * which the scroll driver uses to stop its requestAnimationFrame loop — the
 * loop then only spins while the scene is actually moving.
 */
export function stepProgress(
  current: number,
  target: number,
  lerp = 0.14,
): { next: number; settled: boolean } {
  let next = current + (target - current) * lerp;
  let settled = false;
  if (Math.abs(target - next) < SETTLE_EPSILON) {
    next = target;
    settled = true;
  }
  return { next, settled };
}

/**
 * Opacity envelope for a scroll layer: fades in over `fade` before `start`,
 * holds at 1 across [start, end], fades out over `fade` after `end`.
 */
export function layerOpacity(
  progress: number,
  start: number,
  end: number,
  fade = 0.1,
): number {
  if (progress < start - fade) return 0;
  if (progress < start) return (progress - (start - fade)) / fade;
  if (progress <= end) return 1;
  if (progress < end + fade) return 1 - (progress - end) / fade;
  return 0;
}

/**
 * Whole-document scroll fraction (0 at the top, 1 at the very bottom), used
 * by the back-to-top progress ring.
 */
export function documentScrollFraction(doc = document): number {
  const el = doc.documentElement;
  const scrollable = el.scrollHeight - el.clientHeight;
  if (scrollable <= 0) return 0;
  return clamp01((el.scrollTop || doc.body.scrollTop || window.scrollY) / scrollable);
}
