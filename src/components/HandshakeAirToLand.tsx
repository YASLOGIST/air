import React from 'react';
import { useLang } from '../lib/i18n';
import { ModelBadge } from './ModelBadge';
import {
  Truck,
  PlaneLanding,
  ThermometerSnowflake,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Radio,
  Building2
} from 'lucide-react';
import { SUITE_URLS } from '../lib/suite';

export const HandshakeAirToLand: React.FC = () => {
  const { dict, isRtl } = useLang();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="handshake" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              {dict.handshake.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.handshake.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.handshake.subtitle}
          </p>
        </div>

        {/* Multimodal Pill */}
        <div className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl glass-subcard text-xs font-mono text-cyan-600 dark:text-cyan-300">
          <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span dir="ltr">CAI TARMAC ➔ NATIONAL ROAD NETWORK</span>
        </div>
      </div>

      {/* Main Wide Handshake Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-[var(--glass-bg)] to-[var(--glass-bg)] shadow-xl relative overflow-hidden">
        {/* Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left 8 Cols: Handshake Details & Status Nodes */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
                <PlaneLanding className="w-6 h-6" />
              </span>
              <ArrowIcon className="w-5 h-5 text-muted shrink-0" />
              <span className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Truck className="w-6 h-6" />
              </span>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-300 px-3 py-1 rounded-full glass-subcard">
                DISPATCH SYNCHRONIZED
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-title leading-tight">
                {dict.handshake.cardHeadline}
              </h3>
              <p className="mt-2 text-sm text-muted max-w-2xl font-sans leading-relaxed">
                {dict.handshake.ctaSubtext}
              </p>
            </div>

            {/* Live Operational Status Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl glass-subcard space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-500 font-semibold">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>e-AWB & NAFEZA</span>
                </div>
                <p className="text-muted text-[11px]">
                  {dict.handshake.statusAwb}
                </p>
              </div>

              <div className="p-3.5 rounded-xl glass-subcard space-y-1">
                <div className="flex items-center gap-1.5 text-teal-500 font-semibold">
                  <ThermometerSnowflake className="w-4 h-4 shrink-0" />
                  <span>COLD-CHAIN</span>
                </div>
                <p className="text-muted text-[11px]">
                  {dict.handshake.statusCold}
                </p>
              </div>

              <div className="p-3.5 rounded-xl glass-subcard space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>NEXT RECEPTOR</span>
                </div>
                <p className="text-muted text-[11px]">
                  {dict.handshake.statusNext}
                </p>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Prominent Call-to-Action to land.yaslogist.com */}
          <div className="lg:col-span-4 flex flex-col justify-center p-6 rounded-2xl glass-subcard border border-cyan-500/30 text-center space-y-4 shadow-lg">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-300 uppercase tracking-wider block font-semibold">
                {isRtl ? 'المنصة الشقيقة المتصلة' : 'Connected Sister Portal'}
              </span>
              <span className="text-lg font-black font-mono text-title block" dir="ltr">
                land.yaslogist.com
              </span>
            </div>

            <a
              href={SUITE_URLS.land}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_30px_rgba(56,189,248,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Truck className="w-4 h-4 text-slate-950" />
              <span>{dict.handshake.ctaLand}</span>
              <ExternalLink className="w-4 h-4 text-slate-950" />
            </a>

            <span className="text-[10px] font-mono text-muted block leading-tight">
              {isRtl
                ? 'مراقبة الشاحنات المبردة المجهزة بـ IoT ونظام التتبع اللحظي للوجهة النهائية.'
                : 'IoT-enabled refrigerated highway fleet with continuous dynamic GPS & thermal telemetry.'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
