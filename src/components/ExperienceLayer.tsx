import React, { useEffect, useId, useMemo, useState } from 'react';
import { ArrowUp, Command, Navigation, Search, X } from 'lucide-react';
import { useDialog } from '../lib/a11y';
import { useLang } from '../lib/i18n';

const destinations = [
  { id: 'radar', en: 'Flight radar & sensor HUD', ar: 'رادار الرحلات والمستشعرات' },
  { id: 'uld', en: 'ULD digital twin', ar: 'التوأم الرقمي للحاويات' },
  { id: 'simulator', en: 'Cargo simulator', ar: 'محاكي الشحن' },
  { id: 'cargovillage', en: 'Cargo Village flow', ar: 'مسار قرية البضائع' },
  { id: 'corridors', en: 'Strategic corridors', ar: 'الممرات الاستراتيجية' },
  { id: 'tracker', en: 'Consignment demonstration', ar: 'عرض تتبع الشحنات' },
] as const;

export const ExperienceLayer: React.FC = () => {
  const { lang, isRtl } = useLang();
  const [progress, setProgress] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const titleId = useId();
  const dialogRef = useDialog<HTMLDivElement>(paletteOpen, () => setPaletteOpen(false));

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
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    addEventListener('keydown', onKeyDown);
    return () => removeEventListener('keydown', onKeyDown);
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return destinations.filter((item) => !normalized || item.en.toLowerCase().includes(normalized) || item.ar.includes(normalized));
  }, [query]);

  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    setPaletteOpen(false);
    setQuery('');
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[10001] h-[2px] bg-white/5" aria-hidden="true">
        <span className="block h-full origin-left bg-gradient-to-r from-sky-500 via-cyan-300 to-emerald-300 shadow-[0_0_12px_#22d3ee]" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="fixed bottom-4 left-4 z-[8500] flex items-center gap-2" dir="ltr">
        <button type="button" onClick={() => setPaletteOpen(true)} className="experience-command flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#06101d]/85 px-3 py-2 font-mono text-[10px] font-bold tracking-wider text-cyan-100 shadow-2xl backdrop-blur-xl" aria-label="Open page navigator">
          <Command className="h-3.5 w-3.5 text-cyan-300" /><span className="hidden sm:inline">NAVIGATE</span><kbd className="hidden rounded border border-white/15 px-1 text-[8px] text-slate-400 sm:inline">⌘K</kbd>
        </button>
        {progress > 0.16 && <button type="button" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[#06101d]/85 text-slate-300 shadow-xl backdrop-blur-xl hover:border-cyan-300/50 hover:text-white" aria-label="Back to top"><ArrowUp className="h-4 w-4" /></button>}
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-[11000] flex items-start justify-center bg-[#02050b]/80 px-4 pt-[12vh] backdrop-blur-xl" onMouseDown={() => setPaletteOpen(false)}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()} className="command-panel w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#07111f]/95 shadow-[0_32px_100px_rgba(0,0,0,.7),0_0_50px_rgba(34,211,238,.08)]">
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <Search className="h-5 w-5 text-cyan-300" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isRtl ? 'انتقل إلى أي نظام…' : 'Jump to any system…'} className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500" />
              <button onClick={() => setPaletteOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close navigator"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[55vh] space-y-1 overflow-auto p-2">
              <p id={titleId} className="px-3 py-2 font-mono text-[9px] tracking-[.2em] text-slate-500">PLATFORM DESTINATIONS</p>
              {filtered.map((item, index) => <button key={item.id} onClick={() => navigate(item.id)} className="group flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm text-slate-200 transition hover:bg-cyan-300/10 hover:text-white"><span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 font-mono text-[9px] text-cyan-300">0{index + 1}</span>{lang === 'ar' ? item.ar : item.en}</span><Navigation className="h-3.5 w-3.5 text-slate-600 transition group-hover:text-cyan-300" /></button>)}
              {!filtered.length && <p className="p-6 text-center text-sm text-slate-500">No matching system</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
