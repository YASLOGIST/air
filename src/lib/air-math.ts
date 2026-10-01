/**
 * YASLOGIST AIR — Logistics Mathematical Engine
 * Implements IATA TACT rules (1:6000 volumetric ratio) and GLEC Framework
 * carbon intensities.
 */

import type {
  AirCalculationInput,
  AirCalculationOutput,
  OceanComparison,
} from '../types/air-freight';

/* Emission intensity in kg CO2e per tonne-kilometre.
   Sourced from the GLEC Framework / EN 16258 family of default factors, not
   from IATA RP 1678 — RP 1678 is the passenger CO2 methodology and does not
   cover freighter cargo. Both figures are averages across load factors and
   equipment types: they size the gap between the two modes, they do not price
   a specific booking. */
const AIR_FREIGHTER_KG_CO2E_PER_TONNE_KM = 0.502;
const CONTAINER_VESSEL_KG_CO2E_PER_TONNE_KM = 0.015;

/* Widebody freighter block speed in km/h, plus a fixed allowance covering taxi,
   climb and descent. This yields AIRPORT-TO-AIRPORT block time. Door-to-door
   additionally carries pickup, export handling, ground dwell at both ends and
   final delivery, and runs in days rather than hours — do not relabel this as
   a door-to-door figure. */
const FREIGHTER_BLOCK_SPEED_KMH = 780;
const TERMINAL_ALLOWANCE_HOURS = 2.5;

function tonnesCo2(chargeableWeightKg: number, distanceKm: number, kgPerTonneKm: number): number {
  const tonneKm = (chargeableWeightKg / 1000) * distanceKm;
  return Number(((tonneKm * kgPerTonneKm) / 1000).toFixed(3));
}

export function calculateAirFreight(input: AirCalculationInput): AirCalculationOutput {
  const { lengthCm, widthCm, heightCm, grossWeightKg, distanceKm, seaLane } = input;

  // 1. Volume calculation in Cubic Meters (CBM)
  const rawVolumeCbm = (lengthCm * widthCm * heightCm) / 1_000_000;
  const volumeCbm = Number(rawVolumeCbm.toFixed(3));

  // 2. Volumetric Weight according to IATA standard divisor (6,000 cm³/kg)
  const rawVolumetricWeight = (lengthCm * widthCm * heightCm) / 6000;
  const volumetricWeightKg = Number(rawVolumetricWeight.toFixed(1));

  // 3. Chargeable Weight Determination (Higher of Gross vs Volumetric)
  const chargeableWeightKg = Number(Math.max(grossWeightKg, volumetricWeightKg).toFixed(1));
  const billingBasis = grossWeightKg >= volumetricWeightKg ? 'GROSS_WEIGHT' : 'VOLUMETRIC_WEIGHT';
  const freightClass = grossWeightKg >= volumetricWeightKg ? 'DENSE_HEAVY' : 'VOLUMINOUS_LIGHT';

  // Ratio of actual weight to volumetric weight
  const ratioActualToVolume = volumetricWeightKg > 0
    ? Number((grossWeightKg / volumetricWeightKg).toFixed(2))
    : 1;

  // 4. Air carbon over the flown distance.
  const estimatedCo2Tonnes = tonnesCo2(
    chargeableWeightKg,
    distanceKm,
    AIR_FREIGHTER_KG_CO2E_PER_TONNE_KM,
  );

  // 5. Airport-to-airport block time.
  const airportBlockHours = Number(
    (distanceKm / FREIGHTER_BLOCK_SPEED_KMH + TERMINAL_ALLOWANCE_HOURS).toFixed(1),
  );

  /* 6. Ocean comparison.
     Only produced when the caller supplies a real sea lane. The previous
     implementation derived sailing days from the FLIGHT distance
     (`distanceKm / 550 + 8`), which put a vessel on a great-circle air path and
     sailed it out of Frankfurt — a city with no seaport. Sea distance, sea
     duration and sea carbon now all come from the lane, and when no lane is
     selected the comparison is absent rather than fabricated. */
  const oceanComparison: OceanComparison | null = seaLane
    ? {
        originPortEn: seaLane.originPortEn,
        originPortAr: seaLane.originPortAr,
        destPortEn: seaLane.destPortEn,
        destPortAr: seaLane.destPortAr,
        seaDistanceKm: seaLane.seaDistanceKm,
        portToPortDaysMin: seaLane.portToPortDaysMin,
        portToPortDaysMax: seaLane.portToPortDaysMax,
        co2Tonnes: tonnesCo2(
          chargeableWeightKg,
          seaLane.seaDistanceKm,
          CONTAINER_VESSEL_KG_CO2E_PER_TONNE_KM,
        ),
        routingCaveatEn: seaLane.routingCaveatEn,
        routingCaveatAr: seaLane.routingCaveatAr,
      }
    : null;

  return {
    volumeCbm,
    volumetricWeightKg,
    chargeableWeightKg,
    billingBasis,
    freightClass,
    ratioActualToVolume,
    estimatedCo2Tonnes,
    airportBlockHours,
    oceanComparison,
  };
}

/**
 * Standard Air Waybill (AWB) Checksum Validator (Mod 7 algorithm)
 * Validates the standard 11-digit IATA AWB number format: XXX-XXXXXXXC
 *
 * The candidate must be exactly 11 digits after stripping separators. The
 * previous implementation used parseInt, which silently accepted trailing
 * letters inside the serial ('077-884421A5' parsed as 884421) and could
 * therefore pass a malformed number as checksum-valid.
 */
export function validateIataAwb(awbNumber: string): boolean {
  const clean = awbNumber.replace(/[\s-]/g, '');
  if (!/^\d{11}$/.test(clean)) return false;
  const serialPart = Number(clean.substring(3, 10));
  const checkDigit = Number(clean.substring(10, 11));
  return serialPart % 7 === checkDigit;
}

/**
 * Airline AWB prefixes referenced by this site's simulated consignments.
 * Used to name the issuing carrier honestly in the e-AWB checker instead of
 * labelling every prefix "EgyptAir Cargo". Unknown prefixes are surfaced as
 * unknown rather than guessed.
 */
export const AIRLINE_AWB_PREFIXES: Record<string, string> = {
  '020': 'Lufthansa Cargo',
  '074': 'Air France KLM Cargo',
  '077': 'EgyptAir Cargo',
  '176': 'Emirates SkyCargo',
  '999': 'China Cargo Airlines',
};

/** Issuing-carrier name for a 3-digit AWB prefix, or null when unrecognized. */
export function airlineForAwbPrefix(prefix: string): string | null {
  return AIRLINE_AWB_PREFIXES[prefix] ?? null;
}
