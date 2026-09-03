import React, { useState } from 'react';
import { useLang } from '../lib/i18n';
import { ModelBadge } from './ModelBadge';
import {
  PlaneLanding,
  ThermometerSnowflake,
  FileCheck2,
  Truck,
  Clock,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface FlowStepData {
  id: string;
  stepNum: string;
  icon: React.ElementType;
  timeTarget: string;
  tempStatus: string;
  complianceDoc: string;
}

const FLOW_STEPS_META: FlowStepData[] = [
  {
    id: 'touchdown',
    stepNum: '01',
    icon: PlaneLanding,
    timeTarget: 'T+15 MIN',
    tempStatus: '+4.1°C STABLE',
    complianceDoc: 'IATA AHM 905 / Ramp Safety',
  },
  {
    id: 'tarmacCool',
    stepNum: '02',
    icon: ThermometerSnowflake,
    timeTarget: 'T+40 MIN',
    tempStatus: '+4.0°C TO +4.3°C',
    complianceDoc: 'WHO GDP / Pharma Cool-Corridor',
  },
  {
    id: 'preClearance',
    stepNum: '03',
    icon: FileCheck2,
    timeTarget: 'PRE-TOUCHDOWN',
    tempStatus: '+4.2°C STABLE',
    complianceDoc: 'Egypt Customs Law 207 / Nafeza ACID',
  },
  {
    id: 'gateOut',
    stepNum: '04',
    icon: Truck,
    timeTarget: '< 180 MIN TOTAL',
    tempStatus: '+4.2°C TRANSFERRED',
    complianceDoc: 'Air-to-Land Reefer SLA',
  },
];

export const CargoVillageFlow: React.FC = () => {
  const { dict, isRtl } = useLang();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2); // Default preClearance

  const currentMeta = FLOW_STEPS_META[activeStepIndex];

  const getStepContent = (index: number) => {
    switch (index) {
      case 0:
        return dict.cargoVillage.steps.touchdown;
      case 1:
        return dict.cargoVillage.steps.tarmacCool;
      case 2:
        return dict.cargoVillage.steps.preClearance;
      case 3:
        return dict.cargoVillage.steps.gateOut;
      default:
        return dict.cargoVillage.steps.touchdown;
    }
  };

  const activeContent = getStepContent(activeStepIndex);

  return (
    <section id="cargovillage" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[var(--glass-brd)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
              {dict.cargoVillage.sectionBadge}
            </span>
            <ModelBadge />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-title h2-display">
            {dict.cargoVillage.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted max-w-2xl">
            {dict.cargoVillage.subtitle}
          </p>
        </div>

        {/* Airport Gateway Badge */}
        <div className="self-start md:self-auto flex items-center gap-3">
          <div className="glass-subcard px-3.5 py-2 rounded-xl text-xs font-mono text-cyan-600 dark:text-cyan-300 flex items-center gap-2 shadow-sm">
            <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
            <span dir="ltr">CAI CARGO VILLAGE (HECA)</span>
          </div>
          <span className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {dict.cargoVillage.timeSavedBadge}
          </span>
        </div>
      </div>

      {/* 4-Step Interactive Sequence Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {FLOW_STEPS_META.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStepIndex === idx;
          const stepData = getStepContent(idx);

          return (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-4 rounded-2xl border text-left rtl:text-right transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-500/15 via-[var(--glass-bg)] to-[var(--glass-bg)] border-cyan-500 shadow-md'
                  : 'glass-panel hover:border-cyan-400/40'
              }`}
            >
              {/* Step indicator top row */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-cyan-500 text-slate-950' : 'glass-subcard text-muted'}`}>
                  STEP {step.stepNum}
                </span>
                <span className="text-[10px] font-mono text-muted" dir="ltr">
                  {step.timeTarget}
                </span>
              </div>

              {/* Title & Icon */}
              <div>
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-cyan-500' : 'text-muted'}`} />
                <span className="font-bold text-xs sm:text-sm text-title block leading-snug">
                  {stepData.subtitle}
                </span>
              </div>

              {/* Active Glow Bar */}
              {isSelected && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-sky-300" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Hero Panel */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left 7 Cols: Comprehensive Operational Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold">
                PHASE {currentMeta.stepNum} OF 04
              </span>
              <span className="text-muted">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                {currentMeta.complianceDoc}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-title">
              {activeContent.title}
            </h3>

            <p className="text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
              {activeContent.desc}
            </p>

            {/* Operational Metrics Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl glass-subcard flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-500 shrink-0" />
                <div>
                  <span className="block text-[10px] font-mono text-muted uppercase">
                    {isRtl ? 'المستهدف الزمني' : 'Target Window'}
                  </span>
                  <span className="font-mono font-bold text-sm text-title" dir="ltr">
                    {activeContent.metric}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl glass-subcard flex items-center gap-3">
                <ThermometerSnowflake className="w-5 h-5 text-teal-500 shrink-0" />
                <div>
                  <span className="block text-[10px] font-mono text-muted uppercase">
                    {isRtl ? 'حالة التبريد الدوائي' : 'Cold-Chain Telemetry'}
                  </span>
                  <span className="font-mono font-bold text-sm text-teal-600 dark:text-teal-300" dir="ltr">
                    {currentMeta.tempStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Cairo Airport Infrastructure Card with REAL PHOTOGRAPHY */}
          <div className="lg:col-span-5 rounded-2xl glass-subcard overflow-hidden shadow-lg border border-[var(--glass-brd)] flex flex-col">
            {/* Visual Photography of Cairo Cargo Village Gate & Logistics Hub */}
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src="/assets/cargo-village.jpg"
                alt="Cairo International Airport Cargo Village Logistics Gate"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-white font-mono text-[11px]">
                <span className="font-bold flex items-center gap-1.5 drop-shadow">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CAI CARGO GATE 4</span>
                </span>
                <span className="bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded backdrop-blur-md">
                  TARMAC CLEARANCE
                </span>
              </div>
            </div>

            {/* Telemetry and metadata block */}
            <div className="p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'المدرج والساحة:' : 'Runway Node:'}</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold" dir="ltr">CAI 05L/23R (East Apron)</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'نظام نافذة الجمركي:' : 'Nafeza ACI Match:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold" dir="ltr">AUTOMATED PRE-AUTH</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'تسليم الشاحنات:' : 'Reefer Truck Bay:'}</span>
                <span className="text-title font-bold" dir="ltr">Gate 4 Highway Access</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>{isRtl ? 'الربط البري المستهدف:' : 'Land Link Target:'}</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold" dir="ltr">land.yaslogist.me</span>
              </div>

              <div className="pt-2 border-t border-[var(--glass-brd)] text-[11px] text-muted leading-relaxed font-sans">
                {isRtl
                  ? 'يتم إرسال إشعار تحرك فوري لشاحنات النقل البري قبل 60 دقيقة من هبوط الطائرة لضمان الاصطفاف التام عند بوابة الإفراج.'
                  : 'Automated dispatch signals are transmitted to the refrigerated land fleet 60 minutes prior to touchdown, ensuring zero dock waiting time.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
