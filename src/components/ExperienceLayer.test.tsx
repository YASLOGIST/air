import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../lib/i18n';
import { ExperienceLayer } from './ExperienceLayer';

/* The reveal ran a single `querySelectorAll` on mount. Every feature section
   on this page is behind `React.lazy`, so at that moment none of them existed
   and the animation silently applied to nothing for ten of the eleven
   sections — a dead CSS feature that still shipped its bytes. These tests pin
   the two halves of the fix: sections that arrive later are picked up, and
   sections already on screen are never given the hidden start state (which
   would flash them out and back in). */

interface Observed {
  element: Element;
  callback: IntersectionObserverCallback;
}

const observations: Observed[] = [];
let originalIO: typeof IntersectionObserver | undefined;

class MockIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(element: Element) {
    observations.push({ element, callback: this.callback });
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/** Place an element relative to the fold; jsdom reports every rect as zero. */
function placeAt(element: Element, top: number) {
  element.getBoundingClientRect = () =>
    ({ top, bottom: top + 400, left: 0, right: 0, width: 0, height: 400, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
}

function renderLayer() {
  return render(
    <LanguageProvider>
      <ExperienceLayer />
    </LanguageProvider>,
  );
}

function appendSection(main: HTMLElement, top: number) {
  const section = document.createElement('section');
  placeAt(section, top);
  main.appendChild(section);
  return section;
}

beforeEach(() => {
  observations.length = 0;
  originalIO = globalThis.IntersectionObserver;
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
});

afterEach(() => {
  vi.stubGlobal('IntersectionObserver', originalIO);
  document.querySelectorAll('main').forEach((element) => element.remove());
});

describe('section reveal', () => {
  it('picks up sections that mount after the observer is installed', async () => {
    const main = document.createElement('main');
    document.body.appendChild(main);
    renderLayer();

    // A lazy chunk resolves and inserts its section, well below the fold.
    const late = appendSection(main, 2000);

    await waitFor(() => expect(late.classList.contains('section-reveal')).toBe(true));
    expect(observations.map((entry) => entry.element)).toContain(late);
  });

  it('reveals a tracked section once it intersects', async () => {
    const main = document.createElement('main');
    document.body.appendChild(main);
    renderLayer();

    const late = appendSection(main, 2000);
    await waitFor(() => expect(observations.length).toBe(1));

    const { callback } = observations[0];
    callback([{ target: late, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(late.classList.contains('section-visible')).toBe(true);
  });

  it('never hides a section that is already on screen', async () => {
    const main = document.createElement('main');
    const visible = appendSection(main, 120);
    document.body.appendChild(main);

    renderLayer();

    await waitFor(() => expect(document.querySelector('[aria-label="Back to top"], main')).not.toBeNull());
    expect(visible.classList.contains('section-reveal')).toBe(false);
    expect(observations).toHaveLength(0);
  });
});
