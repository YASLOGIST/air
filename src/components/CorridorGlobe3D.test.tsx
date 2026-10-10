import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../lib/i18n';

/* jsdom never creates WebGL contexts. Mock the capability probe and scene so
   loading/cleanup and GPU-reset UI can be tested without a GPU or Three.js. */

const { webGlSupport, sceneConstructed, sceneDisposed } = vi.hoisted(() => ({
  webGlSupport: { supported: true },
  sceneConstructed: vi.fn(),
  sceneDisposed: vi.fn(),
}));
const onContextChangeSpy = vi.fn<(cb: (lost: boolean) => void) => void>();
let capturedContextCallback: ((lost: boolean) => void) | null = null;

vi.mock('../three/airgl/webgl-support', () => ({
  isWebGLSupported: () => webGlSupport.supported,
}));

vi.mock('../three/airgl/globe/scene', () => ({
  CorridorGlobeScene: vi.fn().mockImplementation(function FakeCorridorGlobeScene() {
    sceneConstructed();
    return {
      onStats: vi.fn(),
      onContextChange: (cb: (lost: boolean) => void) => {
        capturedContextCallback = cb;
        onContextChangeSpy(cb);
      },
      setVisible: vi.fn(),
      setReducedMotion: vi.fn(),
      setActiveCorridor: vi.fn(),
      dispose: sceneDisposed,
    };
  }),
}));

const { CorridorGlobe3D } = await import('./CorridorGlobe3D');

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

function mountGlobe() {
  return render(
    <LanguageProvider>
      <CorridorGlobe3D activeCorridorId={null} />
    </LanguageProvider>,
  );
}

async function renderGlobe() {
  const view = mountGlobe();
  await waitFor(() => expect(onContextChangeSpy).toHaveBeenCalledTimes(1));
  return view;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  ManualIntersectionObserver.instances = [];
  webGlSupport.supported = true;
  sceneConstructed.mockClear();
  sceneDisposed.mockClear();
  capturedContextCallback = null;
  onContextChangeSpy.mockClear();
});

describe('CorridorGlobe3D deferred renderer and context recovery', () => {
  it('defers the Three.js scene until the globe approaches the viewport', async () => {
    vi.stubGlobal('IntersectionObserver', ManualIntersectionObserver);
    const view = mountGlobe();

    await waitFor(() => expect(ManualIntersectionObserver.instances).toHaveLength(1));
    expect(sceneConstructed).not.toHaveBeenCalled();

    await act(async () => ManualIntersectionObserver.instances[0].trigger(true));
    await waitFor(() => expect(onContextChangeSpy).toHaveBeenCalledTimes(1));
    expect(sceneConstructed).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(sceneDisposed).toHaveBeenCalledTimes(1);
  });

  it('abandons an in-flight chunk import when unmounted before it resolves', async () => {
    vi.stubGlobal('IntersectionObserver', ManualIntersectionObserver);
    const view = mountGlobe();
    await waitFor(() => expect(ManualIntersectionObserver.instances).toHaveLength(1));

    await act(async () => {
      ManualIntersectionObserver.instances[0].trigger(true);
      view.unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(sceneConstructed).not.toHaveBeenCalled();
    expect(sceneDisposed).not.toHaveBeenCalled();
  });

  it('registers a context-change listener once the scene boots', async () => {
    await renderGlobe();
    expect(capturedContextCallback).toBeTypeOf('function');
  });

  it('announces GPU loss through an accessible status region', async () => {
    await renderGlobe();
    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();

    act(() => capturedContextCallback?.(true));

    const notice = screen.getByText(/reconnecting the 3d renderer/i);
    const status = notice.closest('[role="status"]');
    expect(status).not.toBeNull();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('clears the context-loss notice after restoration', async () => {
    await renderGlobe();
    act(() => capturedContextCallback?.(true));
    expect(screen.getByText(/reconnecting the 3d renderer/i)).toBeInTheDocument();

    act(() => capturedContextCallback?.(false));

    expect(screen.queryByText(/reconnecting the 3d renderer/i)).not.toBeInTheDocument();
  });

  it('keeps corridor cards usable when WebGL is unavailable', async () => {
    webGlSupport.supported = false;
    mountGlobe();

    expect(await screen.findByText(/WebGL is unavailable/i)).toBeInTheDocument();
    expect(sceneConstructed).not.toHaveBeenCalled();
    expect(screen.getByText(/remain browsable in the cards below/i)).toBeInTheDocument();
  });
});
