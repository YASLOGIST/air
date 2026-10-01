import React, { useId, useState } from 'react';
import { useLang } from '../lib/i18n';
import { useDialog } from '../lib/a11y';
import { Mail, Phone, MessageCircle, Send, X, Lock } from 'lucide-react';

interface QuoteModalAirProps {
  isOpen: boolean;
  onClose: () => void;
}

type Urgency = 'STANDARD' | 'CRITICAL' | 'AOG';

interface QuoteDraft {
  origin: string;
  destination: string;
  weightKg: string;
  commodity: string;
  urgency: Urgency;
}

const EMPTY_DRAFT: QuoteDraft = {
  origin: '',
  destination: '',
  weightKg: '',
  commodity: '',
  urgency: 'CRITICAL',
};

/**
 * Priority-quote composer — the site's first conversion path.
 *
 * Deliberately serverless: the draft is composed on-device into a structured
 * mailto:/wa.me payload addressed to the contact channels already published
 * in the footer (no new data, no third-party form processor, nothing stored).
 * Closes with full dialog semantics via useDialog (focus trap, Escape,
 * scroll-lock, focus restore).
 */
export const QuoteModalAir: React.FC<QuoteModalAirProps> = ({ isOpen, onClose }) => {
  const { dict, isRtl, lang } = useLang();
  const titleId = useId();
  const panelRef = useDialog<HTMLDivElement>(isOpen, onClose);
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_DRAFT);

  if (!isOpen) return null;

  const set = <K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const urgencyLabel = (u: Urgency) =>
    u === 'STANDARD' ? dict.quote.urgencyStandard : u === 'AOG' ? dict.quote.urgencyAog : dict.quote.urgencyCritical;

  /* Composed on every render from the draft — the same body feeds the email
     and the WhatsApp channel, so the two can never drift apart. */
  const bodyLines = [
    '— YASLOGIST AIR · Priority Quote Request —',
    `${dict.quote.origin}: ${draft.origin || '—'}`,
    `${dict.quote.destination}: ${draft.destination || '—'}`,
    `${dict.quote.weight}: ${draft.weightKg || '—'}`,
    `${dict.quote.commodity}: ${draft.commodity || '—'}`,
    `${dict.quote.urgency}: ${urgencyLabel(draft.urgency)}`,
    '',
    `(sent from ${lang === 'ar' ? 'the Arabic' : 'the English'} air.yaslogist.me console)`,
  ];
  const mailBody = encodeURIComponent(bodyLines.join('\n'));
  const waBody = encodeURIComponent(bodyLines.join('\n'));

  const inputClasses =
    'w-full rounded-xl border border-[var(--glass-brd)] bg-[var(--c-subcard)] px-4 py-2.5 text-sm text-title placeholder:text-muted focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40';
  const labelClasses = 'mb-1.5 block text-[11px] font-mono font-semibold uppercase tracking-wider text-muted';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--glass-brd)] bg-[var(--c-card-solid)] p-6 text-body shadow-2xl focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start justify-between border-b border-[var(--glass-brd)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-500">
              <Send className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id={titleId} className="text-base font-bold text-title">
                {dict.quote.modalTitle}
              </h3>
              <span
                className="text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400"
                dir="ltr"
              >
                {dict.quote.modalKicker.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.legal.closeBtn}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-title dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">{dict.quote.modalSubtitle}</p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            /* The primary submit action is the email channel anchor below;
               this handler exists so Enter in any field does the same thing. */
            window.location.href = `mailto:contact@yaslogist.me?subject=${encodeURIComponent(
              dict.quote.emailSubject,
            )}&body=${mailBody}`;
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${titleId}-origin`} className={labelClasses}>
                {dict.quote.origin}
              </label>
              <input
                id={`${titleId}-origin`}
                type="text"
                value={draft.origin}
                onChange={(e) => set('origin', e.target.value)}
                placeholder={dict.quote.originPlaceholder}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor={`${titleId}-dest`} className={labelClasses}>
                {dict.quote.destination}
              </label>
              <input
                id={`${titleId}-dest`}
                type="text"
                value={draft.destination}
                onChange={(e) => set('destination', e.target.value)}
                placeholder={dict.quote.destinationPlaceholder}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${titleId}-weight`} className={labelClasses}>
                {dict.quote.weight}
              </label>
              <input
                id={`${titleId}-weight`}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={draft.weightKg}
                onChange={(e) => set('weightKg', e.target.value)}
                placeholder="450"
                className={inputClasses}
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor={`${titleId}-urgency`} className={labelClasses}>
                {dict.quote.urgency}
              </label>
              <select
                id={`${titleId}-urgency`}
                value={draft.urgency}
                onChange={(e) => set('urgency', e.target.value as Urgency)}
                className={inputClasses}
              >
                <option value="STANDARD">{dict.quote.urgencyStandard}</option>
                <option value="CRITICAL">{dict.quote.urgencyCritical}</option>
                <option value="AOG">{dict.quote.urgencyAog}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`${titleId}-commodity`} className={labelClasses}>
              {dict.quote.commodity}
            </label>
            <input
              id={`${titleId}-commodity`}
              type="text"
              value={draft.commodity}
              onChange={(e) => set('commodity', e.target.value)}
              placeholder={dict.quote.commodityPlaceholder}
              className={inputClasses}
            />
          </div>

          {/* Channel actions — anchors, so they behave as normal links and
              are reachable via keyboard/assistive tech without a submit. */}
          <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
            <a
              href={`mailto:contact@yaslogist.me?subject=${encodeURIComponent(dict.quote.emailSubject)}&body=${mailBody}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 active:scale-95"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {dict.quote.emailCta}
            </a>
            <a
              href="tel:+201041139910"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-600 transition-all hover:border-cyan-400 active:scale-95 dark:text-cyan-300"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {dict.quote.callCta}
            </a>
            <a
              href={`https://wa.me/201041139910?text=${waBody}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600 transition-all hover:border-emerald-400 active:scale-95 dark:text-emerald-300"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {dict.quote.whatsappCta}
            </a>
          </div>
        </form>

        <p className="mt-4 flex items-start gap-2 border-t border-[var(--glass-brd)] pt-3 text-[11px] leading-relaxed text-muted">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
          {dict.quote.privacyNote}
        </p>
      </div>
    </div>
  );
};

export default QuoteModalAir;
