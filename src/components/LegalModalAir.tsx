import React, { useState, useEffect } from 'react';
import { useLang } from '../lib/i18n';
import { Shield, FileText, Lock, X, AlertCircle } from 'lucide-react';

interface LegalModalAirProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'TERMS' | 'PRIVACY' | 'SECURITY';
}

export const LegalModalAir: React.FC<LegalModalAirProps> = ({
  isOpen,
  onClose,
  initialTab = 'TERMS',
}) => {
  const { dict, isRtl } = useLang();
  const [activeTab, setActiveTab] = useState<'TERMS' | 'PRIVACY' | 'SECURITY'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-3xl border border-[var(--glass-brd)] bg-[var(--c-card-solid)] shadow-2xl flex flex-col overflow-hidden text-body"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--glass-brd)] glass-subcard">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-title">
                {dict.legal.modalTitle}
              </h3>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold" dir="ltr">
                YASLOGIST AIR · REGULATORY COMPLIANCE 2026
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-title hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--glass-brd)] px-6 gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('TERMS')}
            className={`py-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'TERMS'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300'
                : 'border-transparent text-muted hover:text-title'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{dict.legal.termsTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`py-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'PRIVACY'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300'
                : 'border-transparent text-muted hover:text-title'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{dict.legal.privacyTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3 font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'SECURITY'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300'
                : 'border-transparent text-muted hover:text-title'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{dict.legal.securityTitle}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-muted leading-relaxed">
          {/* Prominent Non-Carrier Digital Twin Disclaimer */}
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3 text-xs text-cyan-700 dark:text-cyan-200 font-mono">
            <AlertCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
            <p>{dict.legal.nonCarrierNotice}</p>
          </div>

          {activeTab === 'TERMS' && (
            <div className="space-y-4">
              <h4 className="font-bold text-title text-base">
                1. Operational Scope & Air Cargo Digital Twin
              </h4>
              <p>
                YASLOGIST AIR delivers software intelligence, mathematical modeling, and multi-modal logistics orchestration. Operations are conducted in alignment with IATA Cargo standards (TACT Rules, ONE Record) and the Egyptian Customs Authority (Law No. 207 of 2020 governing pre-arrival cargo information via the Nafeza ACID platform).
              </p>
              <h4 className="font-bold text-title text-base">
                2. Calculation Integrity
              </h4>
              <p>
                All volumetric calculations execute under the standard IATA 1:6000 divisor (1 CBM = 166.67 kg). Carbon calculations reflect verified GLEC frameworks and IATA RP 1678 coefficients (~502g CO2/t-km for freighter aviation).
              </p>
            </div>
          )}

          {activeTab === 'PRIVACY' && (
            <div className="space-y-4">
              <h4 className="font-bold text-title text-base">
                1. Local Persistence & Telemetry Safeguards
              </h4>
              <p>
                Client preferences (selected language and theme) are strictly preserved locally via standard browser localStorage keys (<code>yaslogist-air-theme</code>, <code>yaslogist-air-lang</code>). No persistent cross-site tracking cookies or third-party profiling scripts are injected.
              </p>
              <h4 className="font-bold text-title text-base">
                2. Simulated Cargo & AWB Verification
              </h4>
              <p>
                Air Waybill validation occurs on client-side checksum algorithms (IATA Mod-7 format) with zero outbound transmission of private internal records without authenticated authorization.
              </p>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              <h4 className="font-bold text-title text-base">
                1. Architectural Security Posture
              </h4>
              <p>
                Static asset delivery operates behind modern TLS encryption with strict Content Security Policies (CSP). Sensor telemetry simulators are sandboxed to ensure deterministic performance across all viewports.
              </p>
              <h4 className="font-bold text-title text-base">
                2. Vulnerability Disclosure
              </h4>
              <p>
                Inquiries regarding platform security, API connectivity, or operational integrations should be addressed directly to <code>contact@yaslogist.me</code>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--glass-brd)] glass-subcard flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
          >
            {dict.legal.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
