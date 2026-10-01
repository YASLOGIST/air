import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Lightweight global polish: reading progress, section reveals, and back-to-top. */
export const ExperienceLayer: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const total = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      setProgress(Math.min(1, scrollY / total));
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('main > section, main > div > section');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('section-visible'));
      return;
    }
    sections.forEach((section) => section.classList.add('section-reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[10001] h-[2px] bg-white/5" aria-hidden="true">
        <span className="block h-full origin-left bg-gradient-to-r from-sky-500 via-cyan-300 to-emerald-300 shadow-[0_0_12px_#22d3ee]" style={{ transform: `scaleX(${progress})` }} />
      </div>
      {progress > 0.16 && (
        <button
          type="button"
          onClick={() => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          className="fixed bottom-4 left-4 z-[8500] grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[#06101d]/85 text-slate-300 shadow-xl backdrop-blur-xl hover:border-cyan-300/50 hover:text-white"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </>
  );
};
