/**
 * YASLOGIST AIR — Reveal-on-scroll primitive.
 *
 * One-shot IntersectionObserver: flips `visible` to true the first time the
 * element enters the viewport, then disconnects. All actual animation lives
 * in CSS (`.reveal` in index.css), so it only ever touches opacity/transform,
 * and the prefers-reduced-motion media query neutralises it without any JS
 * branching. Elements are never hidden from users without JavaScript because
 * the whole app is a React SPA — nothing renders without JS in the first
 * place, and the observer degrades to "always visible" when IO is missing.
 */
import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  visible: boolean;
} {
  const ref = useRef<T>(null);
  /* Browsers without IntersectionObserver (or the jsdom test environment's
     stand-in) start revealed: hiding content behind an API that will never
     fire would be a regression, not a fallback. */
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}
