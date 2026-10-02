import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../lib/i18n';

/* Same rationale as ULDViewer3D.test.tsx: jsdom never exercises the real
   WebGL path, so the GPU-reset recovery UI needs a mocked scene controller
   to get any coverage at all. */

const onContextChangeSpy = vi.fn<(cb: (lost: boolean) => void) => void>();
let capturedContextCallback: ((lost: boolean) => void) | null = null;

vi.mock('../three/airgl/gl', () => ({
  isWebGLSupported: () => true,
}));

vi.mock('../three/airgl/globe/scene', () => ({
  CorridorGlobeScene: vi.fn().mockImplementation(function FakeCorridorGlobeScene() {
    return {
      onStats: vi.fn(),
      onContextChange: (cb: (lost: boolean) => void) => {
        capturedContextCallback = cb;
        onContextChangeSpy(cb);
      },
      setVisible: vi.fn(),
      setReducedMotion: vi.fn(),
      setActiveCorridor: vi.fn(),
      dispose: vi.fn(),
    };
  }),
}));

const { CorridorGlobe3D } = await import('./CorridorGlobe3D');

function renderGlobe() {
  return render(
    <LanguageProvider>
      <CorridorGlobe3D activeCorridorId={null} />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  capturedContextCallback = null;
  onContextChangeSpy.mockClear();
});

describe('CorridorGlobe3D context-loss recovery', () => {
  it('registers a context-change listener on boot', () => {
    renderGlobe();
    expect(onContextChangeSpy).toHaveBeenCalledTimes(1);
    expect(capturedContextCallback).toBeTypeOf('function');
  });

  it('tells the user when the GPU context drops, as an accessible status region', () => {
    renderGlobe();
    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();

    act(() => capturedContextCallback?.(true));

    const notice = screen.getByText(/reconnecting the 3d renderer/i);
    const status = notice.closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('clears the notice once the context is restored', () => {
    renderGlobe();
    act(() => capturedContextCallback?.(true));
    expect(screen.getByText(/reconnecting the 3d renderer/i)).toBeInTheDocument();

    act(() => capturedContextCallback?.(false));

    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();
  });
});
