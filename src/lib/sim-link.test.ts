import { describe, expect, it } from 'vitest';
import { buildSimShareUrl, decodeSimState, encodeSimState, type SimShareState } from './sim-link';

const scenario: SimShareState = {
  lengthCm: 120,
  widthCm: 90,
  heightCm: 80,
  grossWeightKg: 40,
  pieces: 3,
  distanceKm: 2420,
  corridorId: 'corridor-dxb-cai',
  isPharmaColdChain: false,
  priority: true,
};

describe('simulator deep links', () => {
  it('round-trips a full scenario including corridor and flags', () => {
    expect(decodeSimState(encodeSimState(scenario))).toEqual(scenario);
  });

  it('round-trips a freehand (no corridor) scenario', () => {
    const freehand = { ...scenario, corridorId: null, distanceKm: 7300, priority: false };
    expect(decodeSimState(encodeSimState(freehand))).toEqual(freehand);
  });

  it('pins the distance to the corridor when a valid corridor id is present', () => {
    const tampered = encodeSimState(scenario).replace('d=2420', 'd=9999');
    expect(decodeSimState(tampered)?.distanceKm).toBe(2420);
  });

  it('clamps out-of-range values to the slider ranges', () => {
    const decoded = decodeSimState('sim=1&l=9000&w=1&h=50&kg=999999&pc=400');
    expect(decoded).toMatchObject({ lengthCm: 300, widthCm: 10, heightCm: 50, grossWeightKg: 1500, pieces: 20 });
  });

  it('rejects absent markers, unknown corridors fall back, and garbage yields null', () => {
    expect(decodeSimState('')).toBeNull();
    expect(decodeSimState('?foo=bar')).toBeNull();
    expect(decodeSimState('sim=1&l=80&w=60&h=abc&kg=45')).toBeNull();
    const unknownCorridor = decodeSimState('sim=1&l=80&w=60&h=50&kg=45&cor=corridor-nope&d=4000');
    expect(unknownCorridor?.corridorId).toBeNull();
    expect(unknownCorridor?.distanceKm).toBe(4000);
  });

  it('builds a full URL anchored at the simulator section', () => {
    const url = buildSimShareUrl(scenario, { origin: 'https://air.yaslogist.com', pathname: '/' });
    expect(url.startsWith('https://air.yaslogist.com/?sim=1&')).toBe(true);
    expect(url.endsWith('#simulator')).toBe(true);
    expect(url).toContain('cor=corridor-dxb-cai');
  });
});
