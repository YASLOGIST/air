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

  /* The scrub readout used to live in React state and was updated on every
     animation frame, re-rendering the whole cockpit deck ~60x/s while the user
     scrolled. React now owns only the phase (three changes across 320vh); the
     percentage is written straight to its DOM node through a ref. */
  const [phaseIndex, setPhaseIndex] = useState(0);
  const percentRef = useRef<HTMLSpanElement>(null);
  const phaseIndexRef = useRef(0);
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

    /* The percentage only needs to change when the integer changes, and the
       denominator only when the viewport or the stage is resized. Reading
       `offsetHeight` inside the scroll handler forced a layout on every
       scroll event; it is measured once here and again on resize. */
    const paint = (value: number) => {
      const label = `${Math.round(value * 100)}%`;
      if (percentRef.current && percentRef.current.textContent !== label) {
        percentRef.current.textContent = label;
      }
      const nextPhase = value < 0.33 ? 0 : value < 0.66 ? 1 : 2;
      if (nextPhase !== phaseIndexRef.current) {
        phaseIndexRef.current = nextPhase;
        setPhaseIndex(nextPhase);
      }
    };

    let total = Math.max(1, track.offsetHeight - window.innerHeight);

    const measure = () => {
      const rect = track.getBoundingClientRect();
      const next = clamp01(-rect.top / total);
      if (next !== targetRef.current) {
        targetRef.current = next;
        start();
      }
    };

    const remeasureStage = () => {
      total = Math.max(1, track.offsetHeight - window.innerHeight);
      measure();
    };

    if (reducedMotion) {
      targetRef.current = 0.5;
      currentRef.current = 0.5;
      paint(0.5);
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
      paint(current);

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
    targetRef.current = clamp01(-rect.top / total);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', remeasureStage);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', remeasureStage);
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

  const activeIndex = phaseIndex;
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
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
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
              !isDark ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          />

          {/* Atmosphere Tint Gradient */}
          <div className="stage-veil pointer-events-none absolute inset-0 z-20" />
          <div className="stage-vignette pointer-events-none absolute inset-0 z-20" />
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
          <article className="w-full rounded-2xl md:rounded-3xl border border-[var(--c-border)] bg-[var(--c-card-solid)] p-4 sm:p-5 md:p-6 text-body shadow-[0_20px_50px_-32px_rgba(16,24,40,0.35)] sm:p-6">
            {/* Top Bar: Sequence Indicator + Active Phase Badge + Live Progress */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--c-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-border)] bg-[var(--c-subcard)] px-3 py-1 font-mono text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[var(--c-accent)]">
                  <ActiveIcon className="h-3.5 w-3.5 text-[var(--c-accent)]" aria-hidden="true" />
                  <span>{activeLabel}</span>
                </span>
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-muted" dir="ltr">
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
                        ? 'w-8 sm:w-12 bg-[var(--c-accent)]'
                        : i < activeIndex
                        ? 'w-4 sm:w-6 bg-[var(--c-accent)] opacity-40'
                        : 'w-3 sm:w-4 bg-[var(--c-border)]'
                    }`}
                    aria-hidden="true"
                  />
                ))}
                <span
                  ref={percentRef}
                  className="font-mono text-[10px] sm:text-xs text-[var(--c-accent)] ms-1.5"
                  dir="ltr"
                  aria-hidden="true"
                >
                  0%
                </span>
              </div>
            </div>

            {/* Content Body: Balanced Modern Typography */}
            <div className="mt-3.5 md:mt-4">
              <h1 className="font-sans font-semibold text-lg sm:text-2xl md:text-3xl text-title tracking-tight leading-snug">
                {active.title}
              </h1>
              <p className="mt-1.5 md:mt-2 text-xs sm:text-sm md:text-[15px] leading-relaxed text-muted max-w-3xl">
                {active.body}
              </p>
            </div>

            {/* Bottom Row: 4 Clean Avionics Telemetry Cards */}
            <dl className="mt-4 md:mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3" dir="ltr">
              {active.metrics.map(({ label, value, icon: MetricIcon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--c-border)] bg-[var(--c-subcard)] p-2.5 transition-colors hover:border-[var(--c-accent)] hover:bg-[var(--c-card-solid)] sm:p-3"
                >
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wider text-muted uppercase">
                    <MetricIcon className="h-3.5 w-3.5 text-[var(--c-accent)] shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </dt>
                  <dd className="mt-1 font-mono text-xs sm:text-sm font-semibold tracking-tight text-title">
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
