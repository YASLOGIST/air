import { describe, expect, it, vi } from 'vitest';
import { watchContextLoss } from './gl';

/**
 * Pure-DOM contract: no real WebGL context is needed to prove this wiring,
 * which is exactly why it is unit-tested directly rather than left as an
 * UNMEASURED claim — the lost/restored dance is the one piece of context
 * recovery that is *not* automatic in three.js (see gl.ts doc comment).
 */
describe('watchContextLoss', () => {
  it('prevents the default context-loss behaviour so the browser will attempt restoration', () => {
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const onRestored = vi.fn();
    watchContextLoss(canvas, { onLost, onRestored });

    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('notifies restoration independently of loss', () => {
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const onRestored = vi.fn();
    watchContextLoss(canvas, { onLost, onRestored });

    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(onLost).not.toHaveBeenCalled();
  });

  it('detaches both listeners when the returned cleanup runs', () => {
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const stop = watchContextLoss(canvas, { onLost, onRestored });

    stop();
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(onLost).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });
});
