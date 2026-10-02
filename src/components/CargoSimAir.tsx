import React, { useState, useMemo } from 'react';
import { useLang } from '../lib/i18n';
import { calculateAirFreight, estimateAirFreightCost } from '../lib/air-math';
import { DEFAULT_CORRIDOR_ID, findCorridor } from '../lib/corridors';
import { ModelBadge } from './ModelBadge';
import { useDialog } from '../lib/a11y';
import {
  Calculator,
  Scale,
  Leaf,
  Ship,
  Plane,
  Info,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Download,
  X,
  Printer,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';

interface PresetCargo {
  nameEn: string;
  nameAr: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  corridorId: string;
  isPharma: boolean;
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
    isPharma: true,
  },
  {
    nameEn: 'Automotive Engine Parts (Dense)',
    nameAr: 'قطع غيار سيارات ومحركات (كثيفة)',
    lengthCm: 80,
    widthCm: 60,
    heightCm: 50,
    grossWeightKg: 120,
    corridorId: 'corridor-fra-cai',
    isPharma: false,
  },
  {
    nameEn: 'E-Commerce Textiles (Voluminous)',
    nameAr: 'منسوجات وتجارة إلكترونية (ضخمة)',
    lengthCm: 120,
    widthCm: 90,
    heightCm: 80,
    grossWeightKg: 40,
    corridorId: 'corridor-dxb-cai',
    isPharma: false,
  },
  {
    nameEn: 'Avionics & Microchips (Critical)',
    nameAr: 'رقائق إلكترونية وأجهزة طيران',
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    grossWeightKg: 18,
    corridorId: 'corridor-pvg-cai',
    isPharma: false,
  },
];

export const CargoSimAir: React.FC = () => {
  const { dict, isRtl } = useLang();

  // State inputs
  const [lengthCm, setLengthCm] = useState<number>(80);
  const [widthCm, setWidthCm] = useState<number>(60);
  const [heightCm, setHeightCm] = useState<number>(50);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(45);
  const [isPharmaColdChain, setIsPharmaColdChain] = useState<boolean>(true);
  const [urgencyMode, setUrgencyMode] = useState<'STANDARD' | 'PRIORITY'>('STANDARD');
  const [manifestModalOpen, setManifestModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const manifestDialogRef = useDialog<HTMLDivElement>(manifestModalOpen, () => setManifestModalOpen(false));

  /* The active corridor, or null once the distance is dragged off a scheduled lane */
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

  // Derived tariff & financial breakdown
  const cost = useMemo(() => {
    return estimateAirFreightCost(
      calc.chargeableWeightKg,
      corridor?.code ?? 'FRA-CAI',
      isPharmaColdChain,
      urgencyMode,
    );
  }, [calc.chargeableWeightKg, corridor?.code, isPharmaColdChain, urgencyMode]);

  const applyPreset = (preset: PresetCargo) => {
    setLengthCm(preset.lengthCm);
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setGrossWeightKg(preset.grossWeightKg);
    setCorridorId(preset.corridorId);
    setIsPharmaColdChain(preset.isPharma);
    setDistanceKm(findCorridor(preset.corridorId)?.distanceKm ?? distanceKm);
  };

  const handleDistanceChange = (km: number) => {
    setDistanceKm(km);
    setCorridorId(null);
  };

  const manifestSummary = () => `=== YASLOGIST AIR — CONSIGNMENT MANIFEST (SIMULATION DEMO) ===
Corridor: ${corridor?.code ?? 'Charter/Unscheduled'} (${distanceKm} km)
Dimensions: ${lengthCm} × ${widthCm} × ${heightCm} cm
Volume: ${calc.volumeCbm} CBM
Gross Weight: ${grossWeightKg} kg
Volumetric Weight (IATA 1:6000): ${calc.volumetricWeightKg} kg
Chargeable Weight: ${calc.chargeableWeightKg} kg (${calc.billingBasis})
Estimated Block Time: ${calc.airportBlockHours} Hours
Cold-Chain: ${isPharmaColdChain ? 'Active GDP Cold-Chain (+4°C)' : 'Controlled Ambient'}
Total Estimated Tariff: $${cost.totalEstimatedUsd} USD
Terminal: Cairo International Airport Cargo Village (CAI / HECA)
* Operational capability simulation under IATA TACT frameworks.`;

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifestSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadManifest = () => {
    const blob = new Blob([manifestSummary()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'yaslogist-air-simulation.txt';
    /* Firefox requires the anchor to be in the document, and revoking the
       object URL in the same task can cancel the download before the browser
       has read it — so both are deferred to the next task. */
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 0);
  };

  const isGrossBilled = calc.billingBasis === 'GROSS_WEIGHT';

  return (
    <section id="simulator" className="scroll-mt-24 relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
          {isRtl ? 'نماذج بضائع معيارية جاهزة للاختبار:' : 'Benchmark Consignment Presets:'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-medium glass-subcard hover:border-cyan-400 text-left rtl:text-right transition-all flex flex-col justify-between group"
            >
              <span className="font-semibold text-title group-hover:text-cyan-400 transition-colors">
                {isRtl ? preset.nameAr : preset.nameEn}
              </span>
              <span className="text-[10px] font-mono text-muted mt-1" dir="ltr">
                {preset.lengthCm}×{preset.widthCm}×{preset.heightCm} cm · {preset.grossWeightKg} kg
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Grid: Inputs & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 6 Columns: Interactive Physical & Sector Controls */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 space-y-6 shadow-xl">
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

          {/* Gross Weight Slider */}
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

          {/* Service Handling Options */}
          <div className="pt-4 border-t border-[var(--glass-brd)] space-y-3">
            <span className="block text-xs font-mono uppercase text-muted tracking-wider">
              {isRtl ? 'مواصفات المناولة والرعاية بالمطار:' : 'Handling & SLA Attributes:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsPharmaColdChain(!isPharmaColdChain)}
                className={`p-3 rounded-2xl border text-left rtl:text-right transition-all flex items-center justify-between text-xs font-mono ${
                  isPharmaColdChain
                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-300'
                    : 'glass-subcard text-muted hover:border-slate-500'
                }`}
              >
                <span>{isRtl ? 'حاوية تبريد دوائي نشطة (+4°م)' : 'Active Cool (+4°C RKN)'}</span>
                <span className={`w-4 h-4 rounded-full border grid place-items-center ${isPharmaColdChain ? 'border-teal-400 bg-teal-400 text-black' : 'border-slate-500'}`}>
                  {isPharmaColdChain && <Check className="w-3 h-3" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUrgencyMode(urgencyMode === 'STANDARD' ? 'PRIORITY' : 'STANDARD')}
                className={`p-3 rounded-2xl border text-left rtl:text-right transition-all flex items-center justify-between text-xs font-mono ${
                  urgencyMode === 'PRIORITY'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                    : 'glass-subcard text-muted hover:border-slate-500'
                }`}
              >
                <span>{isRtl ? 'أولوية إقلاع فوري (First Flight)' : 'Priority First-Flight'}</span>
                <span className={`w-4 h-4 rounded-full border grid place-items-center ${urgencyMode === 'PRIORITY' ? 'border-sky-400 bg-sky-400 text-black' : 'border-slate-500'}`}>
                  {urgencyMode === 'PRIORITY' && <Check className="w-3 h-3" />}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Billable Metrics & Cost Breakdown */}
        <div className="lg:col-span-6 space-y-5">
          {/* Primary Chargeable Weight Hero Card */}
          <div
            className={`glass-panel rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden ${
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
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
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
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl glass-subcard mb-4 font-mono text-xs">
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
            <div className="text-xs leading-relaxed text-body glass-subcard p-3.5 rounded-2xl flex items-start gap-2.5">
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

          {/* Interactive Tariff & Surcharges Cost Engine */}
          <div className="glass-panel rounded-3xl p-5 shadow-xl border border-sky-400/25">
            <div className="flex items-center justify-between border-b border-[var(--glass-brd)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-title font-mono">
                  {isRtl ? 'حاسبة التكلفة الجوية ورسوم المناولة التقديرية' : 'Estimated Aviation Freight & Surcharge Breakdown'}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                INDICATIVE TARIFF
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'سعر الشحن الأساسي للوزن المحتسب:' : 'Base Freight (Rate/Kg):'}</span>
                <span className="text-title font-semibold" dir="ltr">
                  {calc.chargeableWeightKg} kg × ${cost.baseRatePerKg} = ${cost.baseFreightTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'رسم الوقود الجوي (FSC @ $0.85/kg):' : 'Aviation Fuel Surcharge (FSC):'}</span>
                <span className="text-title" dir="ltr">${cost.fuelSurchargeTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'رسم التأمين الأمني (SSC @ $0.15/kg):' : 'ICAO Security Screening (SSC):'}</span>
                <span className="text-title" dir="ltr">${cost.securitySurchargeTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'رسوم تفريغ ومناولة قرية البضائع (CAI THC):' : 'Cairo Cargo Village Handling (THC):'}</span>
                <span className="text-title" dir="ltr">${cost.terminalHandlingFixed.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'مطابقة نافذة الجمركية المسبقة (ACID):' : 'Nafeza ACI Electronic Matching:'}</span>
                <span className="text-emerald-400 font-semibold" dir="ltr">${cost.nafezaPreValidationFee.toFixed(2)}</span>
              </div>

              {/* Total Estimated Cost Banner */}
              <div className="pt-3 border-t border-[var(--glass-brd)] flex items-baseline justify-between">
                <div>
                  <span className="block text-[10px] font-mono text-muted uppercase">
                    {isRtl ? 'إجمالي التكلفة المقدرة للشحن والمناولة' : 'Total Estimated Consignment Cost'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {isRtl ? 'شاملة قرية بضائع القاهرة' : 'Incl. CAI Cargo Village Pre-Clear'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300" dir="ltr">
                    ${cost.totalEstimatedUsd.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">USD</span>
                </div>
              </div>
            </div>

            {/* Actions: Export Technical Manifest */}
            <div className="mt-4 pt-3 border-t border-[var(--glass-brd)] flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted leading-tight font-sans">
                {isRtl
                  ? 'نموذج محاكاة تجريبي مبني على معايير IATA وأسعار السوق المصرية'
                  : 'Benchmark rates modeled on IATA TACT & Cairo operational standards (Simulation Demo).'}
              </span>

              <button
                type="button"
                onClick={() => setManifestModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md shadow-cyan-400/20 active:scale-95 shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isRtl ? 'استخراج بيان الشحنة الفني' : 'Export Manifest'}</span>
              </button>
            </div>
          </div>

          {/* Speed vs Sustainability Trade-Off Card */}
          <div className="glass-panel rounded-3xl p-5 shadow-lg">
            <h4 className="text-xs font-mono uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mb-3 flex items-center gap-1.5 font-bold">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <span>{dict.simulator.tradeoffTitle}</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Air Column */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
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

              {/* Ocean Column */}
              <div className="p-3.5 rounded-2xl glass-subcard">
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
                      ? 'اختر أحد الممرات المجدولة لعرض المقارنة البحرية.'
                      : 'Select a scheduled corridor to compare.'}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {dict.simulator.tradeoffDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Export Consignment Specification Modal */}
      {manifestModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setManifestModalOpen(false)}>
          <div ref={manifestDialogRef} role="dialog" aria-modal="true" aria-labelledby="manifest-title" tabIndex={-1} onClick={(event) => event.stopPropagation()} className="printable-manifest-card max-h-[90vh] overflow-y-auto bg-[#070d18] border border-cyan-500/30 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative font-mono text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 id="manifest-title" className="font-bold text-sm text-white">
                    {isRtl ? 'بيان مواصفات وتكاليف الشحن الجوي الرسمي' : 'OFFICIAL AIR CONSIGNMENT SPECIFICATION'}
                  </h3>
                  <span className="text-[10px] text-cyan-400/80">
                    CAIRO CARGO VILLAGE (CAI / HECA) · IATA TACT COMPLIANT
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManifestModalOpen(false)}
                className="no-print p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" aria-hidden="true" />
                <span className="sr-only">Close manifest</span>
              </button>
            </div>

            {/* Official Watermark Badge for Demo Simulation */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>
                {isRtl
                  ? 'بيان مواصفات تجريبي لمحاكاة قدرات منظومة ياسلوجست للشحن الجوي التشغيلية.'
                  : 'Demonstration consignment specification generated by YASLOGIST AIR simulation engine.'}
              </span>
            </div>

            {/* Manifest Content Sheet */}
            <div className="space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10 text-xs">
              <div className="grid grid-cols-2 gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="text-muted block text-[10px]">{isRtl ? 'الممر والمسار الجوي' : 'CORRIDOR & ROUTE'}</span>
                  <span className="font-bold text-cyan-300" dir="ltr">
                    {corridor?.code ?? (isRtl ? 'مسار حر' : 'FREEHAND')} · {distanceKm.toLocaleString()} KM
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">{isRtl ? 'بوابة ومحطة الوصول' : 'HANDLING GATEWAY'}</span>
                  <span className="font-bold text-title">{isRtl ? 'قرية بضائع القاهرة (صالة 3)' : 'CAI CARGO TERMINAL 3'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1">
                <div>
                  <span className="text-muted block text-[10px]">{isRtl ? 'الأبعاد' : 'DIMENSIONS'}</span>
                  <span className="font-semibold" dir="ltr">{lengthCm}×{widthCm}×{heightCm} cm</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">{isRtl ? 'الحجم الكلي' : 'TOTAL CBM'}</span>
                  <span className="font-semibold text-cyan-400" dir="ltr">{calc.volumeCbm} m³</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">{isRtl ? 'الوزن الخاضع للرسوم' : 'BILLABLE WEIGHT'}</span>
                  <span className="font-bold text-title" dir="ltr">{calc.chargeableWeightKg} KG</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-1.5">
                <div className="flex justify-between">
                  <span>{isRtl ? `نولون الشحن الأساسي (${calc.chargeableWeightKg} كجم @ $${cost.baseRatePerKg}):` : `Base Airfreight (${calc.chargeableWeightKg} kg @ $${cost.baseRatePerKg}):`}</span>
                  <span className="font-bold text-title" dir="ltr">${cost.baseFreightTotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{isRtl ? 'رسم الوقود الجوي (FSC @ $0.85/كجم):' : 'Fuel Surcharge (FSC @ $0.85/kg):'}</span>
                  <span dir="ltr">${cost.fuelSurchargeTotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{isRtl ? 'رسم التأمين الأمني (SSC @ $0.15/كجم):' : 'Security Surcharge (SSC @ $0.15/kg):'}</span>
                  <span dir="ltr">${cost.securitySurchargeTotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{isRtl ? 'رسوم تفريغ ومناولة مطار القاهرة (THC):' : 'Cairo Airport Ramp & High-Loader THC:'}</span>
                  <span dir="ltr">${cost.terminalHandlingFixed}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>{isRtl ? 'مطابقة التسجيل المسبق عبر نافذة (ACID):' : 'Nafeza ACID Pre-Clearance Validation:'}</span>
                  <span dir="ltr">${cost.nafezaPreValidationFee}</span>
                </div>
                <div className="pt-2 border-t border-cyan-500/30 flex justify-between font-bold text-sm text-cyan-300">
                  <span>{isRtl ? 'إجمالي الرسوم التقديرية (بالدولار الأمريكي):' : 'TOTAL ESTIMATED CHARGES (USD):'}</span>
                  <span dir="ltr">${cost.totalEstimatedUsd}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed font-sans pt-1">
                {isRtl
                  ? 'تم احتساب هذا البيان وفق نموذج المحاكاة الهندسي لمنظومة YASLOGIST AIR لمطابقة معايير الاتحاد الدولي للنقل الجوي وقوانين الجمارك المصرية.'
                  : 'Computed under YASLOGIST AIR operational simulation engines adhering to IATA TACT rules and Egyptian Customs Nafeza framework.'}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="no-print mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyManifest}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-white/20 hover:bg-white/10 text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                <span>{copied ? (isRtl ? 'تم النسخ للحافظة!' : 'Copied to Clipboard!') : (isRtl ? 'نسخ البيان' : 'Copy Text')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadManifest}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-white/20 hover:bg-white/10 text-white transition-all"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{isRtl ? 'تنزيل TXT' : 'Download TXT'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md shadow-cyan-400/20"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'طباعة بيان الشحنة' : 'Print Manifest'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CargoSimAir;
