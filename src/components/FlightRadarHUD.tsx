import React, { useState, useEffect } from 'react';
import { useLang } from '../lib/i18n';
import { ModelBadge } from './ModelBadge';
import {
  Plane,
  Radio,
  Thermometer,
  ShieldCheck,
  Compass,
  ArrowDownRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';

export const FlightRadarHUD: React.FC = () => {
  const { dict, isRtl } = useLang();

  // Simulated live telemetry state
  const [altitude, setAltitude] = useState<number>(38000);
  const [speed, setSpeed] = useState<number>(485);
  const [temp, setTemp] = useState<number>(4.2);
  const heading = 138;
  const [distanceNm, setDistanceNm] = useState<number>(42);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);

  // Subtle live jitter simulation
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setSpeed((prev) => +(prev + (Math.random() * 2 - 1)).toFixed(0));
      /* Temperature is re-sampled around its setpoint rather than walked
         from the previous value, so this setter takes no argument. */
      setTemp(() => +(4.2 + (Math.random() * 0.1 - 0.05)).toFixed(1));
      setDistanceNm((prev) => (prev > 5 ? +(prev - 0.2).toFixed(1) : 42));
      setAltitude((prev) => (prev > 3000 ? prev - 25 : 38000));
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  /* Coarse state derived from the sampled temperature. Announced instead of the
     raw value so the status region fires on a band breach, not on every tick. */
  const coldChainStable = temp >= 2 && temp <= 8;

  return (
    <section id="radar" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with ModelBadge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.radar.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.radar.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.radar.subtitle}
          </p>
        </div>

        {/* Live status pill */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsLiveActive(!isLiveActive)}
            aria-pressed={isLiveActive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] ${
              isLiveActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.12)]'
                : 'glass-subcard text-muted'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-emerald-400 animate-ping-pulse' : 'bg-slate-500'}`} aria-hidden="true" />
            <span>{dict.radar.livePing}</span>
            <RefreshCw className={`w-3 h-3 ${isLiveActive ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Screen-reader status.
          The readouts below re-sample every 2.5 s. Marking those as a live
          region would announce four numbers every few seconds and make the
          page unusable with a screen reader, so they stay silent and this
          region carries the coarse state instead — it changes only when the
          feed is toggled or the consignment leaves its temperature band. */}
      <p className="sr-only" role="status">
        {isLiveActive
          ? `${dict.radar.livePing}. ${dict.radar.pharmaCooling}: ${coldChainStable ? dict.radar.stable : dict.radar.excursion}.`
          : `${dict.radar.livePing} — ${isRtl ? 'متوقف' : 'paused'}.`}
      </p>

      {/* Main HUD Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Radar Scope (Avionics Dark Screen in BOTH themes) */}
        <div className="lg:col-span-7 avionics-well rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]">
          {/* Ambient Scope Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Radar Horizon Center and Circular Distance Rings */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-cyan-500/30 flex items-center justify-center shadow-[inset_0_0_60px_rgba(6,182,212,0.12)]">
            {/* Range Rings */}
            <div className="absolute w-3/4 h-3/4 rounded-full border border-dashed border-cyan-500/25" />
            <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/30" />
            <div className="absolute w-1/4 h-1/4 rounded-full border border-cyan-500/35" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 h-[1px] bg-cyan-500/25" />
            <div className="absolute inset-y-0 w-[1px] bg-cyan-500/25" />

            {/* Sweep Beam Line */}
            <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none">
              <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-br from-cyan-400/25 via-cyan-500/5 to-transparent [clip-path:polygon(0_0,100%_100%,0_100%)]" />
            </div>

            {/* Cardinal Markers */}
            <span className="absolute top-2 text-[10px] font-mono text-cyan-400/70">000° (N)</span>
            <span className="absolute right-2 text-[10px] font-mono text-cyan-400/70">090° (E)</span>
            <span className="absolute bottom-2 text-[10px] font-mono text-cyan-400/70">180° (S)</span>
            <span className="absolute left-2 text-[10px] font-mono text-cyan-400/70">270° (W)</span>

            {/* Destination Target Marker (CAI / 05L) */}
            <div className="absolute bottom-16 right-20 flex flex-col items-center group cursor-pointer z-10">
              <div className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-400 bg-emerald-950/80 flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 mt-1 font-bold tracking-tight bg-slate-950/90 px-1.5 py-0.5 rounded border border-emerald-500/30">
                CAI / 05L
              </span>
            </div>

            {/* Waypoint CVO VOR */}
            <div className="absolute top-24 right-28 flex flex-col items-center">
              <div className="w-2 h-2 rotate-45 border border-sky-400 bg-sky-950/60" />
              <span className="text-[9px] font-mono text-sky-400/80 mt-0.5">CVO VOR</span>
            </div>

            {/* Active Flight Vector (MS-552 Cargo Flight) */}
            <div
              className="absolute flex flex-col items-center transition-all duration-1000 z-20 cursor-pointer"
              style={{
                top: `${35 - (42 - distanceNm) * 0.4}%`,
                left: `${35 + (42 - distanceNm) * 0.5}%`,
              }}
            >
              {/* Flight Icon with Directional Heading */}
              <div className="relative">
                <Plane
                  className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_10px_#38bdf8] transition-transform duration-500"
                  style={{ transform: `rotate(${heading - 90}deg)` }}
                />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>

              {/* In-Flight Tag */}
              <div className="mt-1 bg-slate-950/95 border border-cyan-400/50 px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md text-[10px] font-mono leading-tight text-white whitespace-nowrap" dir="ltr">
                <div className="flex items-center gap-1 font-bold text-cyan-300">
                  <span>MS-552</span>
                  <span className="text-[8px] px-1 bg-cyan-500/20 text-cyan-300 rounded">B777F</span>
                </div>
                <div className="text-slate-300 text-[9px] flex gap-1.5">
                  <span>FL{Math.round(altitude / 100)}</span>
                  <span>·</span>
                  <span>{speed} KTS</span>
                </div>
                <div className="text-emerald-400 text-[9px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>+{temp}°C RKN STABLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Bottom Status Strip */}
          <div className="w-full mt-4 pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span dir="ltr">RADAR VECTOR: BRG 138° · DIST {distanceNm} NM</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{dict.radar.approachingWaypoint}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry Data & Cold-Chain HUD */}
        <div className="lg:col-span-5 space-y-4">
          {/* Flight Parameters Box */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-500" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                  {dict.radar.terminalLabel}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20 font-semibold">
                {dict.radar.runwayAssignment}
              </span>
            </div>

            <div
              className="grid grid-cols-2 gap-3 mb-4"
              role="group"
              aria-label={dict.brand.modelBadgeDesc}
            >
              <div className="p-3 rounded-xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.telemetry.altitude}
                </span>
                <span className="text-xl font-bold font-mono text-title tabular block mt-0.5">
                  <span dir="ltr" className="telemetry-unit">
                    {altitude.toLocaleString()} <span className="text-xs text-cyan-500 font-normal">FT</span>
                  </span>
                </span>
                <span className="block text-[10px] text-cyan-500 font-mono mt-0.5">
                  FL{Math.round(altitude / 100)} · CRUISE DESCENT
                </span>
              </div>

              <div className="p-3 rounded-xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.telemetry.speed}
                </span>
                <span className="text-xl font-bold font-mono text-title tabular block mt-0.5">
                  <span dir="ltr" className="telemetry-unit">
                    {speed} <span className="text-xs text-cyan-500 font-normal">KTS</span>
                  </span>
                </span>
                <span className="block text-[10px] text-muted font-mono mt-0.5">
                  GS {Math.round(speed * 1.852)} KM/H
                </span>
              </div>

              <div className="p-3 rounded-xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.radar.heading}
                </span>
                <span className="text-lg font-bold font-mono text-title tabular block mt-0.5">
                  <span dir="ltr" className="telemetry-unit">
                    {heading}° <span className="text-xs text-muted font-normal">MAG</span>
                  </span>
                </span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  RNAV 1 / ILS 05L INBOUND
                </span>
              </div>

              <div className="p-3 rounded-xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.radar.verticalSpeed}
                </span>
                <span className="text-lg font-bold font-mono text-title tabular block mt-0.5">
                  <span dir="ltr" className="telemetry-unit flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4 text-cyan-500" />
                    -1,200 <span className="text-xs text-muted font-normal">FPM</span>
                  </span>
                </span>
                <span className="block text-[10px] text-muted font-mono mt-0.5">
                  STABILIZED DESCENT
                </span>
              </div>
            </div>

            {/* Transponder & Regulatory Codes */}
            <div className="space-y-2 pt-2 border-t border-[var(--glass-brd)] text-xs font-mono">
              <div className="flex justify-between items-center text-muted">
                <span>OPERATOR / ROUTE:</span>
                <span className="text-title font-semibold" dir="ltr">MS-CARGO · FRA ➔ CAI</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>{dict.radar.awbNumber.split(':')[0]}:</span>
                <span className="text-cyan-500 font-semibold glass-subcard px-1.5 py-0.5 rounded" dir="ltr">
                  077-94821031
                </span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>NAFEZA ACID PRE-CLEAR:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1" dir="ltr">
                  <FileCheck className="w-3 h-3" />
                  2026000994108770001
                </span>
              </div>
            </div>
          </div>

          {/* Active Pharma Cold-Chain Sensor Card */}
          <div className="glass-panel rounded-2xl p-5 border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-[var(--glass-bg)] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-sm text-title tracking-wide">
                  {dict.radar.pharmaCooling}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                <ShieldCheck className="w-3 h-3" />
                {dict.radar.stable}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-teal-600 dark:text-teal-300 tabular" dir="ltr">
                  +{temp}°C
                </span>
                <span className="text-xs text-muted font-mono" dir="ltr">
                  SET: +4.0°C (GDP VALIDATED)
                </span>
              </div>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-medium">
                BATT: 98% · COMPRESSOR RUNNING
              </span>
            </div>

            {/* Sensor Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-teal-500/20 mb-3">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${((temp - 2) / 6) * 100}%` }}
              />
            </div>

            <p className="text-xs text-muted leading-relaxed font-sans">
              {dict.radar.tempLog}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
