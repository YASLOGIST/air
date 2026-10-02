/* ── Canvas scene scheduling ──────────────────────────────────────────────
   The ULD digital twin used to repaint its canvas on every animation frame
   unconditionally, so an idle, untouched model still cost a full scene redraw
   60 times a second for as long as it stayed near the viewport.

   Only three things can change the picture:
     1. scene state (camera, door, explosion, render mode, selected ULD) —
        these must be drawn as soon as they change, with no added latency;
     2. ambient time-based detail (blinking cooling LED, cold-air particles,
        pulsing hotspot halos) — visually identical at a reduced frame rate;
     3. nothing — in which case the correct number of redraws is zero.

   `runSceneLoop` encodes exactly that policy and takes its clock and frame
   source by injection so it can be verified deterministically in tests.
────────────────────────────────────────────────────────────────────────── */

export interface SceneLoopOptions {
  /** Repaint the canvas. */
  draw: () => void;
  /**
   * Monotonically changing token identifying the current scene state. The loop
   * draws immediately whenever it differs from the last drawn token.
   */
  getStateToken: () => unknown;
  /** Whether time-based ambient detail should keep animating. */
  isAmbientAnimated: () => boolean;
  /** Minimum gap between purely ambient repaints. Default 30 ms (~30 fps). */
  ambientIntervalMs?: number;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
}

/* 30 ms rather than 1000/30: at a 60 Hz frame cadence this lands reliably on
   every second frame instead of occasionally slipping to every third. */
export const DEFAULT_AMBIENT_INTERVAL_MS = 30;

/**
 * Start the scene loop. Returns a stop function that cancels the pending frame.
 */
export function runSceneLoop({
  draw,
  getStateToken,
  isAmbientAnimated,
  ambientIntervalMs = DEFAULT_AMBIENT_INTERVAL_MS,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
}: SceneLoopOptions): () => void {
  let handle = 0;
  let stopped = false;
  let lastToken: unknown = Symbol('never-drawn');
  let lastAmbientDrawAt = Number.NEGATIVE_INFINITY;

  const frame = (time: number) => {
    const token = getStateToken();
    const stateChanged = token !== lastToken;
    const ambientDue = isAmbientAnimated() && time - lastAmbientDrawAt >= ambientIntervalMs;

    if (stateChanged || ambientDue) {
      lastToken = token;
      lastAmbientDrawAt = time;
      draw();
    }

    if (!stopped) handle = requestFrame(frame);
  };

  handle = requestFrame(frame);

  return () => {
    stopped = true;
    cancelFrame(handle);
  };
}
