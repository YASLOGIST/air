import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../lib/i18n';
import { ULD_FLEET } from '../lib/uld-fleet';

/* jsdom has no real WebGL, so `isWebGLSupported()` always reports false and
   the real UldScene is never constructed in any test — which means the
   GPU-reset recovery UI (added alongside `watchContextLoss` in gl.ts) had
   zero coverage. Mocking the scene controller lets the component test
   drive that contract directly: register a context-change listener, flip
   it, assert the user is told and then told again when it clears. */

const onContextChangeSpy = vi.fn<(cb: (lost: boolean) => void) => void>();
let capturedContextCallback: ((lost: boolean) => void) | null = null;

vi.mock('../three/airgl/gl', () => ({
  isWebGLSupported: () => true,
}));

vi.mock('../three/airgl/uld/scene', () => ({
  // A plain function, not an arrow: vi.fn() implementations used with `new`
  // need real constructor semantics, which arrow functions don't have.
  UldScene: vi.fn().mockImplementation(function FakeUldScene() {
    return {
      onStats: vi.fn(),
      onContextChange: (cb: (lost: boolean) => void) => {
        capturedContextCallback = cb;
        onContextChangeSpy(cb);
      },
      setModel: vi.fn(),
      setAutoRotate: vi.fn(),
      setRenderMode: vi.fn(),
      setDoorOpen: vi.fn(),
      setExploded: vi.fn(),
      setVisible: vi.fn(),
      setReducedMotion: vi.fn(),
      setHotspots: vi.fn(),
      setPreset: vi.fn(),
      orbitBy: vi.fn(),
      zoomBy: vi.fn(),
      dispose: vi.fn(),
    };
  }),
}));

const { ULDViewer3D } = await import('./ULDViewer3D');

function renderViewer() {
  return render(
    <LanguageProvider>
      <ULDViewer3D uld={ULD_FLEET[0]} />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  capturedContextCallback = null;
  onContextChangeSpy.mockClear();
});

describe('ULDViewer3D context-loss recovery', () => {
  it('registers a context-change listener on boot', () => {
    renderViewer();
    expect(onContextChangeSpy).toHaveBeenCalledTimes(1);
    expect(capturedContextCallback).toBeTypeOf('function');
  });

  it('tells the user when the GPU context drops, as an accessible status region', () => {
    renderViewer();
    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();

    act(() => capturedContextCallback?.(true));

    const notice = screen.getByText(/reconnecting the 3d renderer/i);
    const status = notice.closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('clears the notice once the context is restored', () => {
    renderViewer();
    act(() => capturedContextCallback?.(true));
    expect(screen.getByText(/reconnecting the 3d renderer/i)).toBeInTheDocument();

    act(() => capturedContextCallback?.(false));

    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();
  });
});
