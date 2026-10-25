import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLang } from '../lib/i18n';

const REVEAL_SELECTOR = 'main > section, main > div > section';

/** Lightweight global polish: reading progress, section reveals, and back-to-top. */
export const ExperienceLayer: React.FC = () => {
  const { isRtl } = useLang();
  const barRef = useRef<HTMLSpanElement>(null);
  const [showTopButton, setShowTopButton] = useState(false);

  /* Scroll progress is a paint-only concern, so it is written straight to the
     bar's transform instead of through React state. The previous version set
     state on every scroll frame, which re-rendered this component ~60×/s for
     a 2px decoration; only the back-to-top button's visibility — a boolean
     that flips at most twice per page traversal — still goes through React. */
  useEffect(() => {
    let frame = 0;
    /* Document length is measured when it can actually change — on resize and
       when lazy sections mount — not on every scroll frame. The old handler
       read `scrollHeight` (a forced layout) ~60×/s during a smooth scroll. */
    let total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const measureTotal = () => {
      total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / total));
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      /* Only a boolean that flips at most twice per traversal goes through
         React, and only when it actually changes. */
      setShowTopButton((previous) => {
        const next = progress > 0.16;
        return next === previous ? previous : next;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measureTotal();
      onScroll();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    /* Sections are lazy; their arrival changes the document length. */
    const main = document.querySelector('main');
    const sizeObserver =
      typeof ResizeObserver !== 'undefined' && document.body
        ? new ResizeObserver(() => {
            measureTotal();
            onScroll();
          })
        : null;
    if (sizeObserver && document.body) sizeObserver.observe(document.body);
    const mutations = main ? new MutationObserver(measureTotal) : null;
    if (main && mutations) mutations.observe(main, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      sizeObserver?.disconnect();
      mutations?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* Section reveals.
     Every feature section is behind `React.lazy`, so at the moment this effect
     first ran none of them existed yet — the original one-shot
     `querySelectorAll` found only the eagerly rendered cinematic stage and the
     reveal silently did nothing for the other ten sections. The observer now
     also watches `main` for sections arriving as their chunks resolve.

     Sections already inside (or above) the viewport are never given the hidden
     start state, so a late-resolving chunk below the fold animates in while one
     that lands under the user's cursor simply appears. */
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    const tracked = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('section-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const track = (section: Element) => {
      if (tracked.has(section)) return;
      tracked.add(section);
      if (section.getBoundingClientRect().top < window.innerHeight) return;
      section.classList.add('section-reveal');
      observer.observe(section);
    };

    main.querySelectorAll(REVEAL_SELECTOR).forEach(track);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches('section')) track(node);
          node.querySelectorAll?.('section').forEach(track);
        }
      }
    });
    mutations.observe(main, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[9500] h-[2px] bg-[var(--c-border)]" aria-hidden="true">
        <span
          ref={barRef}
          className="block h-full origin-left rtl:origin-right bg-[var(--c-accent)]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      {showTopButton && (
        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            })
          }
          className="fixed bottom-4 start-4 z-[8500] grid h-9 w-9 place-items-center rounded-full border border-[var(--c-border)] bg-[var(--c-card-solid)] text-muted shadow-sm transition-colors hover:border-[var(--c-accent)] hover:text-title"
          aria-label={isRtl ? 'العودة إلى الأعلى' : 'Back to top'}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </>
  );
};
