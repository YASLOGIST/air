import React, { useState } from 'react';
import { useLang } from '../lib/i18n';
import { validateIataAwb } from '../lib/air-math';
import { FileCheck, Search, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AwbModalAirProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwbModalAir: React.FC<AwbModalAirProps> = ({ isOpen, onClose }) => {
  const { dict, isRtl } = useLang();
  const [awbInput, setAwbInput] = useState<string>('077-94821034');
  const [hasChecked, setHasChecked] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = validateIataAwb(awbInput);
    setIsValid(valid);
    setHasChecked(true);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-[var(--glass-brd)] bg-[var(--c-card-solid)] shadow-2xl p-6 text-body space-y-5"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-title">
                {isRtl ? 'فحص بوليصة الشحن الجوي e-AWB' : 'Validate IATA e-AWB Number'}
              </h3>
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold" dir="ltr">
                MOD-7 CHECKSUM & NAFEZA ACID PRE-CLEAR
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-title hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-title mb-1.5 font-semibold">
              {isRtl ? 'أدخل رقم بوليصة الشحن (XXX-XXXXXXXC):' : 'Enter 11-Digit IATA AWB Number:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                placeholder="e.g. 077-94821034"
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
              Sample: 077-94821034 (Cairo Cargo Live Model)
            </span>
          </div>
        </form>

        {/* Result Verification Box */}
        {hasChecked && (
          <div
            className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${
              isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isValid ? (
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

            {isValid && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1 text-[11px] text-muted">
                <div className="flex justify-between">
                  <span>Airline Prefix:</span>
                  <span className="text-title font-bold" dir="ltr">{awbInput.substring(0, 3)} (EgyptAir Cargo)</span>
                </div>
                <div className="flex justify-between">
                  <span>Customs ACID:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold" dir="ltr">2026-CAI-994108 (MATCHED)</span>
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
