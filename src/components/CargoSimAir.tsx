import React, { useState, useMemo } from 'react';
import { useLang } from '../lib/i18n';
import { calculateAirFreight } from '../lib/air-math';
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

interface PresetCargo {
  nameEn: string;
  nameAr: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  distanceKm: number;
}

const PRESETS: PresetCargo[] = [
  {
    nameEn: 'Pharma Biologics (Cool Box)',
    nameAr: 'صندوق أدوية بيولوجية مبردة',
    lengthCm: 60,
    widthCm: 50,
    heightCm: 45,
    grossWeightKg: 35,
    distanceKm: 2910,
  },
  {
    nameEn: 'Automotive Engine Parts (Dense)',
    nameAr: 'قطع غيار سيارات ومحركات (كثيفة)',
    lengthCm: 80,
    widthCm: 60,
    heightCm: 50,
    grossWeightKg: 120,
    distanceKm: 2910,
  },
  {
    nameEn: 'E-Commerce Textiles (Voluminous)',
    nameAr: 'منسوجات وتجارة إلكترونية (ضخمة)',
    lengthCm: 120,
    widthCm: 90,
    heightCm: 80,
    grossWeightKg: 40,
    distanceKm: 2420,
  },
  {
    nameEn: 'Avionics & Microchips (Critical)',
    nameAr: 'رقائق إلكترونية وأجهزة طيران',
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    grossWeightKg: 18,
    distanceKm: 8350,
  },
];

export const CargoSimAir: React.FC = () => {
  const { dict, isRtl } = useLang();

  // State inputs
  const [lengthCm, setLengthCm] = useState<number>(80);
  const [widthCm, setWidthCm] = useState<number>(60);
  const [heightCm, setHeightCm] = useState<number>(50);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(45);
  const [distanceKm, setDistanceKm] = useState<number>(2910);

  // Derived calculations using IATA standard math engine
  const calc = useMemo(() => {
    return calculateAirFreight({
      lengthCm,
      widthCm,
      heightCm,
      grossWeightKg,
      distanceKm,
    });
  }, [lengthCm, widthCm, heightCm, grossWeightKg, distanceKm]);

  const applyPreset = (preset: PresetCargo) => {
    setLengthCm(preset.lengthCm);
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setGrossWeightKg(preset.grossWeightKg);
    setDistanceKm(preset.distanceKm);
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
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
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
              {/* Air Column */}
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-300 mb-1 font-semibold">
                  <Plane className="w-3.5 h-3.5" />
                  <span>YASLOGIST AIR</span>
                </div>
                <div className="text-xl font-bold font-mono text-title tabular" dir="ltr">
                  {calc.flightTransitHours} <span className="text-xs text-cyan-600 dark:text-cyan-300 font-normal">HRS</span>
                </div>
                <span className="block text-[11px] font-mono text-muted mt-1" dir="ltr">
                  CO2: {calc.estimatedCo2Tonnes} Tonnes
                </span>
              </div>

              {/* Ocean Column */}
              <div className="p-3.5 rounded-xl glass-subcard">
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted mb-1 font-semibold">
                  <Ship className="w-3.5 h-3.5" />
                  <span>MARITIME FREIGHT</span>
                </div>
                <div className="text-xl font-bold font-mono text-title tabular" dir="ltr">
                  {calc.oceanTransitDays} <span className="text-xs text-muted font-normal">DAYS</span>
                </div>
                <span className="block text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1" dir="ltr">
                  CO2: {calc.oceanAlternativeCo2Tonnes} Tonnes
                </span>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {dict.simulator.tradeoffDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
