import { describe, expect, it } from 'vitest';
import { runSceneLoop } from './scene-loop';

/** Deterministic animation-frame driver: 60 Hz unless told otherwise. */
function fakeFrames(stepMs = 1000 / 60) {
  let time = 0;
  let next = 1;
  const pending = new Map<number, FrameRequestCallback>();
  return {
    requestFrame: (callback: FrameRequestCallback) => {
      const handle = next++;
      pending.set(handle, callback);
      return handle;
    },
    cancelFrame: (handle: number) => {
      pending.delete(handle);
    },
    advance(frames: number) {
      for (let i = 0; i < frames; i++) {
        const entries = [...pending.entries()];
        pending.clear();
        time += stepMs;
        entries.forEach(([, callback]) => callback(time));
      }
    },
    get queued() {
      return pending.size;
    },
  };
}

describe('scene loop scheduling', () => {
  it('draws nothing while the scene is static and ambient motion is off', () => {
    const frames = fakeFrames();
    let draws = 0;
    runSceneLoop({
      draw: () => draws++,
      getStateToken: () => 'static',
      isAmbientAnimated: () => false,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
    });

    frames.advance(60);
    // One initial paint of the current state, then silence.
    expect(draws).toBe(1);
  });

  it('draws immediately on the frame a state change lands, with no throttle', () => {
    const frames = fakeFrames();
    let draws = 0;
    let token = 0;
    runSceneLoop({
      draw: () => draws++,
      getStateToken: () => token,
      isAmbientAnimated: () => false,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
    });

    frames.advance(1);
    expect(draws).toBe(1);

    // A drag updates the camera on every frame: every frame must be painted.
    for (let i = 0; i < 10; i++) {
      token++;
      frames.advance(1);
    }
    expect(draws).toBe(11);
  });

  it('throttles ambient-only repaints to the configured interval', () => {
    const frames = fakeFrames();
    let draws = 0;
    runSceneLoop({
      draw: () => draws++,
      getStateToken: () => 'static',
      isAmbientAnimated: () => true,
      ambientIntervalMs: 30,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
    });

    frames.advance(60); // one second at 60 Hz
    // ~30 ambient repaints instead of 60 full scene redraws.
    expect(draws).toBeLessThanOrEqual(31);
    expect(draws).toBeGreaterThanOrEqual(29);
  });

  it('stops requesting frames once stopped', () => {
    const frames = fakeFrames();
    let draws = 0;
    const stop = runSceneLoop({
      draw: () => draws++,
      getStateToken: () => Math.random(),
      isAmbientAnimated: () => true,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
    });

    frames.advance(3);
    const drawsBeforeStop = draws;
    stop();
    frames.advance(10);

    expect(frames.queued).toBe(0);
    expect(draws).toBe(drawsBeforeStop);
  });
});
