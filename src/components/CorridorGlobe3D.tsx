import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { isWebGLSupported } from '../three/airgl/webgl-support';
import type { CorridorGlobeScene, GlobeCorridor, GlobeHub } from '../three/airgl/globe/scene';
import { anchorFor } from '../three/airgl/globe/airports';
import { AIR_CORRIDORS } from '../lib/corridors';
import { Compass, Globe2, MousePointer2 } from 'lucide-react';

interface CorridorGlobe3DProps {
  /** Currently selected corridor — its arc ignites and the globe rotates it to face camera. */
  activeCorridorId: string | null;
}

const GLOBE_CORRIDORS: GlobeCorridor[] = AIR_CORRIDORS.map((corridor) => {
  const from = anchorFor(corridor.fromIata);
  const to = anchorFor(corridor.toIata);
  return {
    id: corridor.id,
    fromLat: from.lat,
    fromLon: from.lon,
    toLat: to.lat,
    toLon: to.lon,
    distanceKm: corridor.distanceKm,
  };
});

const GLOBE_HUBS: GlobeHub[] = [
  { ...coordinatesOf('CAI'), eminence: 2.6, color: 0x67e8f9 },
  { ...coordinatesOf('FRA'), eminence: 1.1, color: 0x38bdf8 },
  { ...coordinatesOf('DXB'), eminence: 1.1, color: 0x38bdf8 },
  { ...coordinatesOf('AMS'), eminence: 1.1, color: 0x38bdf8 },
  { ...coordinatesOf('PVG'), eminence: 1.1, color: 0x38bdf8 },
];

function coordinatesOf(iata: string): { lat: number; lon: number } {
  const anchor = anchorFor(iata);
  return { lat: anchor.lat, lon: anchor.lon };
}

/**
 * Simulated airway-network globe. Card selection in CorridorsAir drives both
 * the focused arc (shader uniform, instant) and a damped globe rotation that
 * brings the corridor's midpoint to face the camera. Three.js is deferred
 * until this canvas approaches the viewport.
 */
export const CorridorGlobe3D: React.FC<CorridorGlobe3DProps> = ({ activeCorridorId }) => {
  const { isRtl } = useLang();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CorridorGlobeScene | null>(null);
  const [webGlFailure, setWebGlFailure] = useState<'unsupported' | 'load' | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [stats, setStats] = useState<{ fps: number; draws: number; dpr: number } | null>(null);
  const webGlFailed = webGlFailure !== null;
  const [contextLost, setContextLost] = useState(false);

  /* The WebGL bundle is requested only when the globe is about to enter the
     viewport. The observer also retains the existing off-screen render gate;
     a cancelled in-flight import can never allocate a late GPU context. */
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let active = true;
    let nearViewport = typeof IntersectionObserver === 'undefined';
    let loading = false;
    let scene: CorridorGlobeScene | null = null;
    let observer: IntersectionObserver | null = null;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const bootScene = async () => {
      if (!active || loading || scene) return;
      loading = true;
      setSceneLoading(true);

      if (!isWebGLSupported()) {
        if (active) {
          setWebGlFailure('unsupported');
          setSceneLoading(false);
        }
        return;
      }

      try {
        const { CorridorGlobeScene: Scene } = await import('../three/airgl/globe/scene');
        if (!active) return;

        scene = new Scene(canvas, GLOBE_CORRIDORS, GLOBE_HUBS);
        sceneRef.current = scene;
        scene.onStats(setStats);
        scene.onContextChange(setContextLost);
        scene.setVisible(nearViewport);
        scene.setReducedMotion(reducedMotionQuery.matches);
        setSceneReady(true);
      } catch {
        if (active) setWebGlFailure('load');
      } finally {
        if (active) setSceneLoading(false);
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry) return;
        nearViewport = entry.isIntersecting;
        scene?.setVisible(nearViewport);
        if (nearViewport) void bootScene();
      }, { rootMargin: '200px' });
      observer.observe(host);
    } else {
      void bootScene();
    }

    const onMotionChange = () => scene?.setReducedMotion(reducedMotionQuery.matches);
    reducedMotionQuery.addEventListener?.('change', onMotionChange);
    onMotionChange();

    return () => {
      active = false;
      observer?.disconnect();
      reducedMotionQuery.removeEventListener?.('change', onMotionChange);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !activeCorridorId) return;
    const corridor = GLOBE_CORRIDORS.find((c) => c.id === activeCorridorId) ?? null;
    sceneRef.current.setActiveCorridor(
      corridor?.id ?? null,
      corridor
        ? { fromLat: corridor.fromLat, fromLon: corridor.fromLon, toLat: corridor.toLat, toLon: corridor.toLon }
        : undefined,
    );
  }, [activeCorridorId, webGlFailed, sceneReady]);

  const active = AIR_CORRIDORS.find((c) => c.id === activeCorridorId) ?? null;

  return (
    <div
      ref={hostRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_42%,#081726_0%,#040a13_58%,#02060c_100%)]"
    >
      <canvas
        ref={canvasRef}
        aria-label="Interactive 3D globe rendering the scheduled air corridors converging on Cairo International Airport"
        className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
      />

      {!sceneReady && !webGlFailed && (
        <div
          aria-hidden={!sceneLoading}
          role={sceneLoading ? 'status' : undefined}
          aria-live={sceneLoading ? 'polite' : undefined}
          className="pointer-events-none absolute inset-0 z-[5] grid place-items-center bg-[#02060c]/45"
        >
          <div className="flex flex-col items-center gap-2 font-mono text-[10px] tracking-wider text-cyan-200/80">
            <Globe2 className="h-6 w-6 text-cyan-400/80" />
            {sceneLoading && <span>{isRtl ? 'جارٍ تحميل شبكة الممرات ثلاثية الأبعاد…' : 'Loading the 3D corridor network…'}</span>}
          </div>
        </div>
      )}

      {!webGlFailed && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 space-y-1 font-mono" dir="ltr">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold tracking-[.18em] text-cyan-300 backdrop-blur">
              <Compass className="h-3 w-3" />
              AIRWAY NETWORK · SIMULATED ARCS
            </span>
            <span className="block w-fit rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9px] tracking-wider text-slate-400 backdrop-blur">
              SOLAR TERMINATOR · REAL UTC
            </span>
            {active && (
              <span className="block w-fit rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[9px] tracking-wider text-slate-300 backdrop-blur">
                FOCUS ⇢ {active.code}
              </span>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[8px] text-slate-400" dir="ltr">
            <MousePointer2 className="h-3 w-3 text-cyan-400/70" />
            <span>{isRtl ? 'اسحب للتدوير · حرّك العجلة للتقريب' : 'DRAG TO SPIN · SCROLL TO ZOOM'}</span>
            {stats && (
              <span className="ml-2 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 backdrop-blur">
                {stats.fps} FPS · {stats.draws} DRAWS · DPR ×{stats.dpr}
              </span>
            )}
          </div>

          {/* Hub legend pins — DOM text stays razor sharp above the canvas. */}
          <div className="pointer-events-none absolute bottom-3 right-3 flex gap-1 font-mono text-[8px]" dir="ltr">
            {['FRA', 'DXB', 'AMS', 'PVG'].map((iata) => (
              <span key={iata} className="rounded-full border border-white/10 bg-black/45 px-1.5 py-0.5 text-sky-300/80 backdrop-blur">
                {iata}
              </span>
            ))}
            <span className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-1.5 py-0.5 font-bold text-cyan-200 backdrop-blur">
              CAI
            </span>
          </div>
        </>
      )}

      {webGlFailed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="max-w-xs space-y-2">
            <Globe2 className="mx-auto h-6 w-6 text-cyan-400" />
            <p className="font-mono text-xs text-slate-300">
              {webGlFailure === 'unsupported'
                ? (isRtl
                    ? 'عارض WebGL غير متاح — الممرات الجوية المجدولة متاحة في البطاقات أدناه.'
                    : 'WebGL is unavailable — the scheduled corridors remain browsable in the cards below.')
                : (isRtl
                    ? 'تعذّر تحميل الكرة ثلاثية الأبعاد — الممرات الجوية متاحة في البطاقات أدناه.'
                    : 'The 3D globe could not be loaded — the scheduled corridors remain available in the cards below.')}
            </p>
          </div>
        </div>
      )}

      {/* GPU-reset recovery — see ULDViewer3D for the identical contract.
          The globe pauses its loop the instant the context drops and
          resumes on its own once the browser restores it. */}
      {contextLost && !webGlFailed && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-20 grid place-items-center bg-[#02060c]/85 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-black/60 px-4 py-2 font-mono text-[11px] text-amber-200">
            <Compass className="h-3.5 w-3.5 animate-pulse" />
            <span>
              {isRtl
                ? 'انقطع عارض الرسوميات مؤقتاً — جارٍ إعادة الاتصال تلقائياً…'
                : 'Graphics context lost — reconnecting the 3D renderer…'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorridorGlobe3D;
