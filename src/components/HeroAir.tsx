import React from 'react';
import { useLang } from '../lib/i18n';
import { ModelBadge } from './ModelBadge';
import {
  Plane,
  Radio,
  Calculator,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Gauge,
  ThermometerSnowflake,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const HeroAir: React.FC = () => {
  const { dict, isRtl } = useLang();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="relative min-h-screen pt-24 pb-16 flex flex-col justify-between overflow-hidden">
      {/* 1. Real Aviation Aircraft Photographic Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/hero-air.jpg"
          alt=""
          aria-hidden="true"
          width={1920}
          height={1434}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center opacity-30 dark:opacity-20 scale-105 transition-transform duration-1000"
        />
        {/* Layered Stratosphere Gradient Veil to ensure 100% typography contrast in both themes */}
        <div className="absolute inset-0 bg-[var(--hero-veil)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(155,176,188,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(155,176,188,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      {/* Decorative Horizon Line */}
      <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent pointer-events-none z-[1]" />

      {/* Hero Content Body */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center my-auto">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-500 font-semibold shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping-pulse" />
            <span>{dict.hero.badge}</span>
          </div>
          <ModelBadge />
        </div>

        {/* Main Dramatic Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl h1-hero">
          <span className="text-title">{dict.hero.titlePrimary}</span>
          <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 drop-shadow-[0_0_30px_rgba(56,189,248,0.25)]">
            {' '}{dict.hero.titleAccent}
          </span>
        </h1>

        {/* Subtitle explaining the Cairo Cargo Village breakthrough */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-muted max-w-3xl leading-relaxed">
          {dict.hero.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <a
            href="#simulator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calculator className="w-5 h-5 text-slate-950" />
            <span>{dict.hero.ctaSim}</span>
            <ArrowIcon className="w-4 h-4 text-slate-950" />
          </a>

          <a
            href="#radar"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-title glass-subcard hover:border-cyan-400/50 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Radio className="w-5 h-5 text-cyan-500" />
            <span>{dict.hero.ctaRadar}</span>
          </a>
        </div>
      </div>

      {/* Floating Horizontal Live Telemetry Bar */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-left rtl:text-right divide-y sm:divide-y-0 sm:divide-x divide-[var(--glass-brd)] rtl:divide-x-reverse">
            {/* Sector 1: Flight ID */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="block text-[10px] font-mono uppercase text-muted tracking-wider">
                {dict.hero.telemetryBar.flight}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Plane className="w-4 h-4 text-cyan-500 shrink-0" />
                <span className="font-mono font-bold text-sm text-title">MS-552 CARGO</span>
              </div>
              <span className="block text-[10px] font-mono text-cyan-500 mt-0.5">B777-200F OPERATOR</span>
            </div>

            {/* Sector 2: Route */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="block text-[10px] font-mono uppercase text-muted tracking-wider">
                {dict.hero.telemetryBar.route}
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-sm text-title">
                <span dir="ltr" className="telemetry-unit">FRA ➔ CAI</span>
              </div>
              <span className="block text-[10px] font-mono text-muted mt-0.5">
                <span dir="ltr">2,910 KM</span>
              </span>
            </div>

            {/* Sector 3: Altitude */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="block text-[10px] font-mono uppercase text-muted tracking-wider">
                {dict.hero.telemetryBar.altitude}
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-sm text-title">
                <Gauge className="w-4 h-4 text-sky-500 shrink-0" />
                <span dir="ltr" className="telemetry-unit">FL380 · 38,000 FT</span>
              </div>
              <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">AIRWAY L612 ACTIVE</span>
            </div>

            {/* Sector 4: Ground Speed */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="block text-[10px] font-mono uppercase text-muted tracking-wider">
                {dict.hero.telemetryBar.speed}
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-sm text-title">
                <span dir="ltr" className="telemetry-unit">485 KTS</span>
              </div>
              <span className="block text-[10px] font-mono text-muted mt-0.5">
                <span dir="ltr">898 KM/H</span>
              </span>
            </div>

            {/* Sector 5: Pharma Sensor */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="block text-[10px] font-mono uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                {dict.hero.telemetryBar.temp}
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-sm text-teal-600 dark:text-teal-300">
                <ThermometerSnowflake className="w-4 h-4 text-teal-500 shrink-0" />
                <span dir="ltr" className="telemetry-unit">+4.2°C</span>
              </div>
              <span className="block text-[10px] font-mono text-teal-600 dark:text-teal-400 mt-0.5">RKN ULD · STABLE</span>
            </div>

            {/* Sector 6: CAI Touchdown & Dispatch Status */}
            <div className="pt-2 sm:pt-0 sm:px-3">
              <span className="block text-[10px] font-mono uppercase text-muted tracking-wider">
                {dict.hero.telemetryBar.eta}
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-sm text-title">
                <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                <span dir="ltr" className="telemetry-unit">14:45 UTC</span>
              </div>
              <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>{dict.hero.telemetryBar.statusValue}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Down Indicator */}
        <div className="flex justify-center mt-6">
          <a
            href="#radar"
            className="text-muted hover:text-cyan-500 transition-colors p-1 rounded-full animate-bounce"
            aria-label="Scroll to Radar"
          >
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};
