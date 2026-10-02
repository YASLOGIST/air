/**
 * YASLOGIST AIR — Core Freight Types and Interfaces
 * Grounded in IATA Cargo standards, ONE Record, and Egyptian Customs Authority (Nafeza ACID).
 */

export type Language = 'en' | 'ar';
export type Theme = 'dark' | 'light';

export type BillingBasis = 'GROSS_WEIGHT' | 'VOLUMETRIC_WEIGHT';
export type FreightDensityClass = 'DENSE_HEAVY' | 'VOLUMINOUS_LIGHT';

/**
 * A real sea routing that serves the same trade as an air corridor.
 *
 * Sea transit cannot be derived from flight distance: the great-circle path an
 * aircraft flies is not a path a vessel can take, and several corridor origins
 * (Frankfurt, Dubai) are not seaports at all. Each lane therefore carries its
 * own distance and its own published schedule range.
 */
export interface SeaLaneBenchmark {
  originPortEn: string;
  originPortAr: string;
  destPortEn: string;
  destPortAr: string;
  /** Sailing distance over the actual routing, not great-circle. */
  seaDistanceKm: number;
  /** Port-to-port range from published liner schedules, including transhipment. */
  portToPortDaysMin: number;
  portToPortDaysMax: number;
  /** Set where the lane's timing depends on a routing choice (e.g. Suez vs Cape). */
  routingCaveatEn?: string;
  routingCaveatAr?: string;
}

export interface AirCalculationInput {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKg: number;
  distanceKm: number;
  /**
   * Number of identical pieces in the consignment. Defaults to 1 so every
   * existing single-piece call site keeps its exact behaviour. Volume,
   * volumetric weight, chargeable weight, carbon and cost all scale with it.
   */
  pieces?: number;
  /** Omitted when the distance is set freehand and no corridor is selected. */
  seaLane?: SeaLaneBenchmark | null;
}

export interface OceanComparison {
  originPortEn: string;
  originPortAr: string;
  destPortEn: string;
  destPortAr: string;
  seaDistanceKm: number;
  portToPortDaysMin: number;
  portToPortDaysMax: number;
  co2Tonnes: number;
  routingCaveatEn?: string;
  routingCaveatAr?: string;
}

export interface AirCalculationOutput {
  /** Echo of the piece count the totals below were computed for. */
  pieces: number;
  /** Total consignment volume across all pieces. */
  volumeCbm: number;
  /** Total consignment volumetric weight across all pieces. */
  volumetricWeightKg: number;
  /** Total consignment gross (scale) weight across all pieces. */
  totalGrossWeightKg: number;
  chargeableWeightKg: number;
  billingBasis: BillingBasis;
  freightClass: FreightDensityClass;
  ratioActualToVolume: number;
  /** Stowed density of the consignment in kg per cubic metre (167 is the IATA pivot). */
  densityKgPerCbm: number;
  estimatedCo2Tonnes: number;
  /** Airport-to-airport block time. Excludes pickup, handling and delivery. */
  airportBlockHours: number;
  /** null when no sea lane was supplied, so no comparison is shown rather than invented. */
  oceanComparison: OceanComparison | null;
}

/**
 * Approximate usable internal envelope of a ULD in centimetres.
 * Published airline figures vary by a few cm between manufacturers; these are
 * conservative planning values for the fit simulation, not stowage guarantees.
 */
export interface UldInternalEnvelopeCm {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
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
  /** Usable internal envelope used by the load-fit engine. */
  internalCm: UldInternalEnvelopeCm;
}

/** Reasons a ULD can be excluded by the load-fit engine, in check order. */
export type UldFitBlocker =
  | 'NO_ACTIVE_COOLING' // cool-chain consignment in a passive unit
  | 'PIECE_TOO_LARGE' // a single piece exceeds the internal envelope in every allowed orientation
  | 'OVER_PAYLOAD' // total gross weight exceeds max gross minus tare
  | 'OVER_VOLUME'; // total volume exceeds the practical stowage limit

export interface UldFitAssessment {
  uld: ULDContainer;
  fits: boolean;
  blockers: UldFitBlocker[];
  /** Total consignment volume as % of the unit's rated internal volume (may exceed 100). */
  volumeUtilizationPct: number;
  /** Total gross weight as % of the unit's net payload (max gross − tare; may exceed 100). */
  payloadUtilizationPct: number;
  /** Net payload the unit can legally lift (max gross − tare), kg. */
  netPayloadKg: number;
}

export interface UldRecommendation {
  /** Every unit in the fleet, assessed, in fleet order. */
  assessments: UldFitAssessment[];
  /** The smallest fitting unit (ties broken by higher volume utilization), or null. */
  best: UldFitAssessment | null;
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
  /** The sea routing this air corridor competes with, for modal comparison. */
  seaLane: SeaLaneBenchmark;
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

export interface FreightCostBreakdown {
  baseRatePerKg: number;
  baseFreightTotal: number;
  fuelSurchargePerKg: number;
  fuelSurchargeTotal: number;
  securitySurchargePerKg: number;
  securitySurchargeTotal: number;
  terminalHandlingFixed: number;
  nafezaPreValidationFee: number;
  totalEstimatedUsd: number;
}
