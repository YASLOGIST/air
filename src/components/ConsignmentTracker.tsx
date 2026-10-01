import React, { useState } from 'react';
import {
  Search,
  Plane,
  ShieldCheck,
  Thermometer,
  Clock,
  CheckCircle2,
  FileCheck,
  PlaneTakeoff,
  Building2,
  Truck,
} from 'lucide-react';
import { useLang } from '../lib/i18n';
import { ModelBadge } from './ModelBadge';

export interface ConsignmentItem {
  awb: string;
  origin: string;
  destination: string;
  flightNo: string;
  status: string;
  statusColor: string;
  commodityEn: string;
  commodityAr: string;
  uldCode: string;
  grossKg: number;
  chargeableKg: number;
  classification: string;
  tempTargetC: number | null;
  acidNumber: string | null;
  eAwbStatus: string;
  dwellMinutes: number | null;
  flightLevel: string | null;
  eta: string;
  currentMilestoneIndex: number; // 0 to 4
}

const DEFAULT_SAMPLES: ConsignmentItem[] = [
  {
    awb: '077-88442115',
    origin: 'FRA',
    destination: 'CAI',
    flightNo: 'MS-552',
    status: 'ENROUTE · FL380',
    statusColor: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
    commodityEn: 'Insulin & Biologics (2–8°C)',
    commodityAr: 'إنسولين ومستحضرات بيولوجية (2–8°م)',
    uldCode: 'RKN Envirotainer',
    grossKg: 412.0,
    chargeableKg: 412.0,
    classification: 'Pharma / Time-Critical',
    tempTargetC: 4.2,
    acidNumber: '2026000994108770001',
    eAwbStatus: 'PRE-CLEARED',
    dwellMinutes: null,
    flightLevel: 'FL380',
    eta: 'Today 14:45 UTC',
    currentMilestoneIndex: 2,
  },
  {
    awb: '176-33910244',
    origin: 'DXB',
    destination: 'CAI',
    flightNo: 'EK-927',
    status: 'PRE-ALERT · SCHEDULED',
    statusColor: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
    commodityEn: 'Cross-Border E-Commerce Pouches',
    commodityAr: 'أكياس تجارة إلكترونية عابرة للحدود',
    uldCode: 'AKE (LD3)',
    grossKg: 186.0,
    chargeableKg: 352.0,
    classification: 'Volumetric / Express Parcel',
    tempTargetC: null,
    acidNumber: '2026000994108770002',
    eAwbStatus: 'LODGED',
    dwellMinutes: null,
    flightLevel: 'FL350',
    eta: 'Today 19:15 UTC',
    currentMilestoneIndex: 1,
  },
  {
    awb: '074-11028863',
    origin: 'AMS',
    destination: 'CAI',
    flightNo: 'KL-553',
    status: 'RAMP · TRANSFERRING',
    statusColor: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
    commodityEn: 'Cut Flowers & High-Value Perishables',
    commodityAr: 'زهور مقطوفة وسلع سريعة التلف',
    uldCode: 'PMC Pallet',
    grossKg: 640.0,
    chargeableKg: 672.0,
    classification: 'Perishables / Cool-Chain',
    tempTargetC: 6.0,
    acidNumber: '2026000994108770003',
    eAwbStatus: 'PRE-CLEARED',
    dwellMinutes: 42,
    flightLevel: 'FL360',
    eta: 'Arrived CAI Apron',
    currentMilestoneIndex: 3,
  },
  {
    awb: '999-77421008',
    origin: 'PVG',
    destination: 'CAI',
    flightNo: 'MS-958',
    status: 'GATE-OUT · COMPLETED',
    statusColor: 'text-teal-400 border-teal-400/40 bg-teal-400/10',
    commodityEn: 'Semiconductor Microelectronics',
    commodityAr: 'أشباه الموصلات والإلكترونيات الدقيقة',
    uldCode: 'AKE (LD3)',
    grossKg: 275.0,
    chargeableKg: 275.0,
    classification: 'High-Value Bonded Cargo',
    tempTargetC: 18.0,
    acidNumber: '2026000994108770004',
    eAwbStatus: 'RELEASED',
    dwellMinutes: 154,
    flightLevel: 'FL380',
    eta: 'Released to Land Transport',
    currentMilestoneIndex: 4,
  },
];

const MILESTONES = [
  {
    key: 'acid',
    titleEn: 'ACID Pre-Auth',
    titleAr: 'إشعار نافذة المسبق',
    subEn: 'Customs e-Approved',
    subAr: 'موافق إلكترونياً',
    icon: FileCheck,
  },
  {
    key: 'uplift',
    titleEn: 'Origin Uplift',
    titleAr: 'تحميل الطائرة والإقلاع',
    subEn: 'Airside Departed',
    subAr: 'غادرت المهبط',
    icon: PlaneTakeoff,
  },
  {
    key: 'enroute',
    titleEn: 'Airborne Telemetry',
    titleAr: 'التحليق وتتبع التبريد',
    subEn: 'FL380 Inbound CAI',
    subAr: 'المسار الجوي المباشر',
    icon: Plane,
  },
  {
    key: 'cai-ramp',
    titleEn: 'Cargo Village Ramp',
    titleAr: 'قرية البضائع بالقاهرة',
    subEn: 'CAI Terminal 3',
    subAr: 'ساحة التفريغ السريع',
    icon: Building2,
  },
  {
    key: 'gate-out',
    titleEn: 'Reefer Handshake',
    titleAr: 'التسليم لأسطول النقل',
    subEn: 'Gate-Out Highway',
    subAr: 'انطلاق الشاحنات',
    icon: Truck,
  },
];

export const ConsignmentTracker: React.FC = () => {
  const { dict, lang, isRtl } = useLang();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ConsignmentItem | null>(DEFAULT_SAMPLES[0]);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (searchAwb: string) => {
    const clean = searchAwb.trim().toLowerCase();
    if (!clean) {
      setResult(DEFAULT_SAMPLES[0]);
      setNotFound(false);
      return;
    }

    const found = DEFAULT_SAMPLES.find(
      (s) => s.awb.toLowerCase().includes(clean) || s.flightNo.toLowerCase().includes(clean)
    );

    if (found) {
      setResult(found);
      setNotFound(false);
    } else {
      if (/^\d{3}-\d{8}$/.test(clean) || clean.length >= 8) {
        setResult({
          awb: searchAwb.toUpperCase(),
          origin: 'FRA',
          destination: 'CAI',
          flightNo: 'MS-774',
          status: 'VERIFIED · PRE-LODGED',
          statusColor: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
          commodityEn: 'General Air Cargo & Spares',
          commodityAr: 'بضائع عامة وقطع غيار صناعية',
          uldCode: 'AKE (LD3)',
          grossKg: 310.0,
          chargeableKg: 310.0,
          classification: 'General Cargo Standard',
          tempTargetC: null,
          acidNumber: '2026000994108770005',
          eAwbStatus: 'LODGED',
          dwellMinutes: 12,
          flightLevel: 'FL370',
          eta: 'Scheduled 16:30 UTC',
          currentMilestoneIndex: 1,
        });
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    }
  };

  return (
    <section id="tracker" className="scroll-mt-24 mx-auto max-w-[1440px] px-4 py-16 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--glass-brd)] pb-6 mb-8">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="kicker text-sky-400">{dict.tracker.kicker}</p>
            <ModelBadge />
          </div>
          <h2 className="display text-[clamp(1.8rem,3.4vw,3rem)] font-bold text-title">
            {dict.tracker.title}
          </h2>
          <p className="mt-2 text-muted text-base leading-relaxed">
            {dict.tracker.subtitle}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query || '077-88442115');
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.tracker.placeholder}
          className="flex-1 rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] px-5 py-3.5 text-sm text-title placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm font-mono"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 hover:bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all active:scale-95 font-mono"
        >
          <Search className="h-4 w-4" />
          <span>{dict.tracker.search}</span>
        </button>
      </form>

      {/* Quick Sample Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-sky-400 uppercase">
          {dict.tracker.samples}
        </span>
        {DEFAULT_SAMPLES.map((s) => (
          <button
            key={s.awb}
            type="button"
            onClick={() => {
              setQuery(s.awb);
              handleSearch(s.awb);
            }}
            className={`mono rounded-xl border px-3 py-1 text-xs transition-all ${
              result?.awb === s.awb
                ? 'border-sky-400 bg-sky-400/15 text-sky-700 dark:text-sky-300 font-bold'
                : 'border-[var(--c-border)] text-muted hover:border-sky-400/50'
            }`}
          >
            {s.awb}
          </button>
        ))}
      </div>

      {notFound && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-300 max-w-2xl font-mono">
          {dict.tracker.notFound}
        </div>
      )}

      {/* Telemetry Result Well */}
      {result && (
        <article className="avionics-well mt-8 rounded-[32px] p-6 md:p-8" dir="ltr">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sky-400/15 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-sky-400" />
                <span className="mono text-xs tracking-widest text-sky-400 uppercase font-bold">
                  MASTER AIR WAYBILL · {result.awb}
                </span>
              </div>
              <p className="mono mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">
                {result.flightNo} · {result.origin} → {result.destination}
              </p>
            </div>
            <span className={`rounded-full border px-4 py-1.5 font-mono text-xs font-bold tracking-wider ${result.statusColor}`}>
              {result.status}
            </span>
          </div>

          {/* Visual Milestone Stepper (5 Stages) */}
          <div className="py-6 border-b border-sky-400/15">
            <span className="block text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-4 font-bold">
              CONSIGNMENT FLIGHT & CUSTOMS PIPELINE
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MILESTONES.map((m, idx) => {
                const Icon = m.icon;
                const isPassed = idx < result.currentMilestoneIndex;
                const isCurrent = idx === result.currentMilestoneIndex;

                return (
                  <div
                    key={m.key}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-black/30 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-6 h-6 rounded-full border grid place-items-center text-[10px] font-mono font-bold ${
                        isCurrent
                          ? 'border-cyan-400 bg-cyan-400 text-black animate-pulse'
                          : isPassed
                          ? 'border-emerald-400 bg-emerald-400 text-black'
                          : 'border-slate-600 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <Icon className={`w-4 h-4 ${isCurrent ? 'text-cyan-300' : isPassed ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white leading-tight font-sans">
                        {isRtl ? m.titleAr : m.titleEn}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                        {isRtl ? m.subAr : m.subEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed 8-cell Telemetry grid */}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Cell
              icon={<ShieldCheck className="h-4 w-4 text-sky-400" />}
              k={dict.tracker.commodity}
              v={lang === 'ar' ? result.commodityAr : result.commodityEn}
            />
            <Cell
              icon={<Plane className="h-4 w-4 text-sky-400" />}
              k={dict.tracker.uld}
              v={result.uldCode}
            />
            <Cell
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              k={dict.tracker.acid}
              v={result.acidNumber ?? '—'}
            />
            <Cell
              icon={<CheckCircle2 className="h-4 w-4 text-sky-400" />}
              k={dict.tracker.eawb}
              v={result.eAwbStatus}
            />
            <Cell
              icon={<Plane className="h-4 w-4 text-sky-400" />}
              k={dict.tracker.chargeable}
              v={`${result.chargeableKg.toFixed(1)} kg · ${result.classification}`}
            />
            <Cell
              icon={<Thermometer className="h-4 w-4 text-teal-400" />}
              k="ACTIVE TEMP LOG"
              v={result.tempTargetC !== null ? `+${result.tempTargetC}°C (STABLE)` : 'AMBIENT HOLD'}
            />
            <Cell
              icon={<Clock className="h-4 w-4 text-amber-400" />}
              k={dict.tracker.dwell}
              v={result.dwellMinutes != null ? `${result.dwellMinutes} MIN (ON SCHEDULE)` : 'IN TRANSIT'}
            />
            <Cell
              icon={<Clock className="h-4 w-4 text-sky-400" />}
              k={dict.tracker.eta}
              v={result.eta}
            />
          </dl>
        </article>
      )}
    </section>
  );
};

function Cell({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#070c14]/60 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <dt className="mono text-[10px] tracking-[0.15em] text-[#9bb0bc] uppercase font-semibold">
          {k}
        </dt>
      </div>
      <dd className="mono mt-2 text-sm text-slate-100 font-medium">{v}</dd>
    </div>
  );
}

export default ConsignmentTracker;
