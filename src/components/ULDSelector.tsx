import React, { useState } from 'react';
import { useLang } from '../lib/i18n';
import type { ULDContainer } from '../types/air-freight';
import { ModelBadge } from './ModelBadge';
import {
  Box,
  ThermometerSnowflake,
  ShieldCheck,
  Plane,
  Check
} from 'lucide-react';

const ULD_FLEET: ULDContainer[] = [
  {
    id: 'uld-ake',
    code: 'AKE',
    categoryEn: 'Standard Lower Deck Half-Width (LD3)',
    categoryAr: 'حاوية نصف عرض للسطح السفلي (LD3)',
    nameEn: 'AKE / LD3 Standard Cargo Container',
    nameAr: 'حاوية AKE القياسية لبطن الطائرات',
    tareWeightKg: 68,
    maxGrossWeightKg: 1588,
    volumeCbm: 4.3,
    activeCooling: false,
    tempRangeEn: 'Ambient (+15°C to +25°C Passive)',
    tempRangeAr: 'شحن عادي غير مبرد',
    compatibleAircraft: ['Boeing 777-200F / 300ER', 'Boeing 787-9/10', 'Airbus A350-900', 'Airbus A330-200F'],
    recommendedCargoEn: 'Industrial spares, high-density e-commerce parcels, electronics, diplomatic mail.',
    recommendedCargoAr: 'قطع الغيار الصناعية، طرود التجارة الإلكترونية الكثيفة، الإلكترونيات، البريد الدبلوماسي.',
    descriptionEn: 'The universal workhorse of commercial widebody aviation. Engineered with contoured aluminum shell to fit the lower hold lobe perfectly.',
    descriptionAr: 'الحاوية القياسية الأكثر انتشاراً عالمياً، مشكلة هندسياً لتطابق انحناء عنبر الطائرة السفلي وتحقيق أقصى استغلال للمساحة.',
    dimensionsEn: '156 × 153 × 160 cm (Base: 156 × 119 cm)',
    dimensionsAr: '156 × 153 × 160 سم (القاعدة: 156 × 119 سم)',
  },
  {
    id: 'uld-pmc',
    code: 'PMC',
    categoryEn: 'Main & Lower Deck Universal Pallet',
    categoryAr: 'منصة شحن عامة للسطحين العلوي والسفلي',
    nameEn: 'PMC / P6P Heavy-Duty Aircraft Pallet',
    nameAr: 'منصة PMC المعدنية فائقة الحمولة مع شباك التثبيت',
    tareWeightKg: 120,
    maxGrossWeightKg: 6804,
    volumeCbm: 11.5,
    activeCooling: false,
    tempRangeEn: 'Ambient / Thermal Blanketing Allowed',
    tempRangeAr: 'شحن عادي / عزل حراري بالأغطية',
    compatibleAircraft: ['Boeing 777F Main Deck', 'Boeing 747-400F/8F', 'Airbus A330F Lower Deck', 'Boeing 787'],
    recommendedCargoEn: 'Heavy machinery, automotive powertrains, oilfield valves, oversized manufacturing equipment.',
    recommendedCargoAr: 'المعدات الثقيلة، محركات السيارات، صمامات حقول البترول، الماكينات الصناعية الضخمة.',
    descriptionEn: 'Extruded high-tensile aluminum sheet with perimeter seat-tracks and heavy-duty nylon tie-down restraint net for bulky loads.',
    descriptionAr: 'صفيحة ألمنيوم عالية المقاومة مزودة بحواف تثبيت قياسية وشباك نيلون قوية لإحكام ربط الحمولات الضخمة والشاذة.',
    dimensionsEn: '318 × 244 × 163–244 cm (125 × 96 in)',
    dimensionsAr: '318 × 244 × 163–244 سم (125 × 96 بوصة)',
  },
  {
    id: 'uld-rkn',
    code: 'RKN',
    categoryEn: 'Active Temperature-Controlled (Biopharma)',
    categoryAr: 'حاوية دوائية نشطة بالتحكم الإلكتروني',
    nameEn: 'RKN Active Envirotainer e1/t2',
    nameAr: 'حاوية RKN النشطة لحفظ الأمصال والأدوية',
    tareWeightKg: 650,
    maxGrossWeightKg: 1588,
    volumeCbm: 2.93,
    activeCooling: true,
    tempRangeEn: '+2°C to +8°C / +15°C to +25°C (±0.5°C)',
    tempRangeAr: '+2°م إلى +8°م أو +15°م إلى +25°م (بدقة ±0.5°م)',
    compatibleAircraft: ['Boeing 777F', 'Boeing 787', 'Airbus A350', 'Airbus A330'],
    recommendedCargoEn: 'Insulin, biological vaccines, blood plasma, oncology therapeutics, clinical trial kits.',
    recommendedCargoAr: 'الأنسولين، اللقاحات البيولوجية، بلازما الدم، علاجات الأورام، مستحضرات التجارب السريرية.',
    descriptionEn: 'Advanced electrical compressor cooling and electrical heating system. Eliminates dry ice sublimation hazards and ensures GDP audit compliance.',
    descriptionAr: 'مزودة بضاغط تبريد كهربائي وتدفئة آلية ذاتية، تمنع مخاطر غاز ثاني أكسيد الكربون الناتج عن الثلج الجاف وتضمن الامتثال لـ GDP.',
    dimensionsEn: '156 × 153 × 162 cm (Holds 1 Euro Pallet)',
    dimensionsAr: '156 × 153 × 162 سم (تستوعب منصة يورو واحدة)',
  },
  {
    id: 'uld-rap',
    code: 'RAP',
    categoryEn: 'High-Capacity Active Cold-Chain ULD',
    categoryAr: 'حاوية تبريد دوائي عملاقة عالية السعة',
    nameEn: 'RAP Active Envirotainer e2 Multi-Pallet',
    nameAr: 'حاوية RAP العملاقة للشحن الدوائي متعدد المنصات',
    tareWeightKg: 1200,
    maxGrossWeightKg: 6033,
    volumeCbm: 8.2,
    activeCooling: true,
    tempRangeEn: '0°C to +25°C Active Climate Management',
    tempRangeAr: '0°م إلى +25°م إدارة مناخية نشطة',
    compatibleAircraft: ['Boeing 777-200F/300ER', 'Boeing 747-8F', 'Airbus A350-900', 'Airbus A330'],
    recommendedCargoEn: 'Bulk pharmaceutical shipments, commercial vaccine batches, biopharma API raw materials.',
    recommendedCargoAr: 'الشحنات الدوائية السائبة، دفعات اللقاحات القومية، المواد الفعالة الحساسة (APIs).',
    descriptionEn: 'Among the largest active temperature-controlled ULDs in service. Accommodates up to 5 Euro-pallets or 4 US-pallets with redundant cooling.',
    descriptionAr: 'من أكبر الحاويات المبردة النشطة المستخدمة في الشحن الجوي، تستوعب حتى 5 منصات يورو أو 4 منصات أمريكية مع نظام تبريد احتياطي.',
    dimensionsEn: '318 × 224 × 162 cm (Holds 5 Euro Pallets)',
    dimensionsAr: '318 × 224 × 162 سم (تتسع لـ 5 منصات يورو)',
  },
];

export const ULDSelector: React.FC = () => {
  const { dict, isRtl } = useLang();
  const [selectedUld, setSelectedUld] = useState<ULDContainer>(ULD_FLEET[2]); // Default RKN
  const [filter, setFilter] = useState<'ALL' | 'PHARMA' | 'GENERAL'>('ALL');

  const filteredFleet = ULD_FLEET.filter((item) => {
    if (filter === 'PHARMA') return item.activeCooling;
    if (filter === 'GENERAL') return !item.activeCooling;
    return true;
  });

  return (
    <section id="uld" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass-subcard self-start md:self-auto text-xs font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30' : 'text-muted hover:text-title'
            }`}
          >
            {dict.uld.filterAll}
          </button>
          <button
            onClick={() => setFilter('PHARMA')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'PHARMA' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold border border-teal-500/30' : 'text-muted hover:text-title'
            }`}
          >
            {dict.uld.filterPharma}
          </button>
          <button
            onClick={() => setFilter('GENERAL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'GENERAL' ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/30' : 'text-muted hover:text-title'
            }`}
          >
            {dict.uld.filterGeneral}
          </button>
        </div>
      </div>

      {/* Grid: Unit Buttons & Selected Unit Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                className={`w-full text-left rtl:text-right p-4 rounded-2xl border cursor-pointer transition-all duration-200 glass-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)] ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/15 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500 shadow-md'
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
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
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
              <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center gap-2 text-xs font-mono text-teal-600 dark:text-teal-300">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span dir="ltr">{isRtl ? selectedUld.tempRangeAr : selectedUld.tempRangeEn}</span>
              </div>
            ) : (
              <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl glass-subcard text-xs font-mono text-muted">
                <span dir="ltr">{isRtl ? selectedUld.dimensionsAr : selectedUld.dimensionsEn}</span>
              </div>
            )}
          </div>

          {/* Key Engineering Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-3.5 rounded-xl glass-subcard">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.tare}
              </span>
              <span className="text-xl font-bold text-title tabular block mt-0.5" dir="ltr">
                {selectedUld.tareWeightKg.toLocaleString()} <span className="text-xs text-muted font-normal">KG</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl glass-subcard">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.maxWeight}
              </span>
              <span className="text-xl font-bold text-cyan-600 dark:text-cyan-300 tabular block mt-0.5" dir="ltr">
                {selectedUld.maxGrossWeightKg.toLocaleString()} <span className="text-xs text-muted font-normal">KG</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl glass-subcard col-span-2 sm:col-span-1">
              <span className="block text-[11px] text-muted uppercase">
                {dict.uld.volume}
              </span>
              <span className="text-xl font-bold text-title tabular block mt-0.5" dir="ltr">
                {selectedUld.volumeCbm} <span className="text-xs text-muted font-normal">CBM (m³)</span>
              </span>
            </div>
          </div>

          {/* Description Block */}
          <div className="p-4 rounded-xl glass-subcard">
            <p className="text-sm text-muted leading-relaxed font-sans">
              {isRtl ? selectedUld.descriptionAr : selectedUld.descriptionEn}
            </p>
          </div>

          {/* Recommendations & Compatible Aircraft */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Cargo Categories */}
            <div className="p-4 rounded-xl glass-subcard space-y-2">
              <span className="block font-bold text-title uppercase tracking-wider">
                {dict.uld.recommendedCargo}:
              </span>
              <p className="text-muted leading-relaxed font-sans text-xs">
                {isRtl ? selectedUld.recommendedCargoAr : selectedUld.recommendedCargoEn}
              </p>
            </div>

            {/* Compatible Aircraft */}
            <div className="p-4 rounded-xl glass-subcard space-y-2">
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
    </section>
  );
};
