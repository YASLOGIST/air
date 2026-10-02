import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { isWebGLSupported } from '../three/airgl/gl';
import {
  CorridorGlobeScene,
  type GlobeCorridor,
  type GlobeHub,
} from '../three/airgl/globe/scene';
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
 * Live airway-network globe. Card selection in CorridorsAir drives both the
 * focused arc (shader uniform, instant) and a damped globe rotation that
 * brings the corridor's midpoint to face the camera.
 */
export const CorridorGlobe3D: React.FC<CorridorGlobe3DProps> = ({ activeCorridorId }) => {
  const { isRtl } = useLang();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CorridorGlobeScene | null>(null);
  const [webGlFailed, setWebGlFailed] = useState(false);
  const [stats, setStats] = useState<{ fps: number; draws: number; dpr: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!isWebGLSupported()) {
      setWebGlFailed(true);
      return;
    }
    let scene: CorridorGlobeScene | null = null;
    try {
      scene = new CorridorGlobeScene(canvas, GLOBE_CORRIDORS, GLOBE_HUBS);
    } catch {
      setWebGlFailed(true);
      return;
    }
    sceneRef.current = scene;
    scene.onStats(setStats);

    const host = hostRef.current;
    let observer: IntersectionObserver | null = null;
    if (host && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => scene?.setVisible(entry.isIntersecting), { rootMargin: '200px' });
      observer.observe(host);
    } else {
      scene.setVisible(true);
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => scene?.setReducedMotion(reducedMotionQuery.matches);
    reducedMotionQuery.addEventListener?.('change', onMotionChange);
    onMotionChange();

    return () => {
      observer?.disconnect();
      reducedMotionQuery.removeEventListener?.('change', onMotionChange);
      scene?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [activeCorridorId, webGlFailed]);

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

      {!webGlFailed && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 space-y-1 font-mono" dir="ltr">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-black/45 px-2.5 py-1 text-[9px] font-bold tracking-[.18em] text-cyan-300 backdrop-blur">
              <Compass className="h-3 w-3" />
              AIRWAY NETWORK · LIVE ARCS
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
              {isRtl
                ? 'متصفحك حظر WebGL — الممرات الجوية المجدولة متاحة في البطاقات أدناه.'
                : 'WebGL is unavailable — the scheduled corridors remain fully browsable in the cards below.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorridorGlobe3D;
