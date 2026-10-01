import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { documentScrollFraction } from '../lib/scroll-progress';
import { ArrowUp } from 'lucide-react';

/* Ring geometry: r=15.9155 makes the circumference ≈ 100, so the stroke
   dashoffset can be driven directly by the scroll fraction (0–100). */
const RING_RADIUS = 15.9155;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const APPEAR_FRACTION = 0.08;

/**
 * Back-to-top control with a live scroll-progress ring. On a page whose hero
 * alone is 320vh, jumping back to navigation otherwise means flailing at the
 * wheel for several seconds.
 *
 * The ring is updated from a rAF-coalesced scroll handler that only touches
 * two attributes (stroke-dashoffset, and a visibility class), so it costs
 * nothing while the page is idle — the handler unsubscribes entirely once
 * the page is back near the top.
 */
export const ScrollTopFab: React.FC = () => {
  const { isRtl } = useLang();
  const [visible, setVisible] = useState(false);
  const [fraction, setFraction] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const f = documentScrollFraction();
      setFraction(f);
      setVisible(f > APPEAR_FRACTION);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrollTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label={isRtl ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 end-5 z-[8000] grid h-12 w-12 place-items-center rounded-full border border-cyan-400/40 bg-[var(--c-card-solid)]/90 text-cyan-500 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:border-cyan-300 hover:text-cyan-400 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="18" cy="18" r={RING_RADIUS}
          fill="none" stroke="var(--c-border)" strokeWidth="2.5"
        />
        <circle
          cx="18" cy="18" r={RING_RADIUS}
          fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>
      <ArrowUp className="h-4.5 w-4.5" aria-hidden="true" />
    </button>
  );
};

export default ScrollTopFab;
