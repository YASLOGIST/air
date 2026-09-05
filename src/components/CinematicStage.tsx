import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DigitalTwinBadge } from './DigitalTwinBadge';
import { useLang } from '../lib/i18n';
import { Play, Pause } from 'lucide-react';

const LERP = 0.14;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function layerOpacity(progress: number, start: number, end: number) {
  const fade = 0.1;
  if (progress < start - fade) return 0;
  if (progress < start) return (progress - (start - fade)) / fade;
  if (progress <= end) return 1;
  if (progress < end + fade) return 1 - (progress - end) / fade;
  return 0;
}

export const CinematicStage: React.FC = () => {
  const { dict } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollStopTimeout = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const rect = track.getBoundingClientRect();
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      targetRef.current = clamp01(-rect.top / total);

      // Handle video playback while scrolling
      const video = videoRef.current;
      if (video && !reduced) {
        lastScrollTime.current = Date.now();
        if (video.paused) {
          video.play().then(() => {
            setIsVideoPlaying(true);
          }).catch(() => {
            // Autoplay policy fallback
          });
        }

        if (scrollStopTimeout.current) {
          window.clearTimeout(scrollStopTimeout.current);
        }

        // Pause video 160ms after user stops scrolling
        scrollStopTimeout.current = window.setTimeout(() => {
          if (video && !video.paused) {
            video.pause();
            setIsVideoPlaying(false);
          }
        }, 160);
      }
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
      if (scrollStopTimeout.current) {
        window.clearTimeout(scrollStopTimeout.current);
      }
    };
  }, []);

  const phases = useMemo(
    () => [
      {
        id: 'p1',
        kicker: dict.cinematic.phase01Kicker,
        title: dict.cinematic.phase01Title,
        body: dict.cinematic.phase01Body,
        metrics: [
          ['FLT', dict.cinematic.hudFlight],
          ['RTE', dict.cinematic.hudRoute],
          ['ALT', dict.cinematic.hudFl],
          ['ULD', dict.cinematic.hudTemp],
        ],
      },
      {
        id: 'p2',
        kicker: dict.cinematic.phase02Kicker,
        title: dict.cinematic.phase02Title,
        body: dict.cinematic.phase02Body,
        metrics: [
          ['EVT', 'WHEELS DOWN'],
          ['RWY', dict.cinematic.hudRunway],
          ['TOW', '< 15 MIN'],
          ['HOLD', 'CAI COLD CELL'],
        ],
      },
      {
        id: 'p3',
        kicker: dict.cinematic.phase03Kicker,
        title: dict.cinematic.phase03Title,
        body: dict.cinematic.phase03Body,
        metrics: [
          ['e-AWB', 'PRE-CLEARED'],
          ['ACID', 'NAFEZA'],
          ['GATE', 'REEFER'],
          ['DWELL', dict.cinematic.hudDwell],
        ],
      },
    ],
    [dict.cinematic]
  );

  const activeIndex = progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2;
  const active = phases[activeIndex];

  // Aircraft animation coordinates across 320vh scroll
  const aircraftLeft = 10 + progress * 62;
  const aircraftTop = 16 + progress * 46;
  const aircraftScale = 0.75 + progress * 0.55;
  const aircraftRotate = -10 + progress * 16;

  const p1Opacity = layerOpacity(progress, 0, 0.32);
  const p2Opacity = layerOpacity(progress, 0.28, 0.68);
  const p3Opacity = layerOpacity(progress, 0.64, 1);

  return (
    <section ref={trackRef} className="relative h-[320vh]" aria-label="Arrival digital twin">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#070c14]">
        {/* Layer 1: High Stratosphere Deep Gradient */}
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{
            opacity: p1Opacity,
            background: 'radial-gradient(ellipse 120% 80% at 50% 20%, #0d1b2a 0%, #060b12 70%, #03070d 100%)',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c14] via-transparent to-black/60" />
        </div>

        {/* Layer 2: Final Approach Runway Drone Video Background */}
        <div
          className="absolute inset-0 transition-opacity duration-150 overflow-hidden"
          style={{ opacity: p2Opacity }}
        >
          <video
            ref={videoRef}
            src="/assets/runway-scrub.mp4"
            muted
            playsInline
            loop
            preload="auto"
            className="w-full h-full object-cover scale-105 filter brightness-90 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070c14]/70 via-[#070c14]/30 to-[#070c14]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(7,12,20,0.7)_100%)]" />

          {/* Video Scroll Playback Status Indicator */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-full border border-sky-400/30 bg-black/60 px-3 py-1.5 backdrop-blur-md">
            {isVideoPlaying ? (
              <Play className="h-3 w-3 text-sky-400 fill-sky-400 animate-pulse" />
            ) : (
              <Pause className="h-3 w-3 text-slate-400" />
            )}
            <span className="font-mono text-[10px] tracking-widest text-sky-300 uppercase">
              {isVideoPlaying ? 'SCROLL ACTIVE · RUNWAY FEED' : 'SCROLL TO PLAY · RUNWAY 05L'}
            </span>
          </div>
        </div>

        {/* Layer 3: Cairo Cargo Village Apron & Reefer Docks */}
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{ opacity: p3Opacity }}
        >
          <img
            src="/assets/cargo-village.jpg"
            alt="Cairo Airport Cargo Village Apron"
            className="w-full h-full object-cover scale-105 filter brightness-80 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070c14]/80 via-[#070c14]/40 to-[#070c14]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(7,12,20,0.75)_100%)]" />
        </div>

        {/* Dynamic Flying Aircraft SVG (320vh Descent Simulation) */}
        <svg
          className="pointer-events-none absolute z-20 transition-transform duration-75"
          style={{
            left: `${aircraftLeft}%`,
            top: `${aircraftTop}%`,
            width: 140,
            transform: `translate(-50%, -50%) rotate(${aircraftRotate}deg) scale(${aircraftScale})`,
            filter: 'drop-shadow(0 10px 24px rgba(56,189,248,0.5)) drop-shadow(0 0 12px rgba(2,132,199,0.4))',
          }}
          viewBox="0 0 120 40"
          aria-hidden="true"
        >
          <path
            d="M8 22 L52 20 L70 8 L76 8 L64 20 L96 19 L110 12 L114 14 L100 22 L114 28 L110 30 L96 24 L64 23 L76 34 L70 34 L52 23 L8 22 Z"
            fill="#e2e8f0"
            stroke="#38bdf8"
            strokeWidth="0.8"
          />
          {/* Navigation Wing Lights */}
          <circle cx="70" cy="8" r="1.5" fill="#ef4444" className="animate-pulse" />
          <circle cx="70" cy="34" r="1.5" fill="#22c55e" className="animate-pulse" />
        </svg>

        {/* Cockpit HUD Overlay Header & Phase Info Panel */}
        <div className="absolute inset-x-0 top-20 z-30 mx-auto flex max-w-[1440px] flex-col gap-4 px-4 md:top-24 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DigitalTwinBadge />
            <p className="mono text-[11px] text-sky-400/90 font-medium tracking-wide">
              {dict.cinematic.scrubHint}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            {/* Main Stage Text Card */}
            <article
              className="glass max-w-2xl rounded-3xl p-5 text-slate-100 md:p-7 transition-all duration-300"
              style={{ background: 'rgba(6, 11, 18, 0.72)', borderColor: 'rgba(56, 189, 248, 0.25)' }}
            >
              <p className="kicker text-sky-400">{active.kicker}</p>
              <h1 className="display mt-3 text-[clamp(1.8rem,4vw,3.2rem)] font-bold text-white tracking-tight leading-none">
                {active.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 md:text-base">
                {active.body}
              </p>

              {/* Avionics Metrics Grid */}
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" dir="ltr">
                {active.metrics.map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-2xl border border-sky-400/20 bg-[#070c14]/70 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <dt className="mono text-[10px] tracking-[0.18em] text-[#9bb0bc] uppercase font-semibold">
                      {k}
                    </dt>
                    <dd className="mono mt-1 text-sm font-bold text-sky-300">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>

            {/* Vertical Phase Stepper (Desktop) */}
            <ol className="hidden flex-col justify-center gap-3 lg:flex" dir="ltr">
              {phases.map((phase, i) => (
                <li
                  key={phase.id}
                  className={`rounded-2xl border px-4 py-3 font-mono text-[11px] tracking-[0.16em] uppercase transition-all duration-200 ${
                    i === activeIndex
                      ? 'border-sky-400 bg-sky-400/15 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                      : 'border-white/10 text-slate-400 bg-black/30'
                  }`}
                >
                  0{i + 1} · {i === 0 ? 'CRUISE' : i === 1 ? 'APPROACH' : 'VILLAGE'}
                </li>
              ))}
              <li className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all duration-75"
                  style={{ width: `${progress * 100}%` }}
                />
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicStage;
