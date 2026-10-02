import React, { useId, useState } from 'react';
import { useLang } from '../lib/i18n';
import { validateIataAwb, lookupAirlineByPrefix, suggestAwbCorrection, computeAwbCheckDigit } from '../lib/air-math';
import { useDialog } from '../lib/a11y';
import { FileCheck, Search, CheckCircle2, AlertCircle, X, Sparkles, Wand2 } from 'lucide-react';

interface AwbModalAirProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwbModalAir: React.FC<AwbModalAirProps> = ({ isOpen, onClose }) => {
  const { dict, isRtl } = useLang();
  const titleId = useId();
  const panelRef = useDialog<HTMLDivElement>(isOpen, onClose);
  const [awbInput, setAwbInput] = useState<string>('077-94821031');
  const [result, setResult] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(validateIataAwb(awbInput));
  };

  const handleChange = (value: string) => {
    setAwbInput(value);
    setResult(null);
  };

  const airline = lookupAirlineByPrefix(awbInput);
  const suggestion = result === false ? suggestAwbCorrection(awbInput) : null;
  const expectedCheckDigit = suggestion ? computeAwbCheckDigit(suggestion.replace('-', '').slice(3, 10)) : null;

  const applySuggestion = () => {
    if (!suggestion) return;
    setAwbInput(suggestion);
    setResult(validateIataAwb(suggestion));
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

        {/* Demo Capability Notice */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-950 dark:text-amber-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-950 dark:text-amber-200">
              {isRtl ? 'نموذج محاكاة تشغيلي للقدرات:' : 'Operational Simulation & Capability Demo:'}
            </span>
            <span className="text-[11px] text-amber-900/90 dark:text-slate-400">
              {isRtl
                ? 'محاكاة تقنية لربط تدقيق معايير IATA وخوارزمية Mod-7 مع إشعار نافذة الجمركي بمطار القاهرة.'
                : 'Simulating IATA Mod-7 checksum validation integrated with Cairo Airport Nafeza pre-clearance.'}
            </span>
          </div>
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
            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted mt-2">
              <span>{isRtl ? 'أمثلة للتجربة:' : 'Quick Samples:'}</span>
              <button
                type="button"
                onClick={() => { setAwbInput('077-94821031'); setResult(validateIataAwb('077-94821031')); }}
                className="hover:text-cyan-400 underline"
                dir="ltr"
              >
                077-94821031 (MS)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => { setAwbInput('176-33910244'); setResult(validateIataAwb('176-33910244')); }}
                className="hover:text-cyan-400 underline"
                dir="ltr"
              >
                176-33910244 (EK)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => { setAwbInput('074-11028863'); setResult(validateIataAwb('074-11028863')); }}
                className="hover:text-cyan-400 underline"
                dir="ltr"
              >
                074-11028863 (KL)
              </button>
            </div>
          </div>
        </form>

        {/* Result Verification Box */}
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
                  <span>{isRtl ? 'بنية رقم صحيحة وفق تدقيق Mod-7' : 'Valid AWB number structure (Mod-7 checksum)'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? 'بنية الرقم غير صحيحة (فشل Mod-7)' : 'Invalid AWB number structure (Mod-7 failure)'}</span>
                </>
              )}
            </div>

            {!result && suggestion && (
              <div className="pt-2 border-t border-rose-500/20 space-y-2 text-[11px]">
                <p className="text-muted">
                  {isRtl
                    ? `رقم التحقق الصحيح لهذا التسلسل هو ${expectedCheckDigit} (باقي قسمة التسلسل على 7).`
                    : `The correct check digit for this serial is ${expectedCheckDigit} (serial mod 7).`}
                </p>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold hover:bg-cyan-500/20 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isRtl ? 'هل تقصد' : 'Did you mean'}{' '}
                    <span dir="ltr" className="font-mono">{suggestion}</span>
                    {isRtl ? '؟' : '?'}
                  </span>
                </button>
              </div>
            )}

            {result && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5 text-[11px] text-muted">
                <p className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">Checksum validation does not confirm a booking, carrier record, customs clearance, or shipment status.</p>
                <div className="flex justify-between">
                  <span>{isRtl ? 'شركة الطيران الناقلة:' : 'AIRLINE CARRIER:'}</span>
                  <span className="text-title font-bold" dir="ltr">
                    {airline.nameEn} ({airline.iataCode} · {airline.prefix})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isRtl ? 'المقر والمركز الرئيسي:' : 'CARRIER MAIN HUB:'}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold" dir="ltr">{airline.hub}</span>
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
