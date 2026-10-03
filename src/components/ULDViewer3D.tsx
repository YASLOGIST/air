import React, { useRef, useState, useEffect } from 'react';
import { useLang } from '../lib/i18n';
import { isWebGLSupported } from '../three/airgl/gl';
import { UldScene, type CameraPreset, type RenderMode, type SceneStats, type HotspotSpec } from '../three/airgl/uld/scene';
import type { UldCode } from '../three/airgl/uld/model';
import type { ULDContainer } from '../types/air-freight';
import {
  RotateCcw,
  Play,
  Pause,
  DoorOpen,
  DoorClosed,
  Eye,
  ZoomIn,
  ZoomOut,
  Layers,
  Radio,
  FileCode,
  Sparkles,
  ScanLine,
  ThermometerSnowflake,
  Box,
  Maximize2,
  PanelsTopLeft,
  Cpu,
  Globe2,
} from 'lucide-react';

interface ULDViewer3DProps {
  uld: ULDContainer;
}

function toUldCode(code: string): UldCode {
  return code === 'PMC' ? 'PMC' : code === 'RAP' ? 'RAP' : code === 'RKN' ? 'RKN' : 'AKE';
}

/**
 * WebGL ULD digital twin. All 3D state lives in the imperative UldScene; React
 * owns only UI truth (mode flags, overlay labels) and forwards intents. The
 * canvas is driven at the monitor's cadence with no per-frame React renders.
 */
export const ULDViewer3D: React.FC<ULDViewer3DProps> = ({ uld }) => {
  const { isRtl } = useLang();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<UldScene | null>(null);
  const [webGlFailed, setWebGlFailed] = useState(false);

  // UI truth mirrored to the scene.
  const [isAutoRotate, setIsAutoRotate] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [isInsideView, setIsInsideView] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>('material');
  const [isExploded, setIsExploded] = useState(false);
  const [customModelNotice, setCustomModelNotice] = useState(false);
  const [stats, setStats] = useState<SceneStats | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Hotspot overlay elements — written by the scene's projection, never by React state.
  const tempHotspotRef = useRef<HTMLDivElement | null>(null);
  const cargoHotspotRef = useRef<HTMLDivElement | null>(null);
  const acidHotspotRef = useRef<HTMLDivElement | null>(null);

  /* Boot the twin once. StrictMode mounts twice: the first scene is fully
     released (geometry, materials, render targets, context) before the
     second boots, so the tab's context budget stays clean. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!isWebGLSupported()) {
      setWebGlFailed(true);
      return;
    }
    let scene: UldScene | null = null;
    try {
      scene = new UldScene(canvas);
    } catch {
      setWebGlFailed(true);
      return;
    }
    sceneRef.current = scene;
    scene.onStats(setStats);
    scene.onContextChange(setContextLost);
    scene.setModel(toUldCode(uld.code));
    scene.setAutoRotate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const host = viewportRef.current;
    let observer: IntersectionObserver | null = null;
    if (host && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => scene?.setVisible(entry.isIntersecting), { rootMargin: '200px' });
      observer.observe(host);
    } else {
      scene.setVisible(true);
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => {
      scene?.setReducedMotion(reducedMotionQuery.matches);
      if (reducedMotionQuery.matches) scene?.setAutoRotate(false);
    };
    reducedMotionQuery.addEventListener?.('change', onMotionChange);
    onMotionChange();

    return () => {
      observer?.disconnect();
      reducedMotionQuery.removeEventListener?.('change', onMotionChange);
      scene?.dispose();
      sceneRef.current = null;
    };
    // The boot is identity-stable; model/mode intents flow through the
    // forwarding effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hotspot pill projection targets (registered once elements exist).
  useEffect(() => {
    const specs: HotspotSpec[] = [
      {
        id: 'temp',
        color: uld.activeCooling ? '#2dd4bf' : '#38bdf8',
        label: uld.activeCooling ? '+4.2°C · SIM' : 'AMBIENT HOLD',
        element: tempHotspotRef.current,
      },
      {
        id: 'cargo',
        color: '#f59e0b',
        label: `${uld.volumeCbm} CBM · ${(uld.maxGrossWeightKg - uld.tareWeightKg).toLocaleString()} KG`,
        element: cargoHotspotRef.current,
      },
      {
        id: 'acid',
        color: '#34d399',
        label: 'ACID REF · DEMO',
        element: acidHotspotRef.current,
      },
    ];
    sceneRef.current?.setHotspots(specs);
    return () => sceneRef.current?.setHotspots([]);
  }, [uld.activeCooling, uld.volumeCbm, uld.maxGrossWeightKg, uld.tareWeightKg, webGlFailed]);

  /* Intent forwarding — every knob below maps to exactly one scene method. */
  useEffect(() => {
    sceneRef.current?.setModel(toUldCode(uld.code));
  }, [uld.code]);
  useEffect(() => {
    sceneRef.current?.setRenderMode(renderMode);
  }, [renderMode]);
  useEffect(() => {
    sceneRef.current?.setDoorOpen(isDoorOpen);
  }, [isDoorOpen]);
  useEffect(() => {
    sceneRef.current?.setExploded(isExploded);
  }, [isExploded]);
  useEffect(() => {
    sceneRef.current?.setAutoRotate(isAutoRotate);
  }, [isAutoRotate]);

  const setPresetView = (view: CameraPreset) => {
    setIsAutoRotate(false);
    const inside = view === 'inside';
    setIsInsideView(inside);
    if (inside) setIsDoorOpen(true);
    sceneRef.current?.setPreset(view);
  };

  const handleViewerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.18 : 0.08;
    const scene = sceneRef.current;
    if (!scene) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setIsAutoRotate(false);
      scene.orbitBy(event.key === 'ArrowLeft' ? -step : step, 0);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      scene.orbitBy(0, event.key === 'ArrowUp' ? -step : step);
    } else if (event.key === '+' || event.key === '=') {
      scene.zoomBy(-0.5);
    } else if (event.key === '-') {
      scene.zoomBy(0.5);
    } else if (event.key.toLowerCase() === 'e') {
      setIsExploded((value) => !value);
    } else if (event.key.toLowerCase() === 'd') {
      setIsDoorOpen((value) => !value);
    }
  };

  const openFullscreen = async () => {
    try {
      await viewportRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen can be blocked by embedding/browser policy; normal view remains.
    }
  };

  return (
    <div className="relative rounded-3xl border border-cyan-500/30 bg-[#060b14] overflow-hidden shadow-2xl flex flex-col">
      {/* 3D Viewport Header Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-cyan-500/20 bg-[#09121f]/80 backdrop-blur-md gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white">
                {uld.code} · {isRtl ? 'المجسم التفاعلي 3D' : '3D DIGITAL TWIN'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                {isInsideView ? (isRtl ? 'وضع الاستكشاف الداخلي' : 'INSIDE VIEW') : (isRtl ? 'المظهر الخارجي' : 'ORBIT')}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/10 text-emerald-300 border border-emerald-400/25">
                <Cpu className="w-3 h-3" />
                WEBGL
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block">
              {isRtl
                ? 'اسحب للتدوير · حرّك العجلة للتكبير · افتح الباب لرؤية البضائع'
                : 'Drag to rotate · Scroll to zoom · Open door to inspect payload'}
            </span>
          </div>
        </div>

        {/* View mode actions */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setIsDoorOpen((value) => !value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all shadow-md active:scale-95 ${
              isDoorOpen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/10'
                : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/10 hover:bg-cyan-500/30'
            }`}
          >
            {isDoorOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
            <span>{isDoorOpen ? (isRtl ? 'إغلاق الباب' : 'Close Door') : (isRtl ? 'فتح الباب / الستار' : 'Open Door')}</span>
          </button>

          <button
            type="button"
            onClick={() => setPresetView(isInsideView ? 'iso' : 'inside')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all active:scale-95 ${
              isInsideView
                ? 'bg-teal-500/30 border-teal-400 text-teal-200'
                : 'glass-subcard border-white/10 text-slate-300 hover:text-white hover:border-cyan-400'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{isInsideView ? (isRtl ? 'الخروج للمظهر العام' : 'Exit to Orbit') : (isRtl ? 'الدخول للحاوية' : 'Step Inside')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoRotate((value) => !value)}
            title={isAutoRotate ? 'إيقاف الدوران' : 'تشغيل الدوران'}
            className="p-2 rounded-xl glass-subcard border-white/10 text-slate-300 hover:text-white hover:border-cyan-400"
          >
            {isAutoRotate ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setPresetView('iso')}
            title="إعادة ضبط زاوية الرؤية"
            className="p-2 rounded-xl glass-subcard border-white/10 text-slate-300 hover:text-white hover:border-cyan-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main WebGL Viewport */}
      <div
        ref={viewportRef}
        tabIndex={0}
        onKeyDown={handleViewerKeyDown}
        aria-label="Interactive 3D viewer. Use arrow keys to orbit, plus and minus to zoom, D for door, and E for exploded view."
        className="uld-studio relative h-[420px] sm:h-[500px] w-full cursor-grab active:cursor-grabbing select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300"
      >
        <div className="uld-studio-beam absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="absolute left-3 top-3 h-8 w-8 border-l border-t border-cyan-300/40 pointer-events-none z-10" aria-hidden="true" />
        <div className="absolute right-3 top-3 h-8 w-8 border-r border-t border-cyan-300/40 pointer-events-none z-10" aria-hidden="true" />

        <canvas
          ref={canvasRef}
          aria-label={`Interactive WebGL digital twin of ${uld.code} air cargo container`}
          className="block h-full w-full touch-none"
        />

        {/* GPU-reset recovery: the context can drop mid-session (driver
            reset, thermal throttling, a backgrounded mobile tab reclaiming
            VRAM) and restore a moment later. Rather than leaving a frozen
            last frame with no explanation, say so — the scene itself pauses
            its loop and resumes automatically once the browser restores. */}
        {contextLost && !webGlFailed && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-20 grid place-items-center bg-[#060b14]/90 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-black/60 px-4 py-2 font-mono text-[11px] text-amber-200">
              <Cpu className="h-3.5 w-3.5 animate-pulse" />
              <span>
                {isRtl
                  ? 'انقطع عارض الرسوميات مؤقتاً — جارٍ إعادة الاتصال تلقائياً…'
                  : 'Graphics context lost — reconnecting the 3D renderer…'}
              </span>
            </div>
          </div>
        )}

        {/* DOM hotspot beacons — projection-synced by the scene each frame. */}
        {!webGlFailed && (
          <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true" dir="ltr">
            {([
              { ref: tempHotspotRef, color: uld.activeCooling ? '#2dd4bf' : '#38bdf8' },
              { ref: cargoHotspotRef, color: '#f59e0b' },
              { ref: acidHotspotRef, color: '#34d399' },
            ] as const).map(({ ref, color }, i) => (
              <div key={i} ref={ref} className="absolute left-0 top-0" style={{ display: 'none', willChange: 'transform' }}>
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className="whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider text-white backdrop-blur-md"
                    style={{ borderColor: color, background: 'rgba(6,11,18,.82)', color }}
                  >
                    {i === 0
                      ? uld.activeCooling
                        ? '+4.2°C · SIM'
                        : 'AMBIENT HOLD'
                      : i === 1
                        ? `${uld.volumeCbm} CBM · ${(uld.maxGrossWeightKg - uld.tareWeightKg).toLocaleString()} KG`
                        : 'ACID REF · DEMO'}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full animate-ping-pulse"
                    style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Graceful WebGL-unavailable state: the twin's data, minus the GPU. */}
        {webGlFailed && (
          <div className="absolute inset-0 grid place-items-center bg-[#0a121e] p-6 text-center">
            <div className="max-w-sm space-y-2">
              <Globe2 className="mx-auto h-6 w-6 text-cyan-400" />
              <p className="font-mono text-xs text-slate-300">
                {isRtl
                  ? 'متصفحك حظر WebGL — يتم عرض بيانات الوحدة النصية.'
                  : 'WebGL is unavailable in this browser — showing the unit specification summary.'}
              </p>
              <p className="font-mono text-[10px] text-slate-500" dir="ltr">
                {uld.code} · {uld.internalCm.lengthCm}×{uld.internalCm.widthCm}×{uld.internalCm.heightCm} CM ·{' '}
                {uld.volumeCbm} CBM · {(uld.maxGrossWeightKg - uld.tareWeightKg).toLocaleString()} KG NET
              </p>
            </div>
          </div>
        )}

        {uld.code === 'RKN' && !webGlFailed && (
          <>
            <div className="pointer-events-none absolute right-4 top-4 hidden text-right font-mono sm:block" dir="ltr">
              <span className="block text-[9px] tracking-[.22em] text-teal-300/70">ENVIROTAINER · ACTIVE UNIT</span>
              <span className="mt-1 block text-[8px] text-slate-500">PBR SHELL · IBL STUDIO / SIMULATION</span>
            </div>
            <div className="pointer-events-none absolute inset-x-[18%] bottom-14 hidden items-center font-mono text-[8px] text-cyan-200/60 sm:flex" dir="ltr">
              <span className="h-2 border-l border-cyan-300/40" />
              <span className="h-px flex-1 bg-cyan-300/30" />
              <span className="mx-2">2000 mm · DIGITAL SCALE</span>
              <span className="h-px flex-1 bg-cyan-300/30" />
              <span className="h-2 border-r border-cyan-300/40" />
            </div>
          </>
        )}

        {/* Smart visualization layers */}
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-cyan-300/20 bg-[#030912]/75 p-1 font-mono text-[9px] shadow-2xl backdrop-blur-xl" dir="ltr">
          {[
            { id: 'material' as const, label: 'MATERIAL', icon: Box },
            { id: 'thermal' as const, label: 'THERMAL', icon: ThermometerSnowflake },
            { id: 'xray' as const, label: 'X-RAY', icon: ScanLine },
          ].map(({ id, label, icon: ModeIcon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={renderMode === id}
              onClick={() => setRenderMode(id)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 transition ${renderMode === id ? 'bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(103,232,249,.4)]' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              <ModeIcon className="h-3 w-3" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-white/15" />
          <button
            type="button"
            aria-pressed={isExploded}
            onClick={() => setIsExploded((value) => !value)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 transition ${isExploded ? 'bg-amber-300 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            title="Exploded assembly view (E)"
          >
            <PanelsTopLeft className="h-3 w-3" />
            <span className="hidden lg:inline">EXPLODE</span>
          </button>
          <button
            type="button"
            onClick={openFullscreen}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Fullscreen inspection"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>

        {isExploded && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 font-mono text-[8px] tracking-[.16em] text-amber-200 backdrop-blur" dir="ltr">
            ASSEMBLY SEPARATION · E TO COLLAPSE
          </div>
        )}

        {renderMode === 'thermal' && (
          <div className="pointer-events-none absolute right-4 top-20 z-20 hidden rounded-xl border border-white/10 bg-black/55 p-2 font-mono text-[8px] text-white backdrop-blur sm:block" dir="ltr">
            <span className="block mb-1 tracking-wider">SURFACE THERMAL MAP · GLSL</span>
            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-indigo-800 via-cyan-500 to-red-500" />
            <div className="mt-1 flex justify-between text-slate-400"><span>2°C</span><span>8°C</span><span>24°C</span></div>
          </div>
        )}

        {renderMode === 'xray' && (
          <div className="pointer-events-none absolute right-4 top-20 z-20 hidden rounded-xl border border-cyan-300/20 bg-cyan-950/30 px-3 py-2 font-mono text-[8px] tracking-wider text-cyan-200 backdrop-blur sm:block" dir="ltr">
            FRESNEL SHELL TRANSPARENCY · SCAN APERTURE SWEEPING
          </div>
        )}

        {/* Floating Telemetry & Information HUD */}
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10 pointer-events-none space-y-2">
          <div className="glass-panel p-3 rounded-2xl border border-cyan-500/30 max-w-[230px] space-y-1.5 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>{isRtl ? 'حالة تيليميتري محاكاة' : 'SIMULATED TELEMETRY'}</span>
              </span>
              <span className="text-emerald-400">DEMO ACTIVE</span>
            </div>

            <div className="space-y-1 font-mono text-xs text-white">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">{isRtl ? 'درجة الحرارة:' : 'TEMP:'}</span>
                <span className="font-bold text-teal-300" dir="ltr">
                  {uld.activeCooling ? '+4.2°C (±0.5°C)' : 'PASSIVE AMBIENT'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">{isRtl ? 'نسبة الامتلاء:' : 'VOLUME:'}</span>
                <span className="font-bold text-cyan-300" dir="ltr">{uld.volumeCbm} m³ (84%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">{isRtl ? 'مستشعر الصدمة:' : 'G-SENSOR:'}</span>
                <span className="font-bold text-emerald-300" dir="ltr">0.02G (NOMINAL)</span>
              </div>
            </div>
          </div>
        </div>

        {/* GPU load verifier — emitted by the render loop at 2 Hz. */}
        {stats && (
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 font-mono text-[8px] tracking-wider text-slate-400 backdrop-blur"
            dir="ltr"
            data-scene-fps={stats.fps}
            data-scene-draws={stats.draws}
          >
            {stats.fps} FPS · {stats.draws} DRAWS · DPR ×{stats.dpr}
          </div>
        )}

        {/* Camera Preset Quick Buttons (Bottom Left) */}
        <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 z-10 flex items-center gap-1.5 font-mono text-[10px] pointer-events-auto">
          <span className="text-slate-400 mr-1 hidden sm:inline">{isRtl ? 'زوايا الرؤية:' : 'CAMERA:'}</span>
          <button
            type="button"
            onClick={() => setPresetView('iso')}
            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md transition-colors"
          >
            {isRtl ? 'منظور مائل' : 'ISO'}
          </button>
          <button
            type="button"
            onClick={() => setPresetView('front')}
            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md transition-colors"
          >
            {isRtl ? 'الواجهة' : 'FRONT'}
          </button>
          <button
            type="button"
            onClick={() => setPresetView('side')}
            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md transition-colors"
          >
            {isRtl ? 'الجانب' : 'SIDE'}
          </button>
          <button
            type="button"
            onClick={() => setPresetView('inside')}
            className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/50 hover:border-teal-300 text-teal-300 backdrop-blur-md transition-colors font-bold"
          >
            {isRtl ? 'الدخول للحاوية 🔍' : 'INSIDE 🔍'}
          </button>
        </div>

        {/* Zoom Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 z-10 flex items-center gap-1 font-mono pointer-events-auto">
          <button
            type="button"
            onClick={() => sceneRef.current?.zoomBy(-0.55)}
            title="تكبير"
            className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => sceneRef.current?.zoomBy(0.55)}
            title="تصغير"
            className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400 text-white backdrop-blur-md"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Slot & Integration Drawer for Custom 3D Asset Imports */}
      <div className="border-t border-cyan-500/20 bg-[#070e1a] p-3 px-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {isRtl
              ? 'توأم رقمي WebGL حقيقي بخط أنابيب PBR وظلال GLSL — مهيأ لدمج ملفات (.gltf / .obj)'
              : 'True WebGL digital twin · PBR pipeline + hand-written GLSL — ready for custom (.gltf / .obj) asset insertion'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCustomModelNotice((value) => !value)}
          className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1 shrink-0"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{isRtl ? 'بوابة دمج النماذج ثلاثية الأبعاد (3D Asset Port)' : 'Custom 3D Asset Slot'}</span>
        </button>
      </div>

      {customModelNotice && (
        <div className="p-4 bg-[#0a1424] border-t border-cyan-500/30 text-xs font-mono text-slate-300 space-y-2">
          <div className="flex items-center justify-between font-bold text-cyan-300">
            <span>{isRtl ? 'تعليمات ربط ودمج مجسمات الحاويات المخصصة:' : 'Custom 3D ULD Model Plug-In Interface:'}</span>
            <button
              type="button"
              onClick={() => setCustomModelNotice(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="leading-relaxed">
            {isRtl
              ? 'محرك العرض يعمل بنظام موارد صارم: كل وحدة تُبنى إجرائياً ثم تُحرر ذاكرتها بالكامل عند التبديل. عند تصدير ملفات الحاويات (GLTF أو OBJ)، ضعها في assets/uld/ بنفس مسميات الأكواد (ake.gltf, rkn.gltf) وسيحل مسرّع GLTFLoader على نفس المسارات — مع بقاء حرارة المفصلات والنماذج الحرارية والتيليميتري كما هي.'
              : 'The engine enforces a strict resource policy: every unit builds procedurally and fully releases GPU memory on swap. When you export container files (GLTF/OBJ), drop them in assets/uld/ under matching code names (ake.gltf, rkn.gltf) — a GLTFLoader lane plugs into the same scene contract, and door kinematics, thermal/x-ray shaders and telemetry keep working.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ULDViewer3D;
