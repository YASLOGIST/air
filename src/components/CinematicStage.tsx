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

/**
 * Whether this visitor should be served the scrubbable runway reels at all.
 *
 * The two reels are 8.0 MB and 6.0 MB. `preload="metadata"` keeps the initial
 * request small, but the stage is 320vh of sticky scroll directly under the
 * fold — scrubbing it walks the decoder through most of the active reel, so a
 * visitor on a metered connection pays megabytes for decoration. When the
 * browser reports a data-saving preference the `src` is withheld entirely and
 * the `poster` still carries the shot, which is exactly what is already shown
 * during the theme crossfade. Everyone else sees the stage unchanged.
 */
function prefersReducedData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return true;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-data: reduce)').matches;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const CinematicStage: React.FC = () => {
  const { dict, isRtl } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const trackRef = useRef<HTMLDivElement>(null);
  const videoNightRef = useRef<HTMLVideoElement>(null);
  const videoDayRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState(0);
  // Keep the first render deterministic for SSR/hydration. Browser media
  // preferences are applied after mount, which also defers the decorative
  // video request until after the critical HTML has rendered.
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reelsEnabled, setReelsEnabled] = useState(false);

  useEffect(() => {
    const motionReduced = prefersReducedMotion();
    setReducedMotion(motionReduced);
    setReelsEnabled(!prefersReducedData() && !motionReduced);
  }, []);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lastAppliedTimeNightRef = useRef(-1);
  const lastAppliedTimeDayRef = useRef(-1);
  const lastSeekAtRef = useRef(0);

  // Sync scroll scrubbing for both day & night runway reels
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const rect = track.getBoundingClientRect();
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      const next = clamp01(-rect.top / total);
      if (next !== targetRef.current) {
        targetRef.current = next;
        start();
      }
    };

    if (reducedMotion) {
      targetRef.current = 0.5;
      currentRef.current = 0.5;
      setProgress(0.5);
      return;
    }

    let raf = 0;
    /* Frames the loop is allowed to keep spinning after the eased value has
       settled, so a seek that was rejected because the media byte range was
       not ready yet still gets retried instead of leaving a stale frame. */
    let seekRetries = 0;
    /* The easing loop used to run forever, so the hero kept burning a frame
       callback (and a React render) for the whole session, including long
       after the stage had been scrolled past. It now runs only while the
       eased value is still catching up with the scroll position. */
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      const target = targetRef.current;
      let current = currentRef.current;
      current += (target - current) * LERP;
      const settled = Math.abs(target - current) < 0.00045;
      if (settled) current = target;
      currentRef.current = current;
      setProgress(current);

      let seekPending = false;
      const now = performance.now();
      if (now - lastSeekAtRef.current >= SEEK_INTERVAL_MS) {
        lastSeekAtRef.current = now;
        // Metadata preload yields readyState 1. Seeking from metadata is valid and
        // lets the browser fetch only the byte range needed for the active theme.
        const video = reelsEnabled ? (isDark ? videoNightRef.current : videoDayRef.current) : null;
        const lastApplied = isDark ? lastAppliedTimeNightRef : lastAppliedTimeDayRef;
        if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA && Number.isFinite(video.duration) && video.duration > 0) {
          const targetTime = current * Math.max(0, video.duration - 0.04);
          if (Math.abs(lastApplied.current - targetTime) > 0.015) {
            lastApplied.current = targetTime;
            try {
              video.currentTime = targetTime;
            } catch {
              // A later animation frame retries after the media range is ready.
              lastApplied.current = -1;
              seekPending = true;
            }
          }
        } else if (video) {
          seekPending = true;
        }
      }

      seekRetries = settled && seekPending ? seekRetries + 1 : 0;
      if (settled && (!seekPending || seekRetries > 90)) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => measure();
    const rect = track.getBoundingClientRect();
    targetRef.current = clamp01(-rect.top / Math.max(1, track.offsetHeight - window.innerHeight));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isDark, reelsEnabled, reducedMotion]);

  // Setup video event handlers for both videos
  useEffect(() => {
    const videos = [videoNightRef.current, videoDayRef.current];

    const cleanups: (() => void)[] = [];

    videos.forEach((vid) => {
      if (!vid) return;

      vid.muted = true;
      vid.pause();

      const pauseOnLoad = () => {
        vid.pause();
      };

      vid.addEventListener('loadeddata', pauseOnLoad);
      vid.addEventListener('loadedmetadata', pauseOnLoad);
      if (vid.readyState >= 2) pauseOnLoad();

      cleanups.push(() => {
        vid.removeEventListener('loadeddata', pauseOnLoad);
        vid.removeEventListener('loadedmetadata', pauseOnLoad);
        vid.pause();
      });
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, []);

  // Instant sync on theme change so the emerging video is already in lockstep
  useEffect(() => {
    if (!reelsEnabled) return;
    const activeVideo = isDark ? videoNightRef.current : videoDayRef.current;
    /* Only the theme that is actually on screen preloads (see `preload` below),
       so the first switch has to kick off the newly visible reel itself. Until
       its metadata lands the poster stays up, which is what the user already
       sees during the crossfade. */
    if (activeVideo && activeVideo.readyState === HTMLMediaElement.HAVE_NOTHING) {
      activeVideo.load();
    }
    if (activeVideo && activeVideo.readyState >= HTMLMediaElement.HAVE_METADATA && Number.isFinite(activeVideo.duration)) {
      const targetTime = currentRef.current * Math.max(0, activeVideo.duration - 0.04);
      try {
        activeVideo.currentTime = targetTime;
      } catch {}
    }
  }, [isDark, reelsEnabled]);

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
    <section ref={trackRef} className={`relative ${reducedMotion ? 'h-[100svh]' : 'h-[320vh]'} bg-[var(--c-bg)]`} aria-label={isRtl ? 'التوأم الرقمي لرحلة الوصول' : 'Arrival digital twin'}>
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[var(--c-bg)]">
        {/* Dual Cinematic Background: Night (Dark Mode) & Day (Light Mode) with buttery Crossfade */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Night Runway Video (Dark Mode) */}
          <video
            ref={videoNightRef}
            src={reelsEnabled ? '/assets/runway-scrub.mp4' : undefined}
            poster="/assets/runway-poster.jpg"
            muted
            playsInline
            loop={false}
            preload={reelsEnabled && isDark ? 'metadata' : 'none'}
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover scale-105 filter brightness-90 contrast-110 transition-opacity duration-700 ease-in-out ${
              isDark ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          />

          {/* Day Runway Video (Light Mode) */}
          <video
            ref={videoDayRef}
            src={reelsEnabled ? '/assets/runway-scrub-day.mp4' : undefined}
            poster="/assets/runway-poster.jpg"
            muted
            playsInline
            loop={false}
            preload={reelsEnabled && !isDark ? 'metadata' : 'none'}
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
          {/* The scrub percentage changes on every animation frame. With the
              whole card marked `aria-live`, that meant a screen reader
              re-announced the entire HUD — badge, counter, headline, body and
              all four telemetry cards — continuously for the length of the
              scroll. Only the phase transition is news, so only the phase is
              announced, from a region whose text changes exactly three times. */}
          <p className="sr-only" role="status">
            {`${activeLabel} — ${active.title}`}
          </p>
          <article className="w-full rounded-2xl md:rounded-3xl border border-sky-300/20 bg-[linear-gradient(135deg,rgba(6,11,18,0.88),rgba(6,16,28,0.72))] p-4 sm:p-5 md:p-6 text-slate-100 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
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
                <span
                  className="font-mono text-[10px] sm:text-xs text-cyan-300 ms-1.5"
                  dir="ltr"
                  aria-hidden="true"
                >
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
