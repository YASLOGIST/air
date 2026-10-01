import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import {
  FileCheck2,
  Gauge,
  Navigation,
  PackageCheck,
  Plane,
  RadioTower,
  Route,
  ShieldCheck,
  Snowflake,
  ThermometerSnowflake,
  Timer,
  Truck,
} from 'lucide-react';

const LERP = 0.18;
const SEEK_INTERVAL_MS = 28;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export const CinematicStage: React.FC = () => {
  const { dict } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const trackRef = useRef<HTMLDivElement>(null);
  const videoNightRef = useRef<HTMLVideoElement>(null);
  const videoDayRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lastAppliedTimeNightRef = useRef(-1);
  const lastAppliedTimeDayRef = useRef(-1);
  const lastSeekAtRef = useRef(0);
  const isSeekingNightRef = useRef(false);
  const isSeekingDayRef = useRef(false);

  // Sync scroll scrubbing for both day & night runway reels
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const rect = track.getBoundingClientRect();
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      targetRef.current = clamp01(-rect.top / total);
    };

    if (reduced) {
      targetRef.current = 0.5;
      currentRef.current = 0.5;
      setProgress(0.5);
      return;
    }

    let raf = 0;
    const tick = () => {
      const target = targetRef.current;
      let current = currentRef.current;
      current += (target - current) * LERP;
      if (Math.abs(target - current) < 0.00045) current = target;
      currentRef.current = current;
      setProgress(current);

      const now = performance.now();
      if (now - lastSeekAtRef.current >= SEEK_INTERVAL_MS) {
        lastSeekAtRef.current = now;

        // Apply scrub to Night Video
        const vNight = videoNightRef.current;
        if (vNight && vNight.readyState >= 2 && Number.isFinite(vNight.duration) && vNight.duration > 0) {
          const targetTime = current * Math.max(0, vNight.duration - 0.04);
          if (Math.abs(lastAppliedTimeNightRef.current - targetTime) > 0.015) {
            if (!isSeekingNightRef.current) {
              isSeekingNightRef.current = true;
              lastAppliedTimeNightRef.current = targetTime;
              try {
                vNight.currentTime = targetTime;
              } catch {
                isSeekingNightRef.current = false;
              }
            }
          }
        }

        // Apply scrub to Day Video
        const vDay = videoDayRef.current;
        if (vDay && vDay.readyState >= 2 && Number.isFinite(vDay.duration) && vDay.duration > 0) {
          const targetTime = current * Math.max(0, vDay.duration - 0.04);
          if (Math.abs(lastAppliedTimeDayRef.current - targetTime) > 0.015) {
            if (!isSeekingDayRef.current) {
              isSeekingDayRef.current = true;
              lastAppliedTimeDayRef.current = targetTime;
              try {
                vDay.currentTime = targetTime;
              } catch {
                isSeekingDayRef.current = false;
              }
            }
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Setup video event handlers for both videos
  useEffect(() => {
    const videos = [
      { vid: videoNightRef.current, seekingRef: isSeekingNightRef },
      { vid: videoDayRef.current, seekingRef: isSeekingDayRef },
    ];

    const cleanups: (() => void)[] = [];

    videos.forEach(({ vid, seekingRef }) => {
      if (!vid) return;

      vid.muted = true;
      vid.pause();

      const pauseOnLoad = () => {
        vid.pause();
      };

      const handleSeeked = () => {
        seekingRef.current = false;
      };

      vid.addEventListener('loadeddata', pauseOnLoad);
      vid.addEventListener('loadedmetadata', pauseOnLoad);
      vid.addEventListener('seeked', handleSeeked);
      if (vid.readyState >= 2) pauseOnLoad();

      cleanups.push(() => {
        vid.removeEventListener('loadeddata', pauseOnLoad);
        vid.removeEventListener('loadedmetadata', pauseOnLoad);
        vid.removeEventListener('seeked', handleSeeked);
        vid.pause();
      });
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, []);

  // Instant sync on theme change so the emerging video is already in lockstep
  useEffect(() => {
    const activeVideo = isDark ? videoNightRef.current : videoDayRef.current;
    if (activeVideo && activeVideo.readyState >= 2 && Number.isFinite(activeVideo.duration)) {
      const targetTime = currentRef.current * Math.max(0, activeVideo.duration - 0.04);
      try {
        activeVideo.currentTime = targetTime;
      } catch {}
    }
  }, [isDark]);

  const phases = useMemo(
    () => [
      {
        id: 'p1',
        kicker: dict.cinematic.phase01Kicker,
        title: dict.cinematic.phase01Title,
        body: dict.cinematic.phase01Body,
        metrics: [
          { label: 'FLIGHT', value: dict.cinematic.hudFlight, icon: Plane },
          { label: 'ROUTE', value: dict.cinematic.hudRoute, icon: Route },
          { label: 'ALTITUDE', value: dict.cinematic.hudFl, icon: Gauge },
          { label: 'TEMP', value: dict.cinematic.hudTemp, icon: ThermometerSnowflake },
        ],
        icon: Navigation,
      },
      {
        id: 'p2',
        kicker: dict.cinematic.phase02Kicker,
        title: dict.cinematic.phase02Title,
        body: dict.cinematic.phase02Body,
        metrics: [
          { label: 'EVENT', value: 'WHEELS DOWN', icon: RadioTower },
          { label: 'RUNWAY', value: dict.cinematic.hudRunway, icon: Navigation },
          { label: 'TURNAROUND', value: '< 15 MIN', icon: Timer },
          { label: 'CARGO', value: 'CAI COLD CELL', icon: Snowflake },
        ],
        icon: RadioTower,
      },
      {
        id: 'p3',
        kicker: dict.cinematic.phase03Kicker,
        title: dict.cinematic.phase03Title,
        body: dict.cinematic.phase03Body,
        metrics: [
          { label: 'E-AWB', value: 'PRE-CLEARED', icon: FileCheck2 },
          { label: 'ACID', value: 'NAFEZA', icon: ShieldCheck },
          { label: 'GATE', value: 'REEFER', icon: Truck },
          { label: 'DWELL', value: dict.cinematic.hudDwell, icon: PackageCheck },
        ],
        icon: PackageCheck,
      },
    ],
    [dict.cinematic]
  );

  const activeIndex = progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2;
  const active = phases[activeIndex];
  const ActiveIcon = active.icon;
  const activeLabel = active.kicker.split('·').pop()?.trim() ?? active.kicker;

  return (
    <section ref={trackRef} className="relative h-[320vh] bg-[var(--c-bg)]" aria-label="Arrival digital twin">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[var(--c-bg)]">
        {/* Dual Cinematic Background: Night (Dark Mode) & Day (Light Mode) with buttery Crossfade */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Night Runway Video (Dark Mode) */}
          <video
            ref={videoNightRef}
            src="/assets/runway-scrub.mp4"
            poster="/assets/runway-poster.jpg"
            muted
            playsInline
            loop={false}
            preload="auto"
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover scale-105 filter brightness-90 contrast-110 transition-opacity duration-700 ease-in-out ${
              isDark ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          />

          {/* Day Runway Video (Light Mode) */}
          <video
            ref={videoDayRef}
            src="/assets/runway-scrub-day.mp4"
            poster="/assets/runway-poster.jpg"
            muted
            playsInline
            loop={false}
            preload="auto"
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover scale-105 filter brightness-100 contrast-105 transition-opacity duration-700 ease-in-out ${
              !isDark ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          />

          {/* Atmosphere Tint Gradient */}
          <div
            className={`absolute inset-0 z-20 pointer-events-none transition-colors duration-700 ${
              isDark
                ? 'bg-gradient-to-b from-[#070c14]/70 via-[#070c14]/30 to-[#070c14]/85'
                : 'bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/70'
            }`}
          />
          <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(7,12,20,0.6)_100%)]" />
        </div>

        {/* Dynamic bottom seam blend into the rest of the site */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--c-bg))' }}
          aria-hidden="true"
        />

        {/* Ergonomic & Symmetrical Cockpit HUD Deck */}
        <div className="absolute inset-x-0 top-16 bottom-6 z-30 mx-auto flex max-w-5xl flex-col justify-end px-4 sm:px-6 md:px-8">
          <article
            className="w-full rounded-2xl md:rounded-3xl border border-sky-300/20 bg-[linear-gradient(135deg,rgba(6,11,18,0.88),rgba(6,16,28,0.72))] p-4 sm:p-5 md:p-6 text-slate-100 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
            aria-live="polite"
          >
            {/* Top Bar: Sequence Indicator + Active Phase Badge + Live Progress */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-200">
                  <ActiveIcon className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  <span>{activeLabel}</span>
                </span>
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-slate-400" dir="ltr">
                  0{activeIndex + 1} / 03
                </span>
              </div>

              {/* Segmented Timeline Stepper */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {phases.map((phase, i) => (
                  <span
                    key={phase.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? 'w-8 sm:w-12 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                        : i < activeIndex
                        ? 'w-4 sm:w-6 bg-cyan-400/40'
                        : 'w-3 sm:w-4 bg-white/20'
                    }`}
                    aria-hidden="true"
                  />
                ))}
                <span className="font-mono text-[10px] sm:text-xs text-cyan-300 ml-1.5 rtl:ml-0 rtl:mr-1.5" dir="ltr">
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </div>

            {/* Content Body: Balanced Modern Typography */}
            <div className="mt-3.5 md:mt-4">
              <h1 className="font-sans font-extrabold text-lg sm:text-2xl md:text-3xl text-white tracking-tight leading-snug">
                {active.title}
              </h1>
              <p className="mt-1.5 md:mt-2 text-xs sm:text-sm md:text-[15px] leading-relaxed text-slate-300 max-w-3xl">
                {active.body}
              </p>
            </div>

            {/* Bottom Row: 4 Clean Avionics Telemetry Cards */}
            <dl className="mt-4 md:mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3" dir="ltr">
              {active.metrics.map(({ label, value, icon: MetricIcon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-black/30 p-2.5 sm:p-3 backdrop-blur-md transition-all hover:border-sky-400/40 hover:bg-black/40"
                >
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    <MetricIcon className="h-3.5 w-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </dt>
                  <dd className="mt-1 font-mono text-xs sm:text-sm font-bold tracking-tight text-sky-200">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </div>
    </section>
  );
};

export default CinematicStage;
