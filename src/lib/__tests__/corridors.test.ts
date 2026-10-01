import { describe, expect, it } from 'vitest';
import { AIR_CORRIDORS, DEFAULT_CORRIDOR_ID, findCorridor } from '../corridors';

/* Locks the reference data the simulator and the corridor browser share —
   the whole reason this table was extracted from the component in the first
   place is that duplicated literals drift apart. */

describe('AIR_CORRIDORS reference data', () => {
  it('exposes the four scheduled corridors', () => {
    expect(AIR_CORRIDORS).toHaveLength(4);
    expect(AIR_CORRIDORS.map((c) => c.code)).toEqual([
      'FRA ⇄ CAI',
      'DXB ⇄ CAI',
      'AMS ⇄ CAI',
      'PVG ⇄ CAI',
    ]);
  });

  it('has unique, stable ids', () => {
    const ids = AIR_CORRIDORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^corridor-[a-z]{3}-cai$/);
  });

  it('carries positive flight distances and frequencies', () => {
    for (const c of AIR_CORRIDORS) {
      expect(c.distanceKm).toBeGreaterThan(0);
      expect(c.weeklyFrequencies).toBeGreaterThan(0);
      expect(c.fromIata).toMatch(/^[A-Z]{3}$/);
      expect(c.toIata).toBe('CAI');
    }
  });

  it('pairs every corridor with a real sea lane benchmark', () => {
    for (const c of AIR_CORRIDORS) {
      expect(c.seaLane.seaDistanceKm).toBeGreaterThan(0);
      expect(c.seaLane.portToPortDaysMin).toBeLessThanOrEqual(c.seaLane.portToPortDaysMax);
      // Sailing distance must not be a re-labelled flight distance.
      expect(c.seaLane.seaDistanceKm).not.toBe(c.distanceKm);
    }
  });

  it('is fully bilingual (every EN field has an AR counterpart)', () => {
    for (const c of AIR_CORRIDORS) {
      expect(c.fromCityAr).toBeTruthy();
      expect(c.toCityAr).toBeTruthy();
      expect(c.primaryCargoAr).toBeTruthy();
      expect(c.strategicSignificanceAr).toBeTruthy();
      expect(c.carrierAr).toBeTruthy();
      expect(c.flightTimeAr).toBeTruthy();
      expect(c.seaLane.originPortAr).toBeTruthy();
      expect(c.seaLane.destPortAr).toBeTruthy();
    }
  });
});

describe('findCorridor', () => {
  it('resolves the default corridor id', () => {
    expect(findCorridor(DEFAULT_CORRIDOR_ID)?.code).toBe('FRA ⇄ CAI');
  });

  it('resolves any known id', () => {
    expect(findCorridor('corridor-pvg-cai')?.fromIata).toBe('PVG');
  });

  it('returns null for null, empty, and unknown ids', () => {
    expect(findCorridor(null)).toBeNull();
    expect(findCorridor('')).toBeNull();
    expect(findCorridor('corridor-jfk-cai')).toBeNull();
  });
});
