import React, { useState } from 'react';
import { useLang } from '../lib/i18n';
import type { AirCorridor } from '../types/air-freight';
import { AIR_CORRIDORS } from '../lib/corridors';
import { ModelBadge } from './ModelBadge';
import { CorridorGlobe3D } from './CorridorGlobe3D';
import {
  PlaneTakeoff,
  Globe2,
  Calendar,
  Package,
  Sparkles
} from 'lucide-react';

export const CorridorsAir: React.FC = () => {
  const { dict, isRtl } = useLang();
  const [selectedCorridor, setSelectedCorridor] = useState<AirCorridor>(AIR_CORRIDORS[0]);

  return (
    <section id="corridors" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.corridors.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.corridors.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.corridors.subtitle}
          </p>
        </div>

        {/* Status indicator */}
        <div className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl glass-subcard text-xs font-mono text-muted">
          <Globe2 className="w-4 h-4 text-cyan-500" />
          <span dir="ltr">SCHEDULED AIRWAY NETWORK</span>
        </div>
      </div>

      {/* Corridors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 4 Cols: Interactive Route Cards */}
        <div className="lg:col-span-4 space-y-3">
          {AIR_CORRIDORS.map((corridor) => {
            const isSelected = selectedCorridor.id === corridor.id;

            return (
              <button
                key={corridor.id}
                type="button"
                onClick={() => setSelectedCorridor(corridor)}
                aria-pressed={isSelected}
                className={`w-full text-left rtl:text-right p-4 rounded-2xl border cursor-pointer transition-all duration-200 glass-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/15 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500 shadow-md'
                    : 'glass-panel'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PlaneTakeoff className={`w-4 h-4 ${isSelected ? 'text-cyan-500' : 'text-muted'}`} />
                    <span className="font-mono font-bold text-base text-title" dir="ltr">
                      {corridor.code}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-semibold" dir="ltr">
                    {corridor.weeklyFrequencies} {isRtl ? 'رحلة/أسبوعياً' : 'weekly'}
                  </span>
                </div>

                <div className="text-xs text-muted flex items-center justify-between font-mono">
                  <span>{isRtl ? corridor.fromCityAr : corridor.fromCityEn}</span>
                  <span className="text-cyan-500" dir="ltr">➔</span>
                  <span>{isRtl ? corridor.toCityAr : corridor.toCityEn}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-[var(--glass-brd)] flex items-center justify-between text-[11px] font-mono text-muted">
                  <span dir="ltr">{corridor.distanceKm.toLocaleString()} KM</span>
                  <span>{isRtl ? corridor.flightTimeAr : corridor.flightTimeEn}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 8 Cols: Live Network Globe + Detailed Route Intelligence */}
        <div className="lg:col-span-8 space-y-6">
          {/* WebGL great-circle globe: selecting a card ignites its arc and
              rotates the corridor midpoint to face the camera. */}
          <div className="glass-panel rounded-3xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-3 font-mono text-[10px] tracking-wider text-muted" dir="ltr">
              <span className="flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-cyan-500" />
                {isRtl ? 'شبكة الممرات فوق الكرة — دوائر عظمى فعلية' : 'GREAT-CIRCLE NETWORK STATE'}
              </span>
              <span className="text-cyan-500/70">WEBGL · 6 DRAWS</span>
            </div>
            <CorridorGlobe3D activeCorridorId={selectedCorridor.id} />
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--glass-brd)] pb-4 gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-title" dir="ltr">
                  {selectedCorridor.code}
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold" dir="ltr">
                  {selectedCorridor.fromIata} ➔ {selectedCorridor.toIata}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-1">
                {isRtl ? selectedCorridor.fromCityAr : selectedCorridor.fromCityEn} ➔ {isRtl ? selectedCorridor.toCityAr : selectedCorridor.toCityEn}
              </p>
            </div>

            <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl glass-subcard text-xs font-mono text-cyan-600 dark:text-cyan-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span dir="ltr">{selectedCorridor.weeklyFrequencies} {dict.corridors.weeklyFlights}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3.5 rounded-xl glass-subcard">
              <span className="block text-[10px] text-muted uppercase">
                {dict.corridors.distance}
              </span>
              <span className="text-lg font-bold text-title tabular block mt-0.5" dir="ltr">
                {selectedCorridor.distanceKm.toLocaleString()} <span className="text-xs text-muted font-normal">KM</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl glass-subcard">
              <span className="block text-[10px] text-muted uppercase">
                {dict.corridors.flightDuration}
              </span>
              <span className="text-sm font-bold text-cyan-600 dark:text-cyan-300 block mt-0.5">
                {isRtl ? selectedCorridor.flightTimeAr : selectedCorridor.flightTimeEn}
              </span>
            </div>

            <div className="p-3.5 rounded-xl glass-subcard col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-muted uppercase">
                {isRtl ? 'المشغل والتحالف' : 'Operating Fleet Alliance'}
              </span>
              <span className="text-xs font-bold text-title truncate block mt-0.5">
                {isRtl ? selectedCorridor.carrierAr : selectedCorridor.carrierEn}
              </span>
            </div>
          </div>

          {/* Strategic Significance */}
          <div className="p-4 rounded-xl glass-subcard space-y-1.5">
            <span className="block text-xs font-mono font-bold text-cyan-600 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>{dict.corridors.corridorRole}:</span>
            </span>
            <p className="text-sm text-muted leading-relaxed font-sans">
              {isRtl ? selectedCorridor.strategicSignificanceAr : selectedCorridor.strategicSignificanceEn}
            </p>
          </div>

          {/* Primary Flow Commodities */}
          <div className="p-4 rounded-xl glass-subcard space-y-1.5">
            <span className="block text-xs font-mono font-bold text-title uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-cyan-500" />
              <span>{dict.corridors.primaryCommodities}:</span>
            </span>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
              {isRtl ? selectedCorridor.primaryCargoAr : selectedCorridor.primaryCargoEn}
            </p>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
