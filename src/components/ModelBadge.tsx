import React, { useEffect, useId, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { Activity, Info } from 'lucide-react';

interface ModelBadgeProps {
  className?: string;
  short?: boolean;
}

/**
 * The simulation disclaimer that makes the rest of the site defensible.
 *
 * This used to be a `title` attribute on a div — invisible to touch users
 * entirely, unreachable by keyboard, and inconsistently announced by screen
 * readers. It is now a disclosure button: the badge toggles a panel that is
 * real text in the accessibility tree, closes on Escape or an outside click,
 * and is reachable by tab, click and tap alike.
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-sky-400/25 bg-sky-950/30 text-[10px] sm:text-xs font-mono tracking-wider uppercase text-sky-300 backdrop-blur-md transition-colors hover:border-sky-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)]"
      >
        <Activity className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" aria-hidden="true" />
        <span>{label}</span>
        <Info className="w-3 h-3 text-sky-300/70 shrink-0" aria-hidden="true" />
      </button>

      <span
        id={panelId}
        role="note"
        hidden={!open}
        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 max-w-[min(16rem,calc(100vw-2rem))] p-3 rounded-xl border border-sky-400/30 bg-[var(--c-card-solid)] shadow-2xl text-[11px] leading-relaxed text-body font-sans normal-case tracking-normal text-left rtl:text-right"
      >
        {dict.brand.modelBadgeDesc}
      </span>
    </span>
  );
};
