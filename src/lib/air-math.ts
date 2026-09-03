/**
 * YASLOGIST AIR — Logistics Mathematical Engine
 * Implements IATA TACT rules (1:6000 volumetric ratio) and GLEC / IATA RP 1678 carbon frameworks.
 */

import type { AirCalculationInput, AirCalculationOutput } from '../types/air-freight';

export function calculateAirFreight(input: AirCalculationInput): AirCalculationOutput {
  const { lengthCm, widthCm, heightCm, grossWeightKg, distanceKm } = input;

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

  // 4. Carbon Footprint Estimation (IATA RP 1678 cargo standard ~502g CO2/tonne-km)
  const tonneKm = (chargeableWeightKg / 1000) * distanceKm;
  const estimatedCo2Tonnes = Number((tonneKm * 0.000502).toFixed(3));

  // Ocean comparative baseline (~15g CO2/tonne-km for container vessel)
  const oceanAlternativeCo2Tonnes = Number((tonneKm * 0.000015).toFixed(3));

  // 5. Estimated Transit Times for Trade-off Comparison
  const flightTransitHours = Number((distanceKm / 780 + 2.5).toFixed(1)); // flight cruise speed + airport ground handling
  const oceanTransitDays = Number((distanceKm / 550 + 8).toFixed(1)); // maritime voyage + port dwell time

  return {
    volumeCbm,
    volumetricWeightKg,
    chargeableWeightKg,
    billingBasis,
    freightClass,
    ratioActualToVolume,
    estimatedCo2Tonnes,
    oceanAlternativeCo2Tonnes,
    flightTransitHours,
    oceanTransitDays,
  };
}

/**
 * Standard Air Waybill (AWB) Checksum Validator (Mod 7 algorithm)
 * Validates the standard 11-digit IATA AWB number format: XXX-XXXXXXXC
 */
export function validateIataAwb(awbNumber: string): boolean {
  const clean = awbNumber.replace(/[\s-]/g, '');
  if (clean.length !== 11) return false;
  const serialPart = parseInt(clean.substring(3, 10), 10);
  const checkDigit = parseInt(clean.substring(10, 11), 10);
  if (isNaN(serialPart) || isNaN(checkDigit)) return false;
  return serialPart % 7 === checkDigit;
}
