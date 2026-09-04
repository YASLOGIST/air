import React, { useState, useMemo } from 'react';
import { useLang } from '../lib/i18n';
import { calculateAirFreight } from '../lib/air-math';
import { DEFAULT_CORRIDOR_ID, findCorridor } from '../lib/corridors';
import { ModelBadge } from './ModelBadge';
import {
  Calculator,
  Scale,
  Leaf,
  Ship,
  Plane,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

/* Each preset names a corridor rather than repeating its distance. The corridor
   supplies both the flown distance and the sea lane it competes with, so the
   two can no longer drift apart the way duplicated literals did. */
interface PresetCargo {
  nameEn: string;
  nameAr: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  corridorId: string;
}

const PRESETS: PresetCargo[] = [
  {
    nameEn: 'Pharma Biologics (Cool Box)',
    nameAr: 'صندوق أدوية بيولوجية مبردة',
    lengthCm: 60,
    widthCm: 50,
    heightCm: 45,
    grossWeightKg: 35,
    corridorId: 'corridor-fra-cai',
  },
  {
    nameEn: 'Automotive Engine Parts (Dense)',
    nameAr: 'قطع غيار سيارات ومحركات (كثيفة)',
    lengthCm: 80,
    widthCm: 60,
    heightCm: 50,
    grossWeightKg: 120,
    corridorId: 'corridor-fra-cai',
  },
  {
    nameEn: 'E-Commerce Textiles (Voluminous)',
    nameAr: 'منسوجات وتجارة إلكترونية (ضخمة)',
    lengthCm: 120,
    widthCm: 90,
    heightCm: 80,
    grossWeightKg: 40,
    corridorId: 'corridor-dxb-cai',
  },
  {
    nameEn: 'Avionics & Microchips (Critical)',
    nameAr: 'رقائق إلكترونية وأجهزة طيران',
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    grossWeightKg: 18,
    corridorId: 'corridor-pvg-cai',
  },
];

export const CargoSimAir: React.FC = () => {
  const { dict, isRtl } = useLang();

  // State inputs
  const [lengthCm, setLengthCm] = useState<number>(80);
  const [widthCm, setWidthCm] = useState<number>(60);
  const [heightCm, setHeightCm] = useState<number>(50);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(45);

  /* The active corridor, or null once the distance is dragged off a scheduled
     lane. Sea comparison depends on a real routing, so freehand distances get
     no ocean figures rather than invented ones. */
  const [corridorId, setCorridorId] = useState<string | null>(DEFAULT_CORRIDOR_ID);
  const corridor = findCorridor(corridorId);
  const [distanceKm, setDistanceKm] = useState<number>(
    findCorridor(DEFAULT_CORRIDOR_ID)?.distanceKm ?? 2910,
  );

  // Derived calculations using IATA standard math engine
  const calc = useMemo(() => {
    return calculateAirFreight({
      lengthCm,
      widthCm,
      heightCm,
      grossWeightKg,
      distanceKm,
      seaLane: corridor?.seaLane ?? null,
    });
  }, [lengthCm, widthCm, heightCm, grossWeightKg, distanceKm, corridor]);

  const applyPreset = (preset: PresetCargo) => {
    setLengthCm(preset.lengthCm);
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setGrossWeightKg(preset.grossWeightKg);
    setCorridorId(preset.corridorId);
    setDistanceKm(findCorridor(preset.corridorId)?.distanceKm ?? distanceKm);
  };

  // Dragging the distance slider leaves the scheduled network.
  const handleDistanceChange = (km: number) => {
    setDistanceKm(km);
    setCorridorId(null);
  };

  const isGrossBilled = calc.billingBasis === 'GROSS_WEIGHT';

  return (
    <section id="simulator" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.simulator.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.simulator.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.simulator.subtitle}
          </p>
        </div>

        {/* IATA Rule Badge */}
        <div className="self-start md:self-auto glass-subcard px-3.5 py-2 rounded-xl text-xs font-mono text-cyan-600 dark:text-cyan-300 flex items-center gap-2 shadow-sm">
          <Info className="w-4 h-4 text-cyan-500 shrink-0" />
          <span dir="ltr">IATA TACT RULE 1:6000 (1 CBM = 166.67 KG)</span>
        </div>
      </div>

      {/* Cargo Presets Bar */}
      <div className="mb-8">
        <span className="block text-xs font-mono text-muted uppercase tracking-wider mb-2">
          {isRtl ? 'نماذج جاهزة للاختبار الفوري:' : 'Quick Benchmark Cargo Presets:'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-medium glass-subcard hover:border-cyan-400 text-left rtl:text-right transition-all flex flex-col justify-between"
            >
              <span className="font-semibold text-title">{isRtl ? preset.nameAr : preset.nameEn}</span>
              <span className="text-[10px] font-mono text-muted mt-1" dir="ltr">
                {preset.lengthCm}×{preset.widthCm}×{preset.heightCm} cm · {preset.grossWeightKg} kg
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Grid: Inputs & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 6 Columns: Interactive Controls */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-3">
            <h3 className="font-bold text-base text-title flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-500" />
              <span>{dict.simulator.dimensions}</span>
            </h3>
            <span className="text-xs font-mono text-cyan-500 font-bold" dir="ltr">
              {calc.volumeCbm} CBM (m³)
            </span>
          </div>

          {/* Length Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-title">{dict.simulator.length}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-300" dir="ltr">{lengthCm} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={lengthCm}
              onChange={(e) => setLengthCm(Number(e.target.value))}
              aria-label={dict.simulator.length}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
          </div>

          {/* Width Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-title">{dict.simulator.width}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-300" dir="ltr">{widthCm} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="240"
              step="5"
              value={widthCm}
              onChange={(e) => setWidthCm(Number(e.target.value))}
              aria-label={dict.simulator.width}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
          </div>

          {/* Height Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-title">{dict.simulator.height}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-300" dir="ltr">{heightCm} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              aria-label={dict.simulator.height}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
          </div>

          {/* Gross Scale Weight Slider */}
          <div className="pt-4 border-t border-[var(--glass-brd)] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-title flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                <span>{dict.simulator.grossWeight}</span>
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-300 text-sm tabular" dir="ltr">{grossWeightKg} kg</span>
            </div>
            <input
              type="range"
              min="1"
              max="1500"
              step="5"
              value={grossWeightKg}
              onChange={(e) => setGrossWeightKg(Number(e.target.value))}
              aria-label={dict.simulator.grossWeight}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
          </div>

          {/* Sector Distance */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-title flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-sky-500" />
                <span>{dict.simulator.distance}</span>
              </span>
              <span className="font-bold text-sky-600 dark:text-sky-300" dir="ltr">{distanceKm.toLocaleString()} km</span>
            </div>
            <input
              type="range"
              min="500"
              max="12000"
              step="100"
              value={distanceKm}
              onChange={(e) => handleDistanceChange(Number(e.target.value))}
              aria-label={dict.simulator.distance}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
            <span className="block text-[11px] font-mono text-muted pt-0.5">
              {corridor
                ? `${corridor.code} · ${isRtl ? 'ممر مجدول' : 'scheduled corridor'}`
                : isRtl
                  ? 'مسافة حرة — خارج الشبكة المجدولة'
                  : 'Freehand distance — outside the scheduled network'}
            </span>
          </div>
        </div>

        {/* Right 6 Columns: Calculation Results & Strategic Insights */}
        <div className="lg:col-span-6 space-y-5">
          {/* Primary Chargeable Weight Hero Card */}
          <div
            className={`glass-panel rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden ${
              isGrossBilled
                ? 'bg-gradient-to-br from-amber-500/10 via-[var(--glass-bg)] to-[var(--glass-bg)] border-amber-500/30'
                : 'bg-gradient-to-br from-cyan-500/10 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-muted tracking-wider font-semibold">
                {dict.simulator.chargeableWeight}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                  isGrossBilled
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                    : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                }`}
              >
                {isGrossBilled ? dict.simulator.basisGross : dict.simulator.basisVolumetric}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl sm:text-5xl font-black font-mono text-title tabular" dir="ltr">
                {calc.chargeableWeightKg.toLocaleString()}
              </span>
              <span className="text-lg font-mono text-cyan-600 dark:text-cyan-400 font-bold" dir="ltr">
                KG (BILLABLE)
              </span>
            </div>

            {/* Comparison Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl glass-subcard mb-4 font-mono text-xs">
              <div>
                <span className="block text-muted text-[11px]">{dict.simulator.actualWeight}</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-300 tabular block mt-0.5" dir="ltr">
                  {grossWeightKg} kg
                </span>
              </div>
              <div>
                <span className="block text-muted text-[11px]">{dict.simulator.volumetricWeight}</span>
                <span className="text-base font-bold text-cyan-600 dark:text-cyan-300 tabular block mt-0.5" dir="ltr">
                  {calc.volumetricWeightKg} kg
                </span>
              </div>
            </div>

            {/* Profile Classification Notice */}
            <div className="text-xs leading-relaxed text-body glass-subcard p-3.5 rounded-xl flex items-start gap-2.5">
              {isGrossBilled ? (
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-title block mb-0.5">
                  {isGrossBilled ? dict.simulator.denseTitle : dict.simulator.voluminousTitle}
                </span>
                <span className="text-muted">{isGrossBilled ? dict.simulator.denseDesc : dict.simulator.voluminousDesc}</span>
              </div>
            </div>
          </div>

          {/* Speed vs Sustainability Trade-Off Card */}
          <div className="glass-panel rounded-2xl p-5 shadow-lg">
            <h4 className="text-xs font-mono uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mb-3 flex items-center gap-1.5 font-bold">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <span>{dict.simulator.tradeoffTitle}</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Air Column — airport-to-airport block time, not door-to-door */}
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-300 mb-1 font-semibold">
                  <Plane className="w-3.5 h-3.5" />
                  <span>{dict.simulator.transitAir}</span>
                </div>
                <div className="text-xl font-bold font-mono text-title tabular" dir="ltr">
                  {calc.airportBlockHours} <span className="text-xs text-cyan-600 dark:text-cyan-300 font-normal">HRS</span>
                </div>
                <span className="block text-[11px] font-mono text-muted mt-1" dir="ltr">
                  {distanceKm.toLocaleString()} km · CO₂ {calc.estimatedCo2Tonnes} t
                </span>
              </div>

              {/* Ocean Column — present only when a real sea lane is in play */}
              <div className="p-3.5 rounded-xl glass-subcard">
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted mb-1 font-semibold">
                  <Ship className="w-3.5 h-3.5" />
                  <span>{dict.simulator.transitOcean}</span>
                </div>
                {calc.oceanComparison ? (
                  <>
                    <div className="text-xl font-bold font-mono text-title tabular" dir="ltr">
                      {calc.oceanComparison.portToPortDaysMin}–{calc.oceanComparison.portToPortDaysMax}{' '}
                      <span className="text-xs text-muted font-normal">DAYS</span>
                    </div>
                    <span className="block text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1" dir="ltr">
                      {calc.oceanComparison.seaDistanceKm.toLocaleString()} km · CO₂ {calc.oceanComparison.co2Tonnes} t
                    </span>
                    <span className="block text-[11px] font-mono text-muted mt-0.5">
                      {isRtl
                        ? `${calc.oceanComparison.originPortAr} ← ${calc.oceanComparison.destPortAr}`
                        : `${calc.oceanComparison.originPortEn} → ${calc.oceanComparison.destPortEn}`}
                    </span>
                  </>
                ) : (
                  <p className="text-[11px] text-muted leading-relaxed mt-1">
                    {isRtl
                      ? 'اختر أحد الممرات المجدولة لعرض المقارنة البحرية. زمن الإبحار يعتمد على مسار ملاحي حقيقي ولا يمكن اشتقاقه من مسافة الطيران.'
                      : 'Select a scheduled corridor to compare. Sailing time depends on a real sea routing and cannot be derived from flight distance.'}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {dict.simulator.tradeoffDesc}
            </p>

            {calc.oceanComparison?.[isRtl ? 'routingCaveatAr' : 'routingCaveatEn'] && (
              <p className="text-[11px] text-muted leading-relaxed mt-2 pt-2 border-t border-[var(--glass-brd)]">
                {calc.oceanComparison[isRtl ? 'routingCaveatAr' : 'routingCaveatEn']}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
