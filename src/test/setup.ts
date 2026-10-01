/**
 * YASLOGIST AIR — Vitest environment shims.
 *
 * jsdom implements none of the browser platform features this app leans on
 * (matchMedia, IntersectionObserver, media playback, smooth scroll). The
 * mocks below default `prefers-reduced-motion: reduce` so component tests
 * exercise the settled, animation-free render path — the same path users
 * with vestibular sensitivities get.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* ── window.matchMedia ─────────────────────────────────────────────────── */
type MediaListener = (e: { matches: boolean; media: string }) => void;

function mockMatchMedia(query: string): MediaQueryList {
  const reduced = query.includes('prefers-reduced-motion');
  const light = query.includes('prefers-color-scheme: light');
  const matches = reduced ? true : light ? false : /(\(min-width|\(max-width)/.test(query);
  const listeners = new Set<MediaListener>();
  return {
    matches,
    media: query,
    onchange: null,
    addListener: (l: MediaListener) => listeners.add(l),
    removeListener: (l: MediaListener) => listeners.delete(l),
    addEventListener: (_: string, l: MediaListener) => listeners.add(l),
    removeEventListener: (_: string, l: MediaListener) => listeners.delete(l),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn(mockMatchMedia),
});

/* ── IntersectionObserver ──────────────────────────────────────────────── */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  /* Everything is visible: reveal-on-scroll components render their settled
     state immediately, which is what the a11y assertions need to see. */
  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        },
      ],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

/* ── Media playback (hero runway video) ────────────────────────────────── */
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

/* ── Scrolling ─────────────────────────────────────────────────────────── */
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});
