import { describe, expect, it } from 'vitest';
import { calculateAirFreight, estimateAirFreightCost, lookupAirlineByPrefix, validateIataAwb } from './air-math';

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

  it('applies pharma and priority price modifiers', () => {
    const standard = estimateAirFreightCost(100, 'FRA-CAI');
    const priority = estimateAirFreightCost(100, 'FRA-CAI', true, 'PRIORITY');
    expect(priority.totalEstimatedUsd).toBeGreaterThan(standard.totalEstimatedUsd);
  });
});
