import React, { useEffect, useMemo, useRef } from 'react';

/**
 * A plan-position-indicator (PPI) scope.
 *
 * Geometry is the point of this component: the airport sits at the centre, so
 * the distance from the centre of the screen *is* the distance to Cairo, and
 * every ring can be labelled honestly in nautical miles. Targets are placed
 * from a bearing and a range rather than hand-tuned percentages, which is why
 * the tag numbers and the picture always agree.
 *
 * Motion is split by cost:
 * - the sweep is a CSS transform on a single composited layer;
 * - target afterglow is an opacity keyframe whose delay is the target's
 *   bearing, so a blip brightens exactly as the beam crosses it;
 * - the primary target glides between telemetry updates in a
 *   requestAnimationFrame loop that writes two `transform` attributes. It
 *   never calls setState, so a 60 Hz animation cannot re-render the section.
 * Everything stops when the section leaves the viewport.
 */

export interface RadarTarget {
  id: string;
  flightNumber: string;
  aircraft: string;
  headingDeg: number;
  altitudeFt: number;
  distanceNm: number;
  radarCoords: { x: number; y: number };
}

export const RADAR_RANGE_NM = 80;
export const RADAR_SWEEP_SECONDS = 8;

const VIEWBOX = 440;
const CENTRE = VIEWBOX / 2;
const R_BEZEL = 200;
const R_PLOT = 188;

/** Bearing from the field, in degrees clockwise from north. */
export function bearingFromField(coords: { x: number; y: number }): number {
  const degrees = (Math.atan2(coords.x - 50, -(coords.y - 50)) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/** Cartesian point for a bearing/radius pair, in SVG units. */
export function polarPoint(bearing: number, radius: number, centre = CENTRE) {
  const radians = (bearing * Math.PI) / 180;
  return {
    x: centre + Math.sin(radians) * radius,
    y: centre - Math.cos(radians) * radius,
  };
}

/** Where an aircraft sits on the plot, from its bearing and distance. */
export function plotPoint(bearing: number, distanceNm: number, rangeNm = RADAR_RANGE_NM) {
  const clamped = Math.max(0, Math.min(distanceNm, rangeNm));
  return polarPoint(bearing, (clamped / rangeNm) * R_PLOT);
}

export const TAG_SIZE = { width: 114, height: 40 } as const;
/** Bearing of the radial the range labels sit on. */
export const SCALE_RADIAL_DEG = 128;

/**
 * Where the selected aircraft's data block goes.
 *
 * It hangs on the inside of the target so it stays on the scope at any range,
 * and it flips away from the range-label radial so the two cannot collide
 * while an aircraft is close to it. The leader line always meets an edge of
 * the block, never its middle.
 */
export function tagPlacement(point: { x: number; y: number }, bearing: number) {
  const nearScale = Math.abs(((bearing - SCALE_RADIAL_DEG + 540) % 360) - 180) > 135;
  /* Available room decides first; the radial rule is only a tiebreaker. An
     aircraft near the western edge cannot have the block to its west, however
     much the labels would prefer it there. */
  const fitsLeft = point.x - TAG_SIZE.width - 18 >= 0;
  const fitsRight = point.x + TAG_SIZE.width + 18 <= VIEWBOX;
  let placeLeft = nearScale ? fitsLeft : point.x > CENTRE;
  if (placeLeft && !fitsLeft) placeLeft = false;
  if (!placeLeft && !fitsRight) placeLeft = true;
  const x = placeLeft ? point.x - TAG_SIZE.width - 18 : point.x + 18;
  const y = point.y > CENTRE + 80 ? point.y - TAG_SIZE.height - 4 : point.y + 14;
  return {
    x,
    y,
    placeLeft,
    leaderX: placeLeft ? x + TAG_SIZE.width : x,
    leaderY: y + TAG_SIZE.height / 2,
  };
}

const TEXT = {
  en: {
    region: 'CAIRO ACC · SECTOR E',
    mode: 'MODE A/C · PPI',
    range: 'RNG',
    nm: 'NM',
    selected: 'PRIMARY',
    traffic: 'TRAFFIC',
    field: 'FIELD',
    weather: 'WX',
    legendPrimary: 'Selected freighter',
    legendTraffic: 'Other simulated aircraft',
    legendField: 'Cairo · runway 05L',
    legendWeather: 'Weather cell',
    legendSweep: 'Sweep 8 s · rings every 20 NM',
    bearing: 'BRG',
    distance: 'DIST',
    toField: 'TO CAI',
    scopeLabel:
      'Plan-position radar, 80 nautical mile range, centred on Cairo. The selected freighter is plotted with its bearing and distance, alongside three other simulated aircraft.',
  },
  ar: {
    region: 'مراقبة القاهرة · قطاع E',
    mode: 'الوضع A/C · شاشة رادار',
    range: 'المدى',
    nm: 'ميل بحري',
    selected: 'الهدف الأساسي',
    traffic: 'حركة جوية',
    field: 'المطار',
    weather: 'طقس',
    legendPrimary: 'الشحنة المختارة',
    legendTraffic: 'طائرات محاكاة أخرى',
    legendField: 'القاهرة · مدرج 05L',
    legendWeather: 'خلية طقس',
    legendSweep: 'مسار الرادار ٨ ثوان · حلقات كل ٢٠ ميل',
    bearing: 'الاتجاه',
    distance: 'المسافة',
    toField: 'إلى القاهرة',
    altitude: 'الارتفاع',
    speed: 'السرعة',
    scopeLabel:
      'شاشة رادار بمدى ٨٠ ميلًا بحريًا ومركزها القاهرة. تظهر الشحنة المختارة باتجاهها ومسافتها مع ثلاث طائرات محاكاة أخرى.',
  },
} as const;

interface RadarScopeProps {
  flights: RadarTarget[];
  activeFlight: RadarTarget;
  distanceNm: number;
  active: boolean;
  isArabic: boolean;
  onSelectFlight: (id: string) => void;
}

const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);

/* Single aircraft silhouette, reused at two sizes. */
const AIRCRAFT_PATH =
  'M0,-7 L1.7,-2.5 L7,1 L7,2.4 L1.7,1.1 L1.3,5 L3.3,6.2 L3.3,7.4 L0,6.6 L-3.3,7.4 L-3.3,6.2 L-1.3,5 L-1.7,1.1 L-7,2.4 L-7,1 L-1.7,-2.5 Z';
const AIRCRAFT_PATH_LARGE =
  'M0,-10 L2.4,-3.6 L10,1.4 L10,3.2 L2.4,1.6 L1.8,7.2 L4.6,9 L4.6,10.4 L0,9.2 L-4.6,10.4 L-4.6,9 L-1.8,7.2 L-2.4,1.6 L-10,3.2 L-10,1.4 L-2.4,-3.6 Z';

export const RadarScope: React.FC<RadarScopeProps> = ({
  flights,
  activeFlight,
  distanceNm,
  active,
  isArabic,
  onSelectFlight,
}) => {
  const copy = isArabic ? TEXT.ar : TEXT.en;
  const targetRef = useRef<SVGGElement | null>(null);
  const tagRef = useRef<SVGGElement | null>(null);
  const routeRef = useRef<SVGLineElement | null>(null);
  const leaderRef = useRef<SVGLineElement | null>(null);
  const scopeRef = useRef<HTMLDivElement | null>(null);

  const bearing = useMemo(() => bearingFromField(activeFlight.radarCoords), [activeFlight]);

  /* Each aircraft keeps a stable slot so the picture does not reshuffle when
     the reader switches target. */
  const contacts = useMemo(
    () =>
      flights
        .filter((flight) => flight.id !== activeFlight.id)
        .map((flight) => {
          const contactBearing = bearingFromField(flight.radarCoords);
          const point = plotPoint(contactBearing, flight.distanceNm);
          return {
            flight,
            bearing: contactBearing,
            leftPct: (point.x / VIEWBOX) * 100,
            topPct: (point.y / VIEWBOX) * 100,
            /* Labels hang to the right until the contact is past the middle,
               where they would otherwise run through the bezel. */
            flip: point.x > CENTRE,
          };
        }),
    [flights, activeFlight.id],
  );

  /* Distance chain for the glide: `rendered` is what the picture shows now,
     the other two bound the interpolation that runs until the next telemetry
     update lands. */
  const rendered = useRef(distanceNm);
  const from = useRef(distanceNm);
  const to = useRef(distanceNm);
  const startedAt = useRef(0);

  useEffect(() => {
    rendered.current = distanceNm;
    from.current = distanceNm;
    to.current = distanceNm;
    startedAt.current = 0;
  }, [activeFlight.id]);

  useEffect(() => {
    from.current = rendered.current;
    to.current = distanceNm;
    startedAt.current = typeof performance !== 'undefined' ? performance.now() : 0;
  }, [distanceNm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const place = (distance: number, wobble = 0) => {
      const point = plotPoint(bearing, distance);
      const heading = activeFlight.headingDeg + wobble;

      targetRef.current?.setAttribute(
        'transform',
        `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${heading.toFixed(2)})`,
      );
      const tag = tagPlacement(point, bearing);
      tagRef.current?.setAttribute('transform', `translate(${tag.x.toFixed(1)} ${tag.y.toFixed(1)})`);
      if (leaderRef.current) {
        leaderRef.current.setAttribute('x1', point.x.toFixed(1));
        leaderRef.current.setAttribute('y1', point.y.toFixed(1));
        leaderRef.current.setAttribute('x2', tag.leaderX.toFixed(1));
        leaderRef.current.setAttribute('y2', tag.leaderY.toFixed(1));
      }

      if (routeRef.current) {
        routeRef.current.setAttribute('x1', point.x.toFixed(2));
        routeRef.current.setAttribute('y1', point.y.toFixed(2));
      }
      return point;
    };

    if (reduced || !active) {
      place(rendered.current);
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      const elapsed = startedAt.current ? now - startedAt.current : 2600;
      const progress = Math.min(1, Math.max(0, elapsed / 2600));
      /* smoothstep: no velocity discontinuity when a new fix arrives */
      const eased = progress * progress * (3 - 2 * progress);
      rendered.current = from.current + (to.current - from.current) * eased;
      place(rendered.current, Math.sin(now / 4200) * 1.6);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, activeFlight.headingDeg, bearing, distanceNm]);

  /* Cursor readout: the polar position under the pointer, so the rings can be
     read without counting gridlines. */
  const cursorBearing = useRef<HTMLSpanElement | null>(null);
  const cursorRange = useRef<HTMLSpanElement | null>(null);
  const cursorLabel = useRef<HTMLSpanElement | null>(null);
  const cursorMark = useRef<SVGCircleElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = scopeRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = ((event.clientX - box.left) / box.width) * VIEWBOX;
    const y = ((event.clientY - box.top) / box.height) * VIEWBOX;
    const dx = x - CENTRE;
    const dy = y - CENTRE;
    const radius = Math.hypot(dx, dy);
    if (radius > R_BEZEL) {
      handlePointerLeave();
      return;
    }
    const pointerBearing = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const normalised = (pointerBearing + 360) % 360;
    if (cursorBearing.current) cursorBearing.current.textContent = `${normalised.toFixed(0).padStart(3, '0')}°`;
    if (cursorRange.current) {
      cursorRange.current.textContent = `${((radius / R_PLOT) * RADAR_RANGE_NM).toFixed(0)} ${copy.nm}`;
    }
    if (cursorLabel.current) cursorLabel.current.textContent = 'CURSOR';
    cursorMark.current?.setAttribute('cx', x.toFixed(1));
    cursorMark.current?.setAttribute('cy', y.toFixed(1));
    cursorMark.current?.setAttribute('opacity', '1');
  };

  const handlePointerLeave = () => {
    if (cursorBearing.current) {
      cursorBearing.current.textContent = `${bearing.toFixed(0).padStart(3, '0')}°`;
    }
    if (cursorRange.current) {
      cursorRange.current.textContent = `${distanceNm.toFixed(1)} ${copy.nm}`;
    }
    if (cursorLabel.current) cursorLabel.current.textContent = copy.selected;
    cursorMark.current?.setAttribute('opacity', '0');
  };

  useEffect(() => {
    handlePointerLeave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bearing, distanceNm, isArabic]);

  const rings = [20, 40, 60];

  return (
    <figure className="m-0 w-full">
      <div
        ref={scopeRef}
        className="radar-scope relative mx-auto aspect-square w-full max-w-[440px]"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={copy.scopeLabel}
        >
          <defs>
            <radialGradient id="scopeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#0B1E33" stopOpacity="0" />
              <stop offset="100%" stopColor="#0B1E33" stopOpacity="0.85" />
            </radialGradient>
            <radialGradient id="sweepHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
            </radialGradient>
            <clipPath id="scopeClip">
              <circle cx={CENTRE} cy={CENTRE} r={R_PLOT} />
            </clipPath>
          </defs>

          {/* Bezel and plot */}
          <circle cx={CENTRE} cy={CENTRE} r={R_BEZEL} fill="none" stroke="var(--hud-line-strong)" strokeWidth="1" />
          <circle cx={CENTRE} cy={CENTRE} r={R_PLOT} fill="#06101C" stroke="var(--hud-line)" strokeWidth="1" />
          <circle cx={CENTRE} cy={CENTRE} r={R_PLOT} fill="url(#scopeGlow)" />

          {/* Range rings, labelled in nautical miles from the field */}
          <g clipPath="url(#scopeClip)">
            {rings.map((ring) => {
              const radius = (ring / RADAR_RANGE_NM) * R_PLOT;
              /* All three labels sit on one radial line in the empty lower
                 right quadrant, so they read as a scale instead of as three
                 stray numbers, and they clear the traffic cluster. */
              const label = polarPoint(SCALE_RADIAL_DEG, radius - 9);
              return (
                <g key={ring}>
                  <circle
                    cx={CENTRE}
                    cy={CENTRE}
                    r={radius}
                    fill="none"
                    stroke="var(--hud-line-strong)"
                    strokeWidth="0.8"
                    strokeDasharray={ring === 40 ? undefined : '3 5'}
                  />
                  <rect
                    x={label.x - 7}
                    y={label.y - 5.5}
                    width="14"
                    height="11"
                    rx="2"
                    fill="#06101C"
                    fillOpacity="0.9"
                  />
                  <text
                    x={label.x}
                    y={label.y + 2.5}
                    className="radar-numeral"
                    fill="var(--hud-ink-dim)"
                    fontSize="7.5"
                    textAnchor="middle"
                  >
                    {ring}
                  </text>
                </g>
              );
            })}
            <circle
              cx={CENTRE}
              cy={CENTRE}
              r={R_PLOT}
              fill="none"
              stroke="var(--hud-line-strong)"
              strokeWidth="1"
            />
          </g>

          {/* Axis cross. Faint enough to stay behind the data, present enough
              that a reader can judge a target's quadrant at a glance. */}
          <g clipPath="url(#scopeClip)" stroke="var(--hud-line)" strokeWidth="0.7">
            <line x1={CENTRE} y1={CENTRE - R_PLOT} x2={CENTRE} y2={CENTRE + R_PLOT} />
            <line x1={CENTRE - R_PLOT} y1={CENTRE} x2={CENTRE + R_PLOT} y2={CENTRE} />
          </g>

          {/* Bearing ticks on the bezel, long at each 30° */}
          <g>
            {TICKS.map((angle) => {
              const major = angle % 30 === 0;
              const medium = angle % 10 === 0;
              const outer = polarPoint(angle, R_BEZEL);
              const inner = polarPoint(angle, R_BEZEL - (major ? 11 : medium ? 7 : 4));
              return (
                <line
                  key={angle}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={major ? 'var(--hud-line-strong)' : 'var(--hud-line)'}
                  strokeWidth={major ? 1.2 : 0.7}
                />
              );
            })}
          </g>

          {/* Cardinal points and every 30° label */}
          <g className="radar-numeral" fill="var(--hud-ink-dim)" fontSize="8">
            {[
              { angle: 0, label: 'N' },
              { angle: 90, label: 'E' },
              { angle: 180, label: 'S' },
              { angle: 270, label: 'W' },
            ].map(({ angle, label }) => {
              const point = polarPoint(angle, R_BEZEL - 26);
              return (
                <text
                  key={label}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--hud-ink)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {label}
                </text>
              );
            })}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((angle) => {
              const point = polarPoint(angle, R_BEZEL - 24);
              return (
                <text key={angle} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle">
                  {String(angle).padStart(3, '0')}
                </text>
              );
            })}
          </g>

          {/* Weather cell — soft, clearly labelled, never confusable with an aircraft */}
          <g clipPath="url(#scopeClip)" opacity="0.5">
            <ellipse cx={118} cy={132} rx="46" ry="27" fill="var(--hud-warn)" opacity="0.10" transform="rotate(-24 118 132)" />
            <ellipse cx={118} cy={132} rx="46" ry="27" fill="none" stroke="var(--hud-warn)" strokeOpacity="0.45" strokeWidth="0.9" strokeDasharray="4 3" transform="rotate(-24 118 132)" />
            <text x="86" y="126" className="radar-numeral" fill="var(--hud-warn)" fontSize="8">
              WX · LIGHT
            </text>
          </g>

          {/* Direct-to-field vector for the selected aircraft */}
          <line
            ref={routeRef}
            x1={CENTRE}
            y1={CENTRE}
            x2={CENTRE}
            y2={CENTRE}
            stroke="var(--hud-accent)"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* The field itself is the origin of every measurement on the scope */}
          <g>
            <circle cx={CENTRE} cy={CENTRE} r="4" fill="var(--hud-ok)" />
            <circle cx={CENTRE} cy={CENTRE} r="9" fill="none" stroke="var(--hud-ok)" strokeOpacity="0.45" strokeWidth="1" />
            <text
              x={CENTRE + 15}
              y={CENTRE + 13}
              className="radar-numeral"
              fill="var(--hud-ok)"
              fontSize="9"
              fontWeight="600"
            >
              CAI 05L
            </text>
          </g>

          <circle ref={cursorMark} cx={CENTRE} cy={CENTRE} r="7" fill="none" stroke="var(--hud-ink)" strokeOpacity="0.35" strokeWidth="1" opacity="0" />
        </svg>

        {/* Sweep: one composited rotation. The trailing gradient is painted as
            a conic gradient so no filter or canvas is involved. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden="true">
          <div className={active ? 'radar-sweep h-full w-full' : 'radar-sweep radar-sweep-idle h-full w-full'}>
            <div className="radar-sweep-fill" />
            <div className="radar-sweep-beam" />
          </div>
          <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, transparent 58%, rgba(4,10,18,0.55) 100%)' }} />
        </div>

        {/* Traffic contacts: real buttons, so they are reachable by keyboard
            and screen readers, and they carry the sweep-synced afterglow. */}
        {contacts.map(({ flight, bearing: contactBearing, leftPct, topPct, flip }) => (
          <button
            key={flight.id}
            type="button"
            onClick={() => onSelectFlight(flight.id)}
            aria-label={`${isArabic ? 'اختر' : 'Select'} ${flight.flightNumber}`}
            className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          >
            <span
              className={active ? 'radar-contact' : 'radar-contact radar-contact-idle'}
              /* Negative delay = the beam is already this far round its cycle,
                 so the flash lands exactly when the sweep crosses the target. */
              style={{ animationDelay: `${((contactBearing - 360) / 360) * RADAR_SWEEP_SECONDS}s` }}
            >
              <svg viewBox="-10 -10 20 20" className="h-3.5 w-3.5" aria-hidden="true">
                <path d={AIRCRAFT_PATH} fill="var(--hud-ink-dim)" />
              </svg>
            </span>
            <span
              className={`pointer-events-none absolute top-0 whitespace-nowrap rounded-sm bg-[#04101C]/80 px-1 font-mono text-[8px] leading-tight text-[var(--hud-ink-dim)] transition-opacity group-hover:text-[var(--hud-ink)] group-focus-visible:text-[var(--hud-ink)] ${
                flip ? 'right-4' : 'left-4'
              }`}
              dir="ltr"
            >
              {flight.flightNumber} · FL{Math.round(flight.altitudeFt / 100)}
            </span>
          </button>
        ))}

        {/* Selected aircraft, drawn above the sweep so it never disappears
            under the beam. */}
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <line
            ref={leaderRef}
            x1={CENTRE}
            y1={CENTRE}
            x2={CENTRE}
            y2={CENTRE}
            stroke="var(--hud-accent)"
            strokeOpacity="0.5"
            strokeWidth="0.8"
          />
          <g ref={tagRef} transform={`translate(${CENTRE} ${CENTRE})`}>
            <rect x="0" y="0" width="114" height="40" rx="5" fill="#04101C" fillOpacity="0.94" stroke="var(--hud-accent)" strokeOpacity="0.55" />
            <rect x="0" y="0" width="3" height="40" rx="1.5" fill="var(--hud-accent)" />
            <text x="10" y="13" className="radar-numeral" fill="var(--hud-accent)" fontSize="10" fontWeight="700">
              {activeFlight.flightNumber}
            </text>
            <text x="10" y="25" className="radar-numeral" fill="var(--hud-ink)" fontSize="8.5">
              {`FL${Math.round(activeFlight.altitudeFt / 100)} · ${activeFlight.aircraft}`}
            </text>
            <text x="10" y="35" className="radar-numeral" fill="var(--hud-ink-dim)" fontSize="8">
              {`BRG ${bearing.toFixed(0).padStart(3, '0')}° · ${distanceNm.toFixed(1)} NM`}
            </text>
          </g>
          <g ref={targetRef} transform={`translate(${CENTRE} ${CENTRE})`}>
            <circle r="15" fill="url(#sweepHalo)" />
            <circle r="9" fill="none" stroke="var(--hud-accent)" strokeOpacity="0.55" strokeWidth="1" />
            <path d={AIRCRAFT_PATH_LARGE} fill="var(--hud-accent)" stroke="#04101C" strokeWidth="0.6" />
          </g>
        </svg>

        {/* Readouts: live cursor position or the selected target's fix */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-2 font-mono text-[9px] tracking-wider text-[var(--hud-ink-dim)]"
          dir="ltr"
        >
          <span>{copy.region}</span>
          <span>
            {copy.mode} · {copy.range} {RADAR_RANGE_NM} {copy.nm}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-1 font-mono text-[9px] tracking-wider" dir="ltr">
          <span className="text-[var(--hud-ink-dim)]">
            {`${copy.bearing} `}
            <span ref={cursorBearing} className="text-[var(--hud-ink)]">
              {bearing.toFixed(0).padStart(3, '0')}°
            </span>
            {` · ${copy.distance} `}
            <span ref={cursorRange} className="text-[var(--hud-ink)]">
              {distanceNm.toFixed(1)} {copy.nm}
            </span>
            {` ${copy.toField}`}
          </span>
          <span ref={cursorLabel} className="text-[var(--hud-accent)]">
            {copy.selected}
          </span>
        </div>
      </div>

      {/* Legend: what each mark means, in words */}
      <figcaption className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
        <LegendItem swatch={<span className="block h-2 w-2 rotate-45 rounded-[1px] bg-[var(--c-accent)]" />} label={copy.legendPrimary} />
        <LegendItem swatch={<span className="block h-2 w-2 rounded-full border border-[var(--c-muted)]" />} label={copy.legendTraffic} />
        <LegendItem swatch={<span className="block h-2 w-2 rounded-full bg-[var(--c-ok)]" />} label={copy.legendField} />
        <LegendItem swatch={<span className="block h-2 w-2 rounded-full border border-dashed border-[var(--c-warn)]" />} label={copy.legendWeather} />
        <span className="col-span-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted sm:col-span-4">
          {copy.legendSweep}
        </span>
      </figcaption>
    </figure>
  );
};

const LegendItem: React.FC<{ swatch: React.ReactNode; label: string }> = ({ swatch, label }) => (
  <span className="flex items-center gap-1.5 text-body">
    {swatch}
    <span>{label}</span>
  </span>
);
