/**
 * YASLOGIST AIR — Shareable simulator deep links
 *
 * Serializes a volumetric-simulator scenario into a compact query string so a
 * configuration can be copied, shared and restored. Decoding is defensive:
 * every field is clamped to the simulator's slider ranges, and anything
 * unparseable yields null rather than a half-applied state. No network, no
 * storage — the URL itself is the only carrier, which keeps the simulation
 * boundary intact.
 */

import { findCorridor } from './corridors';

export interface SimShareState {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  pieces: number;
  distanceKm: number;
  /** null when the scenario was saved with a freehand distance. */
  corridorId: string | null;
  isPharmaColdChain: boolean;
  priority: boolean;
}

/** Slider ranges, mirrored from the simulator controls. */
const RANGES = {
  lengthCm: [10, 300],
  widthCm: [10, 240],
  heightCm: [10, 200],
  grossWeightKg: [1, 1500],
  pieces: [1, 20],
  distanceKm: [500, 12000],
} as const;

function clampInt(raw: string | null, [min, max]: readonly [number, number]): number | null {
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Builds the query string (no leading `?`) for a scenario. */
export function encodeSimState(state: SimShareState): string {
  const params = new URLSearchParams({
    sim: '1',
    l: String(state.lengthCm),
    w: String(state.widthCm),
    h: String(state.heightCm),
    kg: String(state.grossWeightKg),
    pc: String(state.pieces),
    d: String(state.distanceKm),
    ph: state.isPharmaColdChain ? '1' : '0',
    pr: state.priority ? '1' : '0',
  });
  if (state.corridorId) params.set('cor', state.corridorId);
  return params.toString();
}

/** Parses a query string (with or without `?`). Returns null unless `sim=1` and all dims parse. */
export function decodeSimState(search: string): SimShareState | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  } catch {
    return null;
  }
  if (params.get('sim') !== '1') return null;

  const lengthCm = clampInt(params.get('l'), RANGES.lengthCm);
  const widthCm = clampInt(params.get('w'), RANGES.widthCm);
  const heightCm = clampInt(params.get('h'), RANGES.heightCm);
  const grossWeightKg = clampInt(params.get('kg'), RANGES.grossWeightKg);
  if (lengthCm === null || widthCm === null || heightCm === null || grossWeightKg === null) {
    return null;
  }

  const pieces = clampInt(params.get('pc'), RANGES.pieces) ?? 1;
  const corridor = findCorridor(params.get('cor'));
  const distanceKm =
    corridor?.distanceKm ?? clampInt(params.get('d'), RANGES.distanceKm) ?? 2910;

  return {
    lengthCm,
    widthCm,
    heightCm,
    grossWeightKg,
    pieces,
    distanceKm,
    corridorId: corridor?.id ?? null,
    isPharmaColdChain: params.get('ph') === '1',
    priority: params.get('pr') === '1',
  };
}

/** Full shareable URL for the current origin/path, anchored at the simulator. */
export function buildSimShareUrl(state: SimShareState, location: Pick<Location, 'origin' | 'pathname'>): string {
  return `${location.origin}${location.pathname}?${encodeSimState(state)}#simulator`;
}
