import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../lib/i18n';
import { ULD_FLEET } from '../lib/uld-fleet';

/* jsdom has no real WebGL, so the capability probe and imperative renderer
   are mocked. The mock scene lets these tests prove deferred boot, cleanup,
   and the context-loss status contract without allocating a GPU context. */

const { webGlSupport, sceneConstructed, sceneDisposed, sceneSetDoorOpen } = vi.hoisted(() => ({
  webGlSupport: { supported: true },
  sceneConstructed: vi.fn(),
  sceneDisposed: vi.fn(),
  sceneSetDoorOpen: vi.fn(),
}));
const onContextChangeSpy = vi.fn<(cb: (lost: boolean) => void) => void>();
let capturedContextCallback: ((lost: boolean) => void) | null = null;

vi.mock('../three/airgl/webgl-support', () => ({
  isWebGLSupported: () => webGlSupport.supported,
}));

vi.mock('../three/airgl/uld/scene', () => ({
  // A plain function, not an arrow: `new` needs constructor semantics.
  UldScene: vi.fn().mockImplementation(function FakeUldScene() {
    sceneConstructed();
    return {
      onStats: vi.fn(),
      onContextChange: (cb: (lost: boolean) => void) => {
        capturedContextCallback = cb;
        onContextChangeSpy(cb);
      },
      setModel: vi.fn(),
      setAutoRotate: vi.fn(),
      setRenderMode: vi.fn(),
      setDoorOpen: sceneSetDoorOpen,
      setExploded: vi.fn(),
      setVisible: vi.fn(),
      setReducedMotion: vi.fn(),
      setHotspots: vi.fn(),
      setPreset: vi.fn(),
      orbitBy: vi.fn(),
      zoomBy: vi.fn(),
      dispose: sceneDisposed,
    };
  }),
}));

const { ULDViewer3D } = await import('./ULDViewer3D');

class ManualIntersectionObserver {
  static instances: ManualIntersectionObserver[] = [];

  constructor(private readonly callback: IntersectionObserverCallback) {
    ManualIntersectionObserver.instances.push(this);
  }

  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }

  trigger(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting, target: document.body } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function mountViewer() {
  return render(
    <LanguageProvider>
      <ULDViewer3D uld={ULD_FLEET[0]} />
    </LanguageProvider>,
  );
}

async function renderViewer() {
  const view = mountViewer();
  await waitFor(() => expect(onContextChangeSpy).toHaveBeenCalledTimes(1));
  return view;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  ManualIntersectionObserver.instances = [];
  webGlSupport.supported = true;
  sceneConstructed.mockClear();
  sceneDisposed.mockClear();
  sceneSetDoorOpen.mockClear();
  capturedContextCallback = null;
  onContextChangeSpy.mockClear();
});

describe('ULDViewer3D deferred renderer and context recovery', () => {
  it('does not construct the scene until the viewport approaches the screen', async () => {
    vi.stubGlobal('IntersectionObserver', ManualIntersectionObserver);
    const view = mountViewer();

    await waitFor(() => expect(ManualIntersectionObserver.instances).toHaveLength(1));
    expect(sceneConstructed).not.toHaveBeenCalled();
    // Controls stay responsive during the deferred load, and the selected
    // intent is replayed when the imperative scene finally boots.
    fireEvent.click(screen.getByRole('button', { name: /open door/i }));
    expect(screen.getByRole('button', { name: /close door/i })).toBeInTheDocument();

    await act(async () => ManualIntersectionObserver.instances[0].trigger(true));
    await waitFor(() => expect(onContextChangeSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(sceneSetDoorOpen).toHaveBeenCalledWith(true));
    expect(sceneConstructed).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(sceneDisposed).toHaveBeenCalledTimes(1);
  });

  it('abandons an in-flight chunk import when unmounted before it resolves', async () => {
    vi.stubGlobal('IntersectionObserver', ManualIntersectionObserver);
    const view = mountViewer();
    await waitFor(() => expect(ManualIntersectionObserver.instances).toHaveLength(1));

    await act(async () => {
      ManualIntersectionObserver.instances[0].trigger(true);
      view.unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(sceneConstructed).not.toHaveBeenCalled();
    expect(sceneDisposed).not.toHaveBeenCalled();
  });

  it('registers a context-change listener on boot', async () => {
    await renderViewer();
    expect(capturedContextCallback).toBeTypeOf('function');
  });

  it('announces GPU loss through an accessible status region', async () => {
    await renderViewer();
    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();

    act(() => capturedContextCallback?.(true));

    const notice = screen.getByText(/reconnecting the 3d renderer/i);
    const status = notice.closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('clears the context-loss notice after restoration', async () => {
    await renderViewer();
    act(() => capturedContextCallback?.(true));
    expect(screen.getByText(/reconnecting the 3d renderer/i)).toBeInTheDocument();

    act(() => capturedContextCallback?.(false));

    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();
  });

  it('keeps the unit specifications available without downloading the scene when WebGL is unavailable', async () => {
    webGlSupport.supported = false;
    mountViewer();

    expect(await screen.findByText(/WebGL is unavailable/i)).toBeInTheDocument();
    expect(sceneConstructed).not.toHaveBeenCalled();
    expect(screen.getByText(/unit specification summary remains below/i)).toBeInTheDocument();
  });
});
