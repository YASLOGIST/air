import React, { useState } from 'react';
import { Search, Plane, ShieldCheck, Thermometer, Clock, CheckCircle2 } from 'lucide-react';
import { useLang } from '../lib/i18n';

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
    acidNumber: 'ACID-39218471',
    eAwbStatus: 'PRE-CLEARED',
    dwellMinutes: null,
    flightLevel: 'FL380',
    eta: 'Today 14:45 UTC',
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
    acidNumber: 'ACID-40112883',
    eAwbStatus: 'LODGED',
    dwellMinutes: null,
    flightLevel: 'FL350',
    eta: 'Today 19:15 UTC',
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
    acidNumber: 'ACID-38820119',
    eAwbStatus: 'PRE-CLEARED',
    dwellMinutes: 42,
    flightLevel: 'FL360',
    eta: 'Arrived CAI Apron',
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
    acidNumber: 'ACID-37665102',
    eAwbStatus: 'RELEASED',
    dwellMinutes: 154,
    flightLevel: 'FL380',
    eta: 'Released to Land Transport',
  },
];

export const ConsignmentTracker: React.FC = () => {
  const { dict, lang } = useLang();
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
      // Create a deterministic dynamic lookup simulation for any custom AWB format
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
          acidNumber: 'ACID-99281034',
          eAwbStatus: 'LODGED',
          dwellMinutes: 12,
          flightLevel: 'FL370',
          eta: 'Scheduled 16:30 UTC',
        });
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    }
  };

  return (
    <section id="tracker" className="mx-auto max-w-[1440px] px-4 py-16 md:px-8">
      <div className="max-w-2xl">
        <p className="kicker text-sky-400">{dict.tracker.kicker}</p>
        <h2 className="display mt-3 text-[clamp(1.8rem,3.4vw,3rem)] font-bold text-title">
          {dict.tracker.title}
        </h2>
        <p className="mt-3 text-muted text-base leading-relaxed">
          {dict.tracker.subtitle}
        </p>
      </div>

      {/* Search Bar */}
      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query || '077-88442115');
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={dict.tracker.placeholder}
          placeholder={dict.tracker.placeholder}
          className="flex-1 rounded-full border border-[var(--c-border)] bg-[var(--c-card)] px-5 py-3.5 text-sm text-title placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <Search className="h-4 w-4" />
          <span>{dict.tracker.search}</span>
        </button>
      </form>

      {/* Quick Sample Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
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
            className={`mono rounded-full border px-3 py-1 text-xs transition-all ${
              result?.awb === s.awb
                ? 'border-sky-400 bg-sky-400/15 text-sky-300 font-bold'
                : 'border-[var(--c-border)] text-muted hover:border-sky-400/50'
            }`}
          >
            {s.awb}
          </button>
        ))}
      </div>

      {notFound && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 max-w-2xl">
          {dict.tracker.notFound}
        </div>
      )}

      {/* Telemetry Result Well */}
      {result && (
        <article className="avionics-well mt-8 rounded-[28px] p-6 md:p-8" dir="ltr">
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
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-4 py-1.5 font-mono text-xs font-bold tracking-wider ${result.statusColor}`}>
                {result.status}
              </span>
              <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-sky-300">
                SIMULATED FEED
              </span>
            </div>
          </div>

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
      {/* dt/dd must be direct children of this div: <dl> allows exactly one
          wrapper level. The icon row therefore lives inside the dt itself. */}
      <dt className="mono flex items-center gap-2 text-[10px] tracking-[0.15em] text-[#9bb0bc] uppercase font-semibold">
        {icon}
        <span>{k}</span>
      </dt>
      <dd className="mono mt-2 text-sm text-slate-100 font-medium">{v}</dd>
    </div>
  );
}

export default ConsignmentTracker;
