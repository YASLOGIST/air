import React, { useState, useEffect, useMemo } from 'react';
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
  FileCheck,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export interface RadarFlightVector {
  id: string;
  flightNumber: string;
  aircraft: string;
  operator: string;
  originIata: string;
  destIata: string;
  originCityEn: string;
  originCityAr: string;
  altitudeFt: number;
  speedKts: number;
  headingDeg: number;
  verticalSpeedFpm: number;
  distanceNm: number;
  waypoint: string;
  assignedRunway: string;
  commodityEn: string;
  commodityAr: string;
  uldType: string;
  tempCelsius: number;
  tempBand: string;
  isTempControlled: boolean;
  awbNumber: string;
  acidNumber: string;
  tempHistory: number[];
  radarCoords: { x: number; y: number }; // Percentage on radar circle
}

const RADAR_FLIGHTS: RadarFlightVector[] = [
  {
    id: 'ms-552',
    flightNumber: 'MS-552',
    aircraft: 'B777F',
    operator: 'EGYPTAIR CARGO',
    originIata: 'FRA',
    destIata: 'CAI',
    originCityEn: 'Frankfurt Main',
    originCityAr: 'فرانكفورت',
    altitudeFt: 38000,
    speedKts: 485,
    headingDeg: 138,
    verticalSpeedFpm: -1200,
    distanceNm: 38.5,
    waypoint: 'CVO VOR / ILS 05L',
    assignedRunway: '05L',
    commodityEn: 'Critical Biologics & Vaccines',
    commodityAr: 'أدوية بيولوجية ولقاحات حساسة',
    uldType: 'RKN Envirotainer',
    tempCelsius: 4.2,
    tempBand: '+2.0°C to +8.0°C',
    isTempControlled: true,
    awbNumber: '077-94821031',
    acidNumber: '2026000994108770001',
    tempHistory: [4.1, 4.2, 4.1, 4.3, 4.2, 4.2, 4.1, 4.2],
    radarCoords: { x: 38, y: 32 },
  },
  {
    id: 'ek-927',
    flightNumber: 'EK-927',
    aircraft: 'B777-200F',
    operator: 'EMIRATES SKYCARGO',
    originIata: 'DXB',
    destIata: 'CAI',
    originCityEn: 'Dubai Int’l',
    originCityAr: 'دبي',
    altitudeFt: 35000,
    speedKts: 508,
    headingDeg: 285,
    verticalSpeedFpm: -950,
    distanceNm: 52.0,
    waypoint: 'MENA VOR / RNAV',
    assignedRunway: '05C',
    commodityEn: 'Cross-Border E-Commerce & Spares',
    commodityAr: 'طرود تجارة إلكترونية وقطع غيار',
    uldType: 'AKE (LD3)',
    tempCelsius: 19.5,
    tempBand: 'Controlled Ambient (+15 to +25°C)',
    isTempControlled: false,
    awbNumber: '176-33910244',
    acidNumber: '2026000994108770002',
    tempHistory: [19.2, 19.4, 19.5, 19.6, 19.5, 19.5, 19.4, 19.5],
    radarCoords: { x: 72, y: 48 },
  },
  {
    id: 'kl-553',
    flightNumber: 'KL-553',
    aircraft: 'B747-400F',
    operator: 'KLM CARGO',
    originIata: 'AMS',
    destIata: 'CAI',
    originCityEn: 'Amsterdam Schiphol',
    originCityAr: 'أمستردام',
    altitudeFt: 36000,
    speedKts: 492,
    headingDeg: 145,
    verticalSpeedFpm: -1350,
    distanceNm: 44.0,
    waypoint: 'BLT VOR (Baltim Inbound)',
    assignedRunway: '23R',
    commodityEn: 'High-Value Cut Flowers & Perishables',
    commodityAr: 'زهور مقطوفة وسلع سريعة التلف',
    uldType: 'PMC Heavy Pallet',
    tempCelsius: 5.8,
    tempBand: 'Cool-Chain (+4.0 to +8.0°C)',
    isTempControlled: true,
    awbNumber: '074-11028863',
    acidNumber: '2026000994108770003',
    tempHistory: [5.9, 5.8, 6.0, 5.8, 5.7, 5.8, 5.9, 5.8],
    radarCoords: { x: 28, y: 55 },
  },
  {
    id: 'ms-958',
    flightNumber: 'MS-958',
    aircraft: 'A330-200F',
    operator: 'EGYPTAIR CARGO',
    originIata: 'PVG',
    destIata: 'CAI',
    originCityEn: 'Shanghai Pudong',
    originCityAr: 'شنغهاي',
    altitudeFt: 39000,
    speedKts: 476,
    headingDeg: 260,
    verticalSpeedFpm: -800,
    distanceNm: 68.0,
    waypoint: 'SINAI EAST / ACC Cairo',
    assignedRunway: '05L',
    commodityEn: 'Semiconductors & Critical Avionics',
    commodityAr: 'أشباه موصلات ومكونات إلكترونية فائقة الدقة',
    uldType: 'AKE (LD3) Anti-Static',
    tempCelsius: 21.0,
    tempBand: 'Static & Climate Shield (+20 to +24°C)',
    isTempControlled: false,
    awbNumber: '999-77421008',
    acidNumber: '2026000994108770004',
    tempHistory: [20.9, 21.0, 21.1, 21.0, 21.0, 21.2, 21.0, 21.0],
    radarCoords: { x: 65, y: 22 },
  },
];

export const FlightRadarHUD: React.FC = () => {
  const { dict, isRtl } = useLang();
  const [selectedFlightId, setSelectedFlightId] = useState<string>('ms-552');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);

  const activeFlight = useMemo(() => {
    return RADAR_FLIGHTS.find((f) => f.id === selectedFlightId) ?? RADAR_FLIGHTS[0];
  }, [selectedFlightId]);

  // Live jitter states based on active flight
  const [currentSpeed, setCurrentSpeed] = useState<number>(activeFlight.speedKts);
  const [currentAltitude, setCurrentAltitude] = useState<number>(activeFlight.altitudeFt);
  const [currentTemp, setCurrentTemp] = useState<number>(activeFlight.tempCelsius);
  const [currentDist, setCurrentDist] = useState<number>(activeFlight.distanceNm);

  // Sync state whenever selected flight changes
  useEffect(() => {
    setCurrentSpeed(activeFlight.speedKts);
    setCurrentAltitude(activeFlight.altitudeFt);
    setCurrentTemp(activeFlight.tempCelsius);
    setCurrentDist(activeFlight.distanceNm);
  }, [activeFlight]);

  // Subtle live jitter simulation for realistic avionics telemetry
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setCurrentSpeed(() => +(activeFlight.speedKts + (Math.random() * 3 - 1.5)).toFixed(0));
      setCurrentTemp(() => +(activeFlight.tempCelsius + (Math.random() * 0.08 - 0.04)).toFixed(1));
      setCurrentDist((prev) => (prev > 6 ? +(prev - 0.15).toFixed(1) : activeFlight.distanceNm));
      setCurrentAltitude((prev) => (prev > 2800 ? prev - 20 : activeFlight.altitudeFt));
    }, 2400);

    return () => clearInterval(interval);
  }, [isLiveActive, activeFlight]);


  return (
    <section id="radar" className="scroll-mt-24 relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header with ModelBadge */}
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

        {/* Live Feed Toggle & Control */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsLiveActive(!isLiveActive)}
            aria-pressed={isLiveActive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              isLiveActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                : 'glass-subcard text-muted'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveActive ? 'bg-emerald-400 animate-ping-pulse' : 'bg-slate-500'
              }`}
              aria-hidden="true"
            />
            <span>{isLiveActive ? dict.radar.livePing : isRtl ? 'البث متوقف' : 'FEED PAUSED'}</span>
            <RefreshCw
              className={`w-3 h-3 ${isLiveActive ? 'animate-spin' : ''}`}
              style={{ animationDuration: '6s' }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Interactive Active Flight Vector Selector Ribbon */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>{isRtl ? 'اختر رحلة الشحن للتتبع الراداري الحي:' : 'Select Active Freighter Vector:'}</span>
          </span>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold" dir="ltr">
            4 VECTORS INBOUND CAI
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {RADAR_FLIGHTS.map((flight) => {
            const isSelected = flight.id === selectedFlightId;
            return (
              <button
                key={flight.id}
                type="button"
                onClick={() => setSelectedFlightId(flight.id)}
                className={`p-3 rounded-2xl border text-left rtl:text-right transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-500/20 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : 'glass-subcard hover:border-cyan-500/40 text-muted'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`font-mono text-xs font-extrabold ${isSelected ? 'text-cyan-300' : 'text-title'}`}>
                    {flight.flightNumber}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 border border-white/10 text-cyan-400" dir="ltr">
                    {flight.aircraft}
                  </span>
                </div>

                <div className="font-mono text-xs font-semibold text-title mb-1.5" dir="ltr">
                  {flight.originIata} ➔ {flight.destIata}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                  <span className="truncate max-w-[120px]">
                    {isRtl ? flight.originCityAr : flight.originCityEn}
                  </span>
                  <span className={flight.isTempControlled ? 'text-teal-400 font-bold' : 'text-slate-400'}>
                    {flight.isTempControlled ? `${flight.tempCelsius}°C` : 'AMBIENT'}
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-sky-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main HUD Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Radar Scope (Cockpit Avionics Dark Screen) */}
        <div className="lg:col-span-7 avionics-well rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]">
          {/* Ambient Scope Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Radar Center and Circular Distance Rings */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-cyan-500/30 flex items-center justify-center shadow-[inset_0_0_60px_rgba(6,182,212,0.15)]">
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

            {/* Active Waypoint Marker */}
            <div className="absolute top-20 right-28 flex flex-col items-center">
              <div className="w-2.5 h-2.5 rotate-45 border border-sky-400 bg-sky-950/60" />
              <span className="text-[9px] font-mono text-sky-400/90 mt-0.5 bg-black/60 px-1 rounded">
                {activeFlight.waypoint.split('/')[0]}
              </span>
            </div>

            {/* Dynamic Active Flight Vector */}
            <div
              className="absolute flex flex-col items-center transition-all duration-700 z-20 cursor-pointer"
              style={{
                top: `${activeFlight.radarCoords.y}%`,
                left: `${activeFlight.radarCoords.x}%`,
              }}
            >
              {/* Directional Airplane Icon */}
              <div className="relative">
                <Plane
                  className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_12px_#38bdf8] transition-transform duration-500"
                  style={{ transform: `rotate(${activeFlight.headingDeg - 90}deg)` }}
                />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>

              {/* In-Flight HUD Tag */}
              <div
                className="mt-1 bg-slate-950/95 border border-cyan-400/60 px-2.5 py-1 rounded-lg shadow-2xl backdrop-blur-md text-[10px] font-mono leading-tight text-white whitespace-nowrap"
                dir="ltr"
              >
                <div className="flex items-center gap-1 font-bold text-cyan-300">
                  <span>{activeFlight.flightNumber}</span>
                  <span className="text-[8px] px-1 bg-cyan-500/25 text-cyan-200 rounded">
                    {activeFlight.aircraft}
                  </span>
                </div>
                <div className="text-slate-300 text-[9px] flex gap-1.5">
                  <span>FL{Math.round(currentAltitude / 100)}</span>
                  <span>·</span>
                  <span>{currentSpeed} KTS</span>
                </div>
                <div className="text-emerald-400 text-[9px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>
                    +{currentTemp}°C {activeFlight.isTempControlled ? 'STABLE' : 'AMBIENT'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Bottom Status Strip */}
          <div className="w-full mt-4 pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span dir="ltr">
                BRG {activeFlight.headingDeg}° · DIST {currentDist} NM TO CAI
              </span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{activeFlight.waypoint}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry Parameters & Cold-Chain Graph */}
        <div className="lg:col-span-5 space-y-4">
          {/* Flight Telemetry Box */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-500" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
                  {activeFlight.operator}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 font-semibold" dir="ltr">
                RWY {activeFlight.assignedRunway} CAI
              </span>
            </div>

            {/* Grid of 4 Core Readings */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-2xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.hero.telemetryBar.altitude}
                </span>
                <span className="text-xl font-bold font-mono text-title tabular block mt-0.5" dir="ltr">
                  {currentAltitude.toLocaleString()} <span className="text-xs text-cyan-500 font-normal">FT</span>
                </span>
                <span className="block text-[10px] text-cyan-500 font-mono mt-0.5">
                  FL{Math.round(currentAltitude / 100)} · DESCENT
                </span>
              </div>

              <div className="p-3 rounded-2xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.hero.telemetryBar.speed}
                </span>
                <span className="text-xl font-bold font-mono text-title tabular block mt-0.5" dir="ltr">
                  {currentSpeed} <span className="text-xs text-cyan-500 font-normal">KTS</span>
                </span>
                <span className="block text-[10px] text-muted font-mono mt-0.5">
                  GS {Math.round(currentSpeed * 1.852)} KM/H
                </span>
              </div>

              <div className="p-3 rounded-2xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.radar.heading}
                </span>
                <span className="text-lg font-bold font-mono text-title tabular block mt-0.5" dir="ltr">
                  {activeFlight.headingDeg}° <span className="text-xs text-muted font-normal">MAG</span>
                </span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  ILS {activeFlight.assignedRunway} CAPTURE
                </span>
              </div>

              <div className="p-3 rounded-2xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.radar.verticalSpeed}
                </span>
                <span className="text-lg font-bold font-mono text-title tabular block mt-0.5" dir="ltr">
                  <span className="flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4 text-cyan-500" />
                    {activeFlight.verticalSpeedFpm} <span className="text-xs text-muted font-normal">FPM</span>
                  </span>
                </span>
                <span className="block text-[10px] text-muted font-mono mt-0.5">
                  STABILIZED
                </span>
              </div>
            </div>

            {/* Regulatory and AWB metadata */}
            <div className="space-y-2 pt-2 border-t border-[var(--glass-brd)] text-xs font-mono">
              <div className="flex justify-between items-center text-muted">
                <span>COMMODITY / CLASS:</span>
                <span className="text-title font-semibold truncate max-w-[210px]">
                  {isRtl ? activeFlight.commodityAr : activeFlight.commodityEn}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>{dict.radar.awbNumber.split(':')[0]}:</span>
                <span className="text-cyan-500 font-semibold glass-subcard px-2 py-0.5 rounded-lg" dir="ltr">
                  {activeFlight.awbNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>NAFEZA ACID PRE-AUTH:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1" dir="ltr">
                  <FileCheck className="w-3 h-3" />
                  {activeFlight.acidNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Active Cold-Chain Telemetry Card with Real-Time Sparkline Curve */}
          <div className="glass-panel rounded-3xl p-5 border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-[var(--glass-bg)] shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-teal-500" />
                <div>
                  <h3 className="font-bold text-sm text-title">
                    {dict.radar.pharmaCooling}
                  </h3>
                  <span className="text-[10px] font-mono text-muted block">
                    {activeFlight.uldType} · {activeFlight.tempBand}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                <ShieldCheck className="w-3 h-3" />
                {dict.radar.stable}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-teal-600 dark:text-teal-300 tabular" dir="ltr">
                  +{currentTemp}°C
                </span>
                <span className="text-xs text-muted font-mono" dir="ltr">
                  TARGET: +4.0°C (GDP VALIDATED)
                </span>
              </div>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-medium">
                EXCURSION: 0.0°C
              </span>
            </div>

            {/* Live Thermal History Sparkline Graph */}
            <div className="p-2.5 rounded-2xl bg-black/30 border border-teal-500/20 mb-3">
              <div className="flex items-center justify-between text-[9px] font-mono text-muted mb-1">
                <span>{isRtl ? 'سجل درجات الحرارة (آخر 6 ساعات)' : '6-HOUR FLIGHT TEMPERATURE TREND'}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>NO EXCURSIONS</span>
                </span>
              </div>
              <div className="h-10 w-full flex items-end gap-1.5 pt-1">
                {activeFlight.tempHistory.map((val, idx) => {
                  const barHeight = Math.min(100, Math.max(25, (val / 10) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-teal-500/40 to-cyan-400 transition-all duration-300 group-hover:from-teal-400 group-hover:to-cyan-300"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[8px] font-mono text-slate-400" dir="ltr">
                        {val}°
                      </span>
                    </div>
                  );
                })}
              </div>
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

export default FlightRadarHUD;
