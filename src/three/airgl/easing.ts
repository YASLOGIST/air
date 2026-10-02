/* ── AIRGL motion dynamics ────────────────────────────────────────────────
   Frame-rate independent easing used by every moving part of the WebGL
   scenes. Pure functions over plain numbers — no THREE imports — so the
   kinematics are unit-testable in jsdom and identical on every device.

   Two tools, two jobs:
     · `damp`       — frame-rate independent exponential approach, used for
                      camera damping, turntable easing and exploded offsets.
     · `stepSpring` — semi-implicit Euler for spring systems with real mass,
                      used for the insulated door hinge (the door carries a
                      believable kick and settle instead of a linear slide).
────────────────────────────────────────────────────────────────────────── */

/**
 * Exponential damping (Freya Holmér's damp). `smoothing` is in 1/seconds:
 * higher converges faster. Identical result regardless of frame rate.
 */
export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-smoothing * dt));
}

/** Angle-aware damp: takes the shortest path around ±π when easing yaw. */
export function dampAngle(current: number, target: number, smoothing: number, dt: number): number {
  const delta = ((((target - current) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return current + delta * (1 - Math.exp(-smoothing * dt));
}

export interface SpringState {
  position: number;
  velocity: number;
}

/**
 * One semi-implicit Euler step of a damped spring toward `target`.
 *
 *   force = (target − x) · stiffness
 *   v = (v + force·dt) · decay^dt
 *   x = x + v·dt
 *
 * The defaults (stiffness 42, decay 0.0008) match the critically damped door
 * kinematics the previous 2D twin converged on after tuning; they read as
 * insulated mass rather than UI tweens.
 */
export function stepSpring(
  state: SpringState,
  target: number,
  dt: number,
  stiffness = 42,
  decay = 0.0008,
): void {
  const force = (target - state.position) * stiffness;
  state.velocity = (state.velocity + force * dt) * Math.pow(decay, dt);
  state.position += state.velocity * dt;
}

/** True when the spring is close enough to its target to sleep (position only). */
export function isSpringSettled(state: SpringState, target: number, epsilon = 0.001): boolean {
  return Math.abs(target - state.position) < epsilon && Math.abs(state.velocity) < epsilon;
}
