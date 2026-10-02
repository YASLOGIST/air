import { describe, expect, it } from 'vitest';
import {
  calculateAirFreight,
  computeAwbCheckDigit,
  estimateAirFreightCost,
  formatAwb,
  lookupAirlineByPrefix,
  suggestAwbCorrection,
  validateIataAwb,
} from './air-math';

describe('air freight engine', () => {
  it('selects volumetric billing and calculates deterministic output', () => {
    const result = calculateAirFreight({ lengthCm: 80, widthCm: 60, heightCm: 50, grossWeightKg: 25, distanceKm: 2910, seaLane: null });
    expect(result).toMatchObject({ volumeCbm: 0.24, volumetricWeightKg: 40, chargeableWeightKg: 40, billingBasis: 'VOLUMETRIC_WEIGHT' });
  });

  it('selects gross billing at equality and rejects unsafe inputs', () => {
    expect(calculateAirFreight({ lengthCm: 60, widthCm: 50, heightCm: 40, grossWeightKg: 20, distanceKm: 1000, seaLane: null }).billingBasis).toBe('GROSS_WEIGHT');
    expect(() => calculateAirFreight({ lengthCm: 0, widthCm: 50, heightCm: 40, grossWeightKg: 20, distanceKm: 1000, seaLane: null })).toThrow(RangeError);
    expect(() => calculateAirFreight({ lengthCm: Infinity, widthCm: 50, heightCm: 40, grossWeightKg: 20, distanceKm: 1000, seaLane: null })).toThrow(RangeError);
  });

  it('validates AWBs strictly and resolves known prefixes', () => {
    expect(validateIataAwb('077-94821031')).toBe(true);
    expect(validateIataAwb('077-9482103x')).toBe(false);
    expect(validateIataAwb('077-94821032')).toBe(false);
    expect(lookupAirlineByPrefix('077-94821031').iataCode).toBe('MS');
  });

  it('scales multi-piece consignments and reports density against the IATA pivot', () => {
    const one = calculateAirFreight({ lengthCm: 80, widthCm: 60, heightCm: 50, grossWeightKg: 25, distanceKm: 2910, seaLane: null });
    const four = calculateAirFreight({ lengthCm: 80, widthCm: 60, heightCm: 50, grossWeightKg: 25, pieces: 4, distanceKm: 2910, seaLane: null });
    expect(four.pieces).toBe(4);
    expect(four.volumeCbm).toBeCloseTo(one.volumeCbm * 4, 3);
    expect(four.volumetricWeightKg).toBeCloseTo(one.volumetricWeightKg * 4, 1);
    expect(four.totalGrossWeightKg).toBe(100);
    expect(four.chargeableWeightKg).toBeCloseTo(160, 1); // still volumetric-billed
    expect(four.densityKgPerCbm).toBeCloseTo(one.densityKgPerCbm, 1); // density is piece-count invariant
    expect(four.densityKgPerCbm).toBeLessThan(166.7);
    expect(() =>
      calculateAirFreight({ lengthCm: 80, widthCm: 60, heightCm: 50, grossWeightKg: 25, pieces: 1.5, distanceKm: 100, seaLane: null }),
    ).toThrow(RangeError);
  });

  it('computes, formats and suggests Mod-7 check digits', () => {
    expect(computeAwbCheckDigit('9482103')).toBe(1);
    expect(computeAwbCheckDigit('948210')).toBeNull();
    expect(formatAwb('07794821031')).toBe('077-94821031');
    expect(formatAwb('garbage')).toBe('garbage');
    // Wrong check digit → corrected
    expect(suggestAwbCorrection('077-94821032')).toBe('077-94821031');
    // Check digit omitted entirely → completed
    expect(suggestAwbCorrection('077-9482103')).toBe('077-94821031');
    // Already valid or unparseable → no suggestion
    expect(suggestAwbCorrection('077-94821031')).toBeNull();
    expect(suggestAwbCorrection('abc')).toBeNull();
    expect(validateIataAwb(suggestAwbCorrection('176-33910245')!)).toBe(true);
  });

  it('applies pharma and priority price modifiers', () => {
    const standard = estimateAirFreightCost(100, 'FRA-CAI');
    const priority = estimateAirFreightCost(100, 'FRA-CAI', true, 'PRIORITY');
    expect(priority.totalEstimatedUsd).toBeGreaterThan(standard.totalEstimatedUsd);
  });
});
