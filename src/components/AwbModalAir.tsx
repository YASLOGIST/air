import React, { useId, useState } from 'react';
import { useLang } from '../lib/i18n';
import { validateIataAwb } from '../lib/air-math';
import { useDialog } from '../lib/a11y';
import { FileCheck, Search, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AwbModalAirProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwbModalAir: React.FC<AwbModalAirProps> = ({ isOpen, onClose }) => {
  const { dict, isRtl } = useLang();
  const titleId = useId();
  const panelRef = useDialog<HTMLDivElement>(isOpen, onClose);
  const [awbInput, setAwbInput] = useState<string>('077-94821031');
  /* `null` = not yet checked. Modelling the result as a nullable boolean rather
     than a (hasChecked, isValid) pair makes "claims valid before any check ran"
     unrepresentable — the previous default of (true, true) rendered a green
     Mod-7 PASS on open, which the prefilled sample then failed on submit. */
  const [result, setResult] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(validateIataAwb(awbInput));
  };

  const handleChange = (value: string) => {
    setAwbInput(value);
    // A verdict belongs to the string it was computed from, not to the field.
    setResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-lg rounded-3xl border border-[var(--glass-brd)] bg-[var(--c-card-solid)] shadow-2xl p-6 text-body space-y-5 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <FileCheck className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id={titleId} className="font-bold text-base text-title">
                {isRtl ? 'فحص بوليصة الشحن الجوي e-AWB' : 'Validate IATA e-AWB Number'}
              </h3>
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold" dir="ltr">
                MOD-7 CHECKSUM & NAFEZA ACID PRE-CLEAR
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isRtl ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-lg text-muted hover:text-title hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor={`${titleId}-awb`} className="block text-xs font-mono text-title mb-1.5 font-semibold">
              {isRtl ? 'أدخل رقم بوليصة الشحن (XXX-XXXXXXXC):' : 'Enter 11-Digit IATA AWB Number:'}
            </label>
            <div className="relative">
              <input
                id={`${titleId}-awb`}
                type="text"
                inputMode="numeric"
                value={awbInput}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="e.g. 077-94821031"
                className="w-full px-4 py-3 rounded-xl glass-subcard border border-[var(--glass-brd)] text-title font-mono text-sm focus:outline-none focus:border-cyan-500"
                dir="ltr"
              />
              <button
                type="submit"
                className="absolute inset-y-1.5 right-1.5 rtl:right-auto rtl:left-1.5 px-4 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isRtl ? 'فحص' : 'Check'}</span>
              </button>
            </div>
            <span className="block text-[10px] font-mono text-muted mt-1" dir="ltr">
              Sample: 077-94821031 (simulated consignment · Mod-7 valid)
            </span>
          </div>
        </form>

        {/* Result Verification Box */}
        {/* role="status" announces the verdict when it appears. It changes only
            on submit, so there is nothing here to spam a screen reader with. */}
        {result !== null && (
          <div
            role="status"
            className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${
              result
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {result ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? 'بوليصة صحيحة ومطابقة للخوارزمية' : 'Valid IATA e-AWB Format (Mod-7 Verified)'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? 'بوليصة غير صحيحة (فشل التدقيق)' : 'Invalid Checksum (Mod-7 Failure)'}</span>
                </>
              )}
            </div>

            {result && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1 text-[11px] text-muted">
                <div className="flex justify-between">
                  <span>Airline Prefix:</span>
                  <span className="text-title font-bold" dir="ltr">{awbInput.substring(0, 3)} (EgyptAir Cargo)</span>
                </div>
                <div className="flex justify-between">
                  <span>Customs ACID:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold" dir="ltr">2026000994108770001</span>
                </div>
                <div className="flex justify-between">
                  <span>Cargo Village Status:</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold" dir="ltr">PRE-APPROVED FOR DIRECT REEFER GATE-OUT</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-subcard hover:border-cyan-400 text-xs font-mono text-title transition-colors"
          >
            {dict.legal.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
