import React, { useState } from 'react';
import { useLang } from '../lib/i18n';
import type { ULDContainer } from '../types/air-freight';
import { ULD_FLEET } from '../lib/uld-fleet';
import { ModelBadge } from './ModelBadge';
import { ULDViewer3D } from './ULDViewer3D';
import {
  Box,
  ThermometerSnowflake,
  ShieldCheck,
  Plane,
  Check,
  Layers,
} from 'lucide-react';

export const ULDSelector: React.FC = () => {
  const { dict, isRtl } = useLang();
  const [selectedUld, setSelectedUld] = useState<ULDContainer>(ULD_FLEET[2]); // Default RKN
  const [filter, setFilter] = useState<'ALL' | 'PHARMA' | 'GENERAL'>('ALL');

  const filteredFleet = ULD_FLEET.filter((item) => {
    if (filter === 'PHARMA') return item.activeCooling;
    if (filter === 'GENERAL') return !item.activeCooling;
    return true;
  });

  const isBellyDeck = selectedUld.code === 'AKE' || selectedUld.code === 'RKN';

  return (
    <section id="uld" className="scroll-mt-24 relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.uld.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.uld.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.uld.subtitle}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-subcard self-start md:self-auto text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30' : 'text-muted hover:text-title'
            }`}
          >
            {dict.uld.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setFilter('PHARMA')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'PHARMA' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold border border-teal-500/30' : 'text-muted hover:text-title'
            }`}
          >
            {dict.uld.filterPharma}
          </button>
          <button
            type="button"
            onClick={() => setFilter('GENERAL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'GENERAL' ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/30' : 'text-muted hover:text-title'
            }`}
          >
            {dict.uld.filterGeneral}
          </button>
        </div>
      </div>

      {/* Grid: Unit Buttons & Selected Unit Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Cols: Fleet Cards Selector */}
        <div className="lg:col-span-4 space-y-3">
          {filteredFleet.map((uld) => {
            const isSelected = selectedUld.id === uld.id;
            return (
              <button
                key={uld.id}
                type="button"
                onClick={() => setSelectedUld(uld)}
                aria-pressed={isSelected}
                className={`w-full text-left rtl:text-right p-4 rounded-2xl border cursor-pointer transition-all duration-200 glass-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/15 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'glass-panel'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-title tracking-wider">
                        {uld.code}
                      </span>
                      {uld.activeCooling ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                          <ThermometerSnowflake className="w-3 h-3" />
                          {isRtl ? 'تبريد نشط' : 'Active Cold'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-muted glass-subcard">
                          <Box className="w-3 h-3" />
                          {isRtl ? 'شحن عادي' : 'Standard'}
                        </span>
                      )}
                    </div>
                    <span className="block text-xs text-muted mt-1 font-medium">
                      {isRtl ? uld.nameAr : uld.nameEn}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold" dir="ltr">
                    {uld.volumeCbm} CBM
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 8 Cols: Detailed Inspection Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive 3D Digital Twin Viewer */}
          <ULDViewer3D uld={selectedUld} />

          {/* Detailed Engineering Inspection Panel */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--glass-brd)] pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-title">
                  {selectedUld.code}
                </span>
                <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  [{isRtl ? selectedUld.categoryAr : selectedUld.categoryEn}]
                </span>
              </div>
              <p className="text-sm text-muted mt-1">
                {isRtl ? selectedUld.nameAr : selectedUld.nameEn}
              </p>
            </div>

            {selectedUld.activeCooling ? (
              <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span dir="ltr">{isRtl ? selectedUld.tempRangeAr : selectedUld.tempRangeEn}</span>
              </div>
            ) : (
              <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl glass-subcard text-xs font-mono text-muted">
                <span dir="ltr">{isRtl ? selectedUld.dimensionsAr : selectedUld.dimensionsEn}</span>
              </div>
            )}
          </div>

          {/* Aircraft Fuselage Deck Placement & Contour Fitting (NEW FEATURE) */}
          <div className="p-4 rounded-2xl glass-subcard border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-title flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>{isRtl ? 'موضع التحميل داخل هيكل الطائرة (Fuselage Deck Fitting):' : 'Aircraft Fuselage Deck Fitting:'}</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isBellyDeck ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {isBellyDeck ? 'LOWER BELLY HOLD' : 'MAIN DECK WIDEBODY'}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed font-sans">
              {isBellyDeck
                ? (isRtl
                    ? 'تصميم نصف عرض مائل الزاوية (Contoured Half-Width) يطابق بدقة انحناء بطن الطائرة السفلي لمنع أي فراغ ضائع وتأمين الاتزان الهوائي.'
                    : 'Engineered with contoured chamfered base to match the curvature of lower deck aircraft belly lobes, ensuring aerodynamic balance and maximum space utilization.')
                : (isRtl
                    ? 'منصة شحن قياسية عريضة مسطحة، مزودة بنقاط تثبيت ميكانيكية وشباك حماية للسطح الرئيسي لطائرات الشحن العملاقة (B777F / B747-400F).'
                    : 'Full-footprint heavy pallet secured via aircraft floor lock-pins and certified restraint nets, configured for main deck freighter holds.')}
            </p>
          </div>

          {/* Key Engineering Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-3.5 rounded-2xl glass-subcard">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.tare}
              </span>
              <span className="text-xl font-bold text-title tabular block mt-0.5" dir="ltr">
                {selectedUld.tareWeightKg.toLocaleString()} <span className="text-xs text-muted font-normal">KG</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl glass-subcard">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.maxWeight}
              </span>
              <span className="text-xl font-bold text-cyan-600 dark:text-cyan-300 tabular block mt-0.5" dir="ltr">
                {selectedUld.maxGrossWeightKg.toLocaleString()} <span className="text-xs text-muted font-normal">KG</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl glass-subcard">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.volume}
              </span>
              <span className="text-xl font-bold text-title tabular block mt-0.5" dir="ltr">
                {selectedUld.volumeCbm} <span className="text-xs text-muted font-normal">CBM (m³)</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl glass-subcard">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.netPayload}
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-300 tabular block mt-0.5" dir="ltr">
                {(selectedUld.maxGrossWeightKg - selectedUld.tareWeightKg).toLocaleString()} <span className="text-xs text-muted font-normal">KG</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl glass-subcard col-span-2">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.internalEnvelope}
              </span>
              <span className="text-xl font-bold text-title tabular block mt-0.5" dir="ltr">
                {selectedUld.internalCm.lengthCm} × {selectedUld.internalCm.widthCm} × {selectedUld.internalCm.heightCm} <span className="text-xs text-muted font-normal">CM (L×W×H)</span>
              </span>
            </div>
          </div>

          {/* Description Block */}
          <div className="p-4 rounded-2xl glass-subcard">
            <p className="text-sm text-muted leading-relaxed font-sans">
              {isRtl ? selectedUld.descriptionAr : selectedUld.descriptionEn}
            </p>
          </div>

          {/* Recommendations & Compatible Aircraft */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Cargo Categories */}
            <div className="p-4 rounded-2xl glass-subcard space-y-2">
              <span className="block font-bold text-title uppercase tracking-wider">
                {dict.uld.recommendedCargo}:
              </span>
              <p className="text-muted leading-relaxed font-sans text-xs">
                {isRtl ? selectedUld.recommendedCargoAr : selectedUld.recommendedCargoEn}
              </p>
            </div>

            {/* Compatible Aircraft */}
            <div className="p-4 rounded-2xl glass-subcard space-y-2">
              <span className="block font-bold text-title uppercase tracking-wider flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-cyan-500" />
                <span>{dict.uld.aircraftSuitability}:</span>
              </span>
              <ul className="space-y-1 text-muted">
                {selectedUld.compatibleAircraft.map((plane, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-cyan-500 shrink-0" />
                    <span>{plane}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default ULDSelector;
