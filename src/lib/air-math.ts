/**
 * YASLOGIST AIR — Logistics Mathematical Engine
 * Implements IATA TACT rules (1:6000 volumetric ratio) and GLEC Framework
 * carbon intensities.
 */

import type {
  AirCalculationInput,
  AirCalculationOutput,
  OceanComparison,
  FreightCostBreakdown,
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
  const numericInputs = { lengthCm, widthCm, heightCm, grossWeightKg, distanceKm };
  for (const [name, value] of Object.entries(numericInputs)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be a finite number greater than zero`);
    }
  }

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
 */
export function validateIataAwb(awbNumber: string): boolean {
  const clean = awbNumber.replace(/[\s-]/g, '');
  if (!/^\d{11}$/.test(clean)) return false;
  const serialPart = Number(clean.slice(3, 10));
  const checkDigit = Number(clean.slice(10));
  return serialPart % 7 === checkDigit;
}

export interface AirlinePrefixInfo {
  prefix: string;
  nameEn: string;
  nameAr: string;
  iataCode: string;
  hub: string;
}

const AIRLINE_PREFIX_DIRECTORY: Record<string, AirlinePrefixInfo> = {
  '077': { prefix: '077', nameEn: 'EgyptAir Cargo', nameAr: 'مصر للطيران للشحن الجوي', iataCode: 'MS', hub: 'CAI (Cairo)' },
  '176': { prefix: '176', nameEn: 'Emirates SkyCargo', nameAr: 'الإمارات للشحن الجوي', iataCode: 'EK', hub: 'DXB (Dubai)' },
  '074': { prefix: '074', nameEn: 'KLM Cargo', nameAr: 'الخطوط الجوية الملكية الهولندية للشحن', iataCode: 'KL', hub: 'AMS (Amsterdam)' },
  '020': { prefix: '020', nameEn: 'Lufthansa Cargo', nameAr: 'لوفتهانزا للشحن الجوي', iataCode: 'LH', hub: 'FRA (Frankfurt)' },
  '065': { prefix: '065', nameEn: 'Saudia Cargo', nameAr: 'الخطوط السعودية للشحن', iataCode: 'SV', hub: 'JED (Jeddah)' },
  '157': { prefix: '157', nameEn: 'Qatar Airways Cargo', nameAr: 'القطرية للشحن الجوي', iataCode: 'QR', hub: 'DOH (Doha)' },
  '235': { prefix: '235', nameEn: 'Turkish Cargo', nameAr: 'الخطوط التركية للشحن', iataCode: 'TK', hub: 'IST (Istanbul)' },
  '999': { prefix: '999', nameEn: 'Air China Cargo', nameAr: 'طيران الصين للشحن', iataCode: 'CA', hub: 'PEK/PVG' },
  '125': { prefix: '125', nameEn: 'British Airways World Cargo', nameAr: 'الخطوط الجوية البريطانية', iataCode: 'BA', hub: 'LHR (London)' },
  '057': { prefix: '057', nameEn: 'Air France Cargo', nameAr: 'الخطوط الجوية الفرنسية للشحن', iataCode: 'AF', hub: 'CDG (Paris)' },
  '724': { prefix: '724', nameEn: 'Swiss WorldCargo', nameAr: 'سويس وورلد كارجو', iataCode: 'LX', hub: 'ZRH (Zurich)' },
  '618': { prefix: '618', nameEn: 'Singapore Airlines Cargo', nameAr: 'الخطوط الجوية السنغافورية', iataCode: 'SQ', hub: 'SIN (Singapore)' },
};

/**
 * Resolves 3-digit IATA airline prefix from an AWB string
 */
export function lookupAirlineByPrefix(awbNumber: string): AirlinePrefixInfo {
  const clean = awbNumber.replace(/[\s-]/g, '');
  const prefix = clean.substring(0, 3);
  return (
    AIRLINE_PREFIX_DIRECTORY[prefix] ?? {
      prefix: prefix || '000',
      nameEn: 'Scheduled IATA Carrier',
      nameAr: 'شركة طيران عضو بالاتحاد الدولي (IATA)',
      iataCode: 'AIR',
      hub: 'International',
    }
  );
}

/**
 * Air Freight Indicative Cost Engine & Operational Surcharges Benchmark
 * Models base freight rates, fuel surcharge (FSC), security surcharge (SSC),
 * and Cairo Cargo Village terminal handling charges (THC).
 */
export function estimateAirFreightCost(
  chargeableWeightKg: number,
  corridorCode: string = 'FRA-CAI',
  isPharmaCoolChain: boolean = false,
  urgencyLevel: 'STANDARD' | 'PRIORITY' = 'STANDARD'
): FreightCostBreakdown {
  // Sector indicative market baseline per chargeable kg (USD)
  let baseRate = 2.95;
  if (corridorCode.includes('FRA')) baseRate = 3.45;
  else if (corridorCode.includes('DXB')) baseRate = 2.15;
  else if (corridorCode.includes('AMS')) baseRate = 3.20;
  else if (corridorCode.includes('PVG')) baseRate = 4.65;

  if (isPharmaCoolChain) {
    baseRate += 1.15; // Active temperature control & GDP validation surcharge
  }

  if (urgencyLevel === 'PRIORITY') {
    baseRate *= 1.25; // First-flight-out express capacity reservation
  }

  const fuelSurchargePerKg = 0.85; // Global aviation FSC benchmark
  const securitySurchargePerKg = 0.15; // ICAO / IATA SSC screening standard
  const terminalHandlingFixed = 65.0; // Cairo Cargo Village apron high-loader & ramp handling
  const nafezaPreValidationFee = 35.0; // Pre-clearance customs matching fee

  const baseFreightTotal = Number((chargeableWeightKg * baseRate).toFixed(2));
  const fuelSurchargeTotal = Number((chargeableWeightKg * fuelSurchargePerKg).toFixed(2));
  const securitySurchargeTotal = Number((chargeableWeightKg * securitySurchargePerKg).toFixed(2));

  const totalEstimatedUsd = Number(
    (
      baseFreightTotal +
      fuelSurchargeTotal +
      securitySurchargeTotal +
      terminalHandlingFixed +
      nafezaPreValidationFee
    ).toFixed(2)
  );

  return {
    baseRatePerKg: Number(baseRate.toFixed(2)),
    baseFreightTotal,
    fuelSurchargePerKg,
    fuelSurchargeTotal,
    securitySurchargePerKg,
    securitySurchargeTotal,
    terminalHandlingFixed,
    nafezaPreValidationFee,
    totalEstimatedUsd,
  };
}
