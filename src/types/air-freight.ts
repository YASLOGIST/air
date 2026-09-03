/**
 * YASLOGIST AIR — Core Freight Types and Interfaces
 * Grounded in IATA Cargo standards, ONE Record, and Egyptian Customs Authority (Nafeza ACID).
 */

export type Language = 'en' | 'ar';
export type Theme = 'dark' | 'light';

export type BillingBasis = 'GROSS_WEIGHT' | 'VOLUMETRIC_WEIGHT';
export type FreightDensityClass = 'DENSE_HEAVY' | 'VOLUMINOUS_LIGHT';

export interface AirCalculationInput {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  distanceKm: number;
}

export interface AirCalculationOutput {
  volumeCbm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  billingBasis: BillingBasis;
  freightClass: FreightDensityClass;
  ratioActualToVolume: number;
  estimatedCo2Tonnes: number;
  oceanAlternativeCo2Tonnes: number;
  flightTransitHours: number;
  oceanTransitDays: number;
}

export interface ULDContainer {
  id: string;
  code: 'AKE' | 'PMC' | 'RKN' | 'RAP';
  categoryEn: string;
  categoryAr: string;
  nameEn: string;
  nameAr: string;
  tareWeightKg: number;
  maxGrossWeightKg: number;
  volumeCbm: number;
  activeCooling: boolean;
  tempRangeEn: string;
  tempRangeAr: string;
  compatibleAircraft: string[];
  recommendedCargoEn: string;
  recommendedCargoAr: string;
  descriptionEn: string;
  descriptionAr: string;
  dimensionsEn: string;
  dimensionsAr: string;
}

export interface AirCorridor {
  id: string;
  code: string;
  fromIata: string;
  fromCityEn: string;
  fromCityAr: string;
  toIata: string;
  toCityEn: string;
  toCityAr: string;
  distanceKm: number;
  flightTimeEn: string;
  flightTimeAr: string;
  weeklyFrequencies: number;
  primaryCargoEn: string;
  primaryCargoAr: string;
  strategicSignificanceEn: string;
  strategicSignificanceAr: string;
  carrierEn: string;
  carrierAr: string;
}

export interface CargoVillageStep {
  stepNumber: number;
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  durationEn: string;
  durationAr: string;
  targetTempEn: string;
  targetTempAr: string;
  compliancePillEn: string;
  compliancePillAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ActiveTelemetryFlight {
  flightNumber: string;
  operator: string;
  route: string;
  originIata: string;
  destIata: string;
  altitudeFt: number;
  groundSpeedKts: number;
  headingDeg: number;
  assignedRunway: string;
  cargoDescription: string;
  uldId: string;
  temperatureCelsius: number;
  temperatureRange: string;
  coldChainStable: boolean;
  etaUtc: string;
  awbNumber: string;
  acidNumber: string;
}
