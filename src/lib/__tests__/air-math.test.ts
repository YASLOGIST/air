import { describe, expect, it } from 'vitest';
import {
  AIRLINE_AWB_PREFIXES,
  airlineForAwbPrefix,
  calculateAirFreight,
  validateIataAwb,
} from '../air-math';
import type { SeaLaneBenchmark } from '../../types/air-freight';

/* Characterization of the IATA TACT / GLEC engine BEFORE the upgrade was
   derived by hand from the constants in air-math.ts; these tests now lock it
   in: divisor 6000, block speed 780 km/h + 2.5 h terminal allowance,
   freighter 0.502 kg CO2e/t·km, vessel 0.015 kg CO2e/t·km. */

const FRA_LANE: SeaLaneBenchmark = {
  originPortEn: 'Hamburg',
  originPortAr: 'هامبورغ',
  destPortEn: 'Alexandria',
  destPortAr: 'الإسكندرية',
  seaDistanceKm: 6400,
  portToPortDaysMin: 16,
  portToPortDaysMax: 21,
};

describe('calculateAirFreight', () => {
  it('charges the higher of gross vs volumetric weight (IATA 1:6000)', () => {
    const out = calculateAirFreight({
      lengthCm: 100,
      widthCm: 100,
      heightCm: 100,
      grossWeightKg: 100,
      distanceKm: 2910,
    });
    // 100×100×100 cm = 1 CBM = 166.7 kg volumetric > 100 kg gross
    expect(out.volumeCbm).toBe(1);
    expect(out.volumetricWeightKg).toBe(166.7);
    expect(out.chargeableWeightKg).toBe(166.7);
    expect(out.billingBasis).toBe('VOLUMETRIC_WEIGHT');
    expect(out.freightClass).toBe('VOLUMINOUS_LIGHT');
    expect(out.ratioActualToVolume).toBe(0.6); // 100 / 166.7
  });

  it('bills dense cargo on gross weight', () => {
    const out = calculateAirFreight({
      lengthCm: 100,
      widthCm: 100,
      heightCm: 100,
      grossWeightKg: 300,
      distanceKm: 2910,
    });
    expect(out.chargeableWeightKg).toBe(300);
    expect(out.billingBasis).toBe('GROSS_WEIGHT');
    expect(out.freightClass).toBe('DENSE_HEAVY');
  });

  it('computes airport-to-airport block time as distance/780 + 2.5h', () => {
    const out = calculateAirFreight({
      lengthCm: 60,
      widthCm: 50,
      heightCm: 45,
      grossWeightKg: 35,
      distanceKm: 2910,
    });
    expect(out.airportBlockHours).toBeCloseTo(6.2, 1); // 2910/780 + 2.5
  });

  it('computes GLEC freighter emissions from chargeable weight', () => {
    const out = calculateAirFreight({
      lengthCm: 100,
      widthCm: 100,
      heightCm: 100,
      grossWeightKg: 100,
      distanceKm: 2910,
    });
    // (166.7/1000) t × 2910 km × 0.502 kg/t·km = 243.5 kg = 0.244 t
    expect(out.estimatedCo2Tonnes).toBeCloseTo(0.244, 3);
  });

  it('produces an ocean comparison only when a real sea lane is supplied', () => {
    const base = {
      lengthCm: 60,
      widthCm: 50,
      heightCm: 45,
      grossWeightKg: 35,
      distanceKm: 2910,
    } as const;

    const withoutLane = calculateAirFreight(base);
    expect(withoutLane.oceanComparison).toBeNull();

    const withLane = calculateAirFreight({ ...base, seaLane: FRA_LANE });
    expect(withLane.oceanComparison).not.toBeNull();
    expect(withLane.oceanComparison!.seaDistanceKm).toBe(6400);
    expect(withoutLane.oceanComparison).toBeNull(); // unchanged by the other call
    // Vessel emissions use the SEA distance, never the flight distance:
    // (35/1000) × 6400 × 0.015 / 1000 = 0.003 t
    expect(withLane.oceanComparison!.co2Tonnes).toBeCloseTo(0.003, 3);
  });

  it('carries routing caveats through to the comparison', () => {
    const out = calculateAirFreight({
      lengthCm: 60,
      widthCm: 50,
      heightCm: 45,
      grossWeightKg: 35,
      distanceKm: 8350,
      seaLane: { ...FRA_LANE, routingCaveatEn: 'Assumes Suez transit.' },
    });
    expect(out.oceanComparison!.routingCaveatEn).toBe('Assumes Suez transit.');
  });
});

describe('validateIataAwb (IATA Mod-7)', () => {
  it('accepts the documented sample', () => {
    expect(validateIataAwb('077-94821031')).toBe(true);
  });

  it('accepts separator-free and space-separated forms', () => {
    expect(validateIataAwb('07794821031')).toBe(true);
    expect(validateIataAwb('077 94821031')).toBe(true);
  });

  it('accepts other correctly-checksummed prefixes', () => {
    // 7654321 % 7 === 3 → serial 7654321 with check digit 3 is valid
    expect(validateIataAwb('077-76543213')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(validateIataAwb('077-94821032')).toBe(false);
  });

  it('rejects wrong lengths', () => {
    expect(validateIataAwb('077-9482103')).toBe(false);
    expect(validateIataAwb('077-948210311')).toBe(false);
    expect(validateIataAwb('')).toBe(false);
  });

  it('rejects non-digit characters instead of parseInt-coercing them', () => {
    // Regression: parseInt used to read '884421A' as 884421 and could pass.
    expect(validateIataAwb('077-884421A5')).toBe(false);
    expect(validateIataAwb('077-8844211a')).toBe(false);
    expect(validateIataAwb('abc-defghijk')).toBe(false);
  });
});

describe('airlineForAwbPrefix', () => {
  it('names the carriers used across the site', () => {
    expect(airlineForAwbPrefix('077')).toBe('EgyptAir Cargo');
    expect(airlineForAwbPrefix('176')).toBe('Emirates SkyCargo');
    expect(airlineForAwbPrefix('999')).toBe('China Cargo Airlines');
    expect(airlineForAwbPrefix('074')).toBe('Air France KLM Cargo');
    expect(airlineForAwbPrefix('020')).toBe('Lufthansa Cargo');
  });

  it('returns null for unknown prefixes instead of guessing', () => {
    expect(airlineForAwbPrefix('123')).toBeNull();
  });

  it('keeps every prefix it names three digits', () => {
    for (const prefix of Object.keys(AIRLINE_AWB_PREFIXES)) {
      expect(prefix).toMatch(/^\d{3}$/);
    }
  });
});
