import React, { useState, useEffect, useMemo } from 'react';
import { useLang } from '../lib/i18n';
import { useInView } from '../lib/use-in-view';
import { RadarScope } from './RadarScope';
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
  BatteryMedium,
  Droplets,
  Gauge,
  Wifi,
  Wind,
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
  /* The simulated telemetry below re-renders this whole section once a second.
     Suspend it while the panel is scrolled away or the tab is backgrounded. */
  const [sectionRef, isSectionActive] = useInView<HTMLElement>();
  const [selectedFlightId, setSelectedFlightId] = useState<string>('ms-552');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);

  const activeFlight = useMemo(() => {
    return RADAR_FLIGHTS.find((f) => f.id === selectedFlightId) ?? RADAR_FLIGHTS[0];
  }, [selectedFlightId]);

  const thermalTrace = useMemo(() => {
    const values = [...activeFlight.tempHistory, activeFlight.tempCelsius];
    const min = Math.min(...values) - 0.3;
    const range = Math.max(0.8, Math.max(...values) - min + 0.3);
    return values.map((value, index) => `${(index / (values.length - 1)) * 100},${32 - ((value - min) / range) * 24}`).join(' ');
  }, [activeFlight]);

  // Live jitter states based on active flight
  const [currentSpeed, setCurrentSpeed] = useState<number>(activeFlight.speedKts);
  const [currentAltitude, setCurrentAltitude] = useState<number>(activeFlight.altitudeFt);
  const [currentTemp, setCurrentTemp] = useState<number>(activeFlight.tempCelsius);
  const [currentDist, setCurrentDist] = useState<number>(activeFlight.distanceNm);
  const [humidity, setHumidity] = useState(46.2);
  const [loggerBattery, setLoggerBattery] = useState(87);
  const [pressurePsi, setPressurePsi] = useState(8.1);
  const [shockG, setShockG] = useState(0.08);
  const [utcTime, setUtcTime] = useState(() => new Date());

  // UTC clock is presentational simulation context, not a claim of live ADS-B data.
  useEffect(() => {
    if (!isSectionActive) return;
    setUtcTime(new Date()); // Resume on an accurate value, never a stale one.
    const timer = window.setInterval(() => setUtcTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [isSectionActive]);

  // Sync state whenever selected flight changes
  useEffect(() => {
    setCurrentSpeed(activeFlight.speedKts);
    setCurrentAltitude(activeFlight.altitudeFt);
    setCurrentTemp(activeFlight.tempCelsius);
    setCurrentDist(activeFlight.distanceNm);
  }, [activeFlight]);

  // Subtle live jitter simulation for realistic avionics telemetry
  useEffect(() => {
    if (!isLiveActive || !isSectionActive) return;
    const interval = setInterval(() => {
      setCurrentSpeed(() => +(activeFlight.speedKts + (Math.random() * 3 - 1.5)).toFixed(0));
      setCurrentTemp(() => +(activeFlight.tempCelsius + (Math.random() * 0.08 - 0.04)).toFixed(1));
      setCurrentDist((prev) => (prev > 6 ? +(prev - 0.15).toFixed(1) : activeFlight.distanceNm));
      setCurrentAltitude((prev) => (prev > 2800 ? prev - 20 : activeFlight.altitudeFt));
      setHumidity((prev) => +(Math.max(42, Math.min(56, prev + (Math.random() - 0.5) * 0.35))).toFixed(1));
      setPressurePsi((prev) => +(Math.max(7.8, Math.min(8.4, prev + (Math.random() - 0.5) * 0.04))).toFixed(2));
      setShockG(+(0.04 + Math.random() * 0.09).toFixed(2));
      setLoggerBattery((prev) => Math.max(82, +(prev - 0.01).toFixed(2)));
    }, 2400);

    return () => clearInterval(interval);
  }, [isLiveActive, isSectionActive, activeFlight]);

  return (
    <section ref={sectionRef} id="radar" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header with ModelBadge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.radar.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-title h2-display">
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
                ? 'bg-emerald-500/10 text-[var(--c-ok)] border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                : 'glass-subcard text-muted'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveActive && isSectionActive ? 'bg-emerald-400 animate-ping-pulse' : isLiveActive ? 'bg-emerald-400' : 'bg-slate-500'
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
          <span className="text-[11px] font-mono text-[var(--c-accent)] font-semibold" dir="ltr">
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
                className={`p-3 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[var(--c-subcard)] border-[var(--c-accent)] shadow-sm'
                    : 'glass-subcard hover:border-[var(--c-accent)] text-muted'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-[var(--c-accent)]' : 'text-title'}`}>
                    {flight.flightNumber}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--c-subcard)] border border-[var(--c-border)] text-[var(--c-accent)]" dir="ltr">
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
                  <span className={flight.isTempControlled ? 'text-teal-400 font-semibold' : 'text-slate-400'}>
                    {flight.isTempControlled ? `${flight.tempCelsius}°C` : 'AMBIENT'}
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--c-accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main HUD Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: the radar. A dark instrument screen on a white page —
            the one place contrast is spent deliberately, because a plot has to
            be read at a glance. Sensor tiles sit underneath on the page
            surface instead of inside the screen, so the scope stays uncluttered. */}
        <div className="lg:col-span-7 space-y-4">
          <div className="avionics-well rounded-3xl p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hud-line)] pb-2.5">
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[var(--hud-ink-dim)]" dir="ltr">
                <Wifi className="h-3 w-3 text-[var(--hud-ok)]" aria-hidden="true" />
                SIM LINK
                <span className="opacity-60">·</span>
                {isRtl ? 'بث محاكاة' : 'SIMULATED FEED'}
              </span>
              <time
                dateTime={utcTime.toISOString()}
                className="font-mono text-[10px] tabular text-[var(--hud-accent)]"
                dir="ltr"
              >
                {utcTime.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })} UTC
              </time>
            </div>

            <RadarScope
              flights={RADAR_FLIGHTS}
              activeFlight={activeFlight}
              distanceNm={currentDist}
              active={isSectionActive && isLiveActive}
              isArabic={isRtl}
              onSelectFlight={setSelectedFlightId}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hud-line)] pt-2.5 font-mono text-[10px] text-[var(--hud-ink-dim)]">
              <span className="flex items-center gap-1.5" dir="ltr">
                <Compass className="h-3.5 w-3.5 text-[var(--hud-accent)]" aria-hidden="true" />
                {activeFlight.waypoint}
              </span>
              <span className="flex items-center gap-1.5" dir="ltr">
                <Radio
                  className={`h-3.5 w-3.5 ${isLiveActive ? 'text-[var(--hud-ok)]' : 'text-[var(--hud-ink-dim)]'}`}
                  aria-hidden="true"
                />
                {isLiveActive ? (isRtl ? 'بث حي' : 'LIVE FEED') : isRtl ? 'البث متوقف' : 'FEED PAUSED'}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: isRtl ? 'جودة الرابط' : 'LINK QUALITY', value: isLiveActive ? '98.7%' : 'HOLD', icon: Wifi },
              { label: isRtl ? 'فرق الضغط' : 'CABIN ΔP', value: `${pressurePsi} PSI`, icon: Gauge },
              {
                label: isRtl ? 'الرطوبة' : 'ULD HUMIDITY',
                value: `${activeFlight.isTempControlled ? humidity : +(humidity + 5.6).toFixed(1)}% RH`,
                icon: Droplets,
              },
              { label: isRtl ? 'بطارية المسجل' : 'LOGGER BATTERY', value: `${Math.floor(loggerBattery)}%`, icon: BatteryMedium },
            ].map(({ label, value, icon: SensorIcon }) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--c-border)] bg-[var(--c-subcard)] px-3 py-2.5"
                dir="ltr"
              >
                <dt className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-muted">
                  <SensorIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-semibold tabular text-title">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right Column: Telemetry Parameters & Cold-Chain Graph */}
        <div className="lg:col-span-5 space-y-4">
          {/* Flight Telemetry Box */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-cyan-500" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
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
                <span className="text-xl font-semibold font-mono text-title tabular block mt-0.5" dir="ltr">
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
                <span className="text-xl font-semibold font-mono text-title tabular block mt-0.5" dir="ltr">
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
                <span className="text-lg font-semibold font-mono text-title tabular block mt-0.5" dir="ltr">
                  {activeFlight.headingDeg}° <span className="text-xs text-muted font-normal">MAG</span>
                </span>
                <span className="block text-[10px] text-[var(--c-ok)] font-mono mt-0.5">
                  ILS {activeFlight.assignedRunway} CAPTURE
                </span>
              </div>

              <div className="p-3 rounded-2xl glass-subcard">
                <span className="block text-[10px] font-mono text-muted uppercase">
                  {dict.radar.verticalSpeed}
                </span>
                <span className="text-lg font-semibold font-mono text-title tabular block mt-0.5" dir="ltr">
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
                <span>ACID REFERENCE · DEMO:</span>
                <span className="text-[var(--c-ok)] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1" dir="ltr">
                  <FileCheck className="w-3 h-3" />
                  {activeFlight.acidNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Active Cold-Chain Telemetry Card with Real-Time Sparkline Curve */}
          <div className="glass-panel relative overflow-hidden rounded-3xl border border-[var(--c-border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-teal-500" />
                <div>
                  <h3 className="font-semibold text-sm text-title">
                    {dict.radar.pharmaCooling}
                  </h3>
                  <span className="text-[10px] font-mono text-muted block">
                    {activeFlight.uldType} · {activeFlight.tempBand}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-500/15 text-[var(--c-cold)] border border-teal-500/30">
                <ShieldCheck className="w-3 h-3" />
                {activeFlight.isTempControlled ? dict.radar.stable : 'AMBIENT'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold font-mono text-[var(--c-cold)] tabular" dir="ltr">
                  +{currentTemp}°C
                </span>
                <span className="text-xs text-muted font-mono" dir="ltr">
                  TARGET: {activeFlight.isTempControlled ? '+4.0°C (SIMULATED)' : 'CONTROLLED AMBIENT'}
                </span>
              </div>
              <span className="text-xs font-mono text-[var(--c-cold)] font-medium">
                EXCURSION: {activeFlight.isTempControlled ? '0.0°C' : 'N/A'}
              </span>
            </div>

            {/* Independent logger channels — simulated sensor bus */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4" dir="ltr">
              {[
                { label: 'REL HUMIDITY', value: `${humidity}%`, unit: 'RH', color: 'cyan', icon: Droplets },
                { label: 'SHOCK PEAK', value: shockG.toFixed(2), unit: 'g', color: shockG > 0.11 ? 'amber' : 'emerald', icon: Activity },
                { label: 'LOGGER', value: Math.floor(loggerBattery).toString(), unit: '%', color: loggerBattery < 25 ? 'amber' : 'emerald', icon: BatteryMedium },
                { label: 'AIRFLOW', value: '1.8', unit: 'm/s', color: 'sky', icon: Wind },
              ].map(({ label, value, unit, color, icon: SensorIcon }) => (
                <div key={label} className={`sensor-tile sensor-${color} relative overflow-hidden rounded-xl border p-2.5`}>
                  <div className="sensor-glow absolute inset-x-0 bottom-0 h-1/2 opacity-30" aria-hidden="true" />
                  <span className="relative flex items-center gap-1 font-mono text-[8px] tracking-wider text-slate-400">
                    <SensorIcon className="h-3 w-3" /> {label}
                  </span>
                  <span className="relative mt-1 flex items-baseline gap-1 font-mono">
                    <span className="text-base font-semibold text-title tabular">{value}</span>
                    <span className="text-[8px] font-semibold text-muted">{unit}</span>
                  </span>
                  <div className="relative mt-1.5 h-0.5 overflow-hidden rounded bg-[var(--c-border)]"><span className="sensor-level block h-full w-[78%] rounded" /></div>
                </div>
              ))}
            </div>

            {/* Live Thermal History Sparkline Graph */}
            <div className="mb-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-subcard)] p-3">
              <div className="flex items-center justify-between text-[9px] font-mono text-muted mb-1">
                <span>{isRtl ? 'سجل درجات الحرارة (آخر 6 ساعات)' : '6-HOUR FLIGHT TEMPERATURE TREND'}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{activeFlight.isTempControlled ? 'NO EXCURSIONS' : 'WITHIN BAND'}</span>
                </span>
              </div>
              <div className="sensor-chart-grid relative h-20 overflow-hidden rounded-lg border border-[var(--c-border)]">
                <div className="absolute inset-x-0 top-[22%] h-[55%] border-y border-dashed border-emerald-400/15 bg-emerald-400/[.035]" />
                <span className="absolute left-1 top-1 font-mono text-[7px] text-[var(--c-pharma)] opacity-60">8°C MAX</span>
                <span className="absolute bottom-1 left-1 font-mono text-[7px] text-[var(--c-pharma)] opacity-60">2°C MIN</span>
                <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label="Simulated temperature trace">
                  <defs>
                    <linearGradient id="thermalArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#22d3ee" stopOpacity=".34" />
                      <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
                    </linearGradient>
                    <filter id="thermalGlow"><feGaussianBlur stdDeviation=".7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  </defs>
                  <polygon points={`0,36 ${thermalTrace} 100,36`} fill="url(#thermalArea)" />
                  <polyline points={thermalTrace} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" filter="url(#thermalGlow)" className="sensor-trace text-[var(--c-pharma)]" />
                  <circle cx="100" cy="20" r="1.4" fill="currentColor" className="sensor-pulse-dot text-[var(--c-accent)]" />
                </svg>
                <div className="sensor-chart-scan sensor-chart-scan-bg absolute inset-y-0 w-12" aria-hidden="true" />
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
