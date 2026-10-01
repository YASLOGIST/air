import React, { useEffect, useId, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { Activity, Info } from 'lucide-react';

interface ModelBadgeProps {
  className?: string;
  short?: boolean;
}

/**
 * The simulation disclaimer that makes the rest of the site defensible.
 * Renders as a single, accessible amber/yellow badge:
 * - English: "SIMULATION DEMO"
 * - Arabic: "محاكاة تشغيلية"
 */
export const ModelBadge: React.FC<ModelBadgeProps> = ({ className = '', short = false }) => {
  const { dict, isRtl } = useLang();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const label = short ? dict.brand.modelBadge.split('·')[0] : dict.brand.modelBadge;

  return (
    <span ref={wrapperRef} className={`relative inline-flex ${className}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-400/40 bg-amber-500/10 text-[10px] sm:text-xs font-mono tracking-wider uppercase text-amber-300 backdrop-blur-md transition-colors hover:border-amber-400 hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)]"
      >
        <Activity className="w-3 h-3 text-amber-400 animate-pulse shrink-0" aria-hidden="true" />
        <span className="font-semibold">{label}</span>
        <Info className="w-3 h-3 text-amber-300/70 shrink-0" aria-hidden="true" />
      </button>

      <span
        id={panelId}
        role="note"
        hidden={!open}
        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 max-w-[min(16rem,calc(100vw-2rem))] p-3 rounded-xl border border-amber-400/30 bg-[var(--c-card-solid)] shadow-2xl text-[11px] leading-relaxed text-body font-sans normal-case tracking-normal text-left rtl:text-right"
      >
        {dict.brand.modelBadgeDesc}
      </span>
    </span>
  );
};

export default ModelBadge;
