/**
 * YASLOGIST AIR — ULD fleet reference data & load-fit engine
 *
 * Moved out of ULDSelector.tsx (the same consolidation already done for
 * corridors) so the ULD browser and the volumetric simulator read the same
 * fleet. The simulator uses `recommendUld` to tell the user which unit their
 * simulated consignment would actually be built onto.
 *
 * Internal envelopes are conservative planning values drawn from published
 * airline/Envirotainer specs; real build-up is governed by the carrier's
 * stowage rules, so the engine deliberately keeps a broken-stowage reserve.
 */

import type {
  ULDContainer,
  UldFitAssessment,
  UldFitBlocker,
  UldRecommendation,
} from '../types/air-freight';

export const ULD_FLEET: ULDContainer[] = [
  {
    id: 'uld-ake',
    code: 'AKE',
    categoryEn: 'Standard Lower Deck Half-Width (LD3)',
    categoryAr: 'حاوية نصف عرض للسطح السفلي (LD3)',
    nameEn: 'AKE / LD3 Standard Cargo Container',
    nameAr: 'حاوية AKE القياسية لبطن الطائرات',
    tareWeightKg: 68,
    maxGrossWeightKg: 1588,
    volumeCbm: 4.3,
    activeCooling: false,
    tempRangeEn: 'Ambient (+15°C to +25°C Passive)',
    tempRangeAr: 'شحن عادي غير مبرد',
    compatibleAircraft: ['Boeing 777-200F / 300ER', 'Boeing 787-9/10', 'Airbus A350-900', 'Airbus A330-200F'],
    recommendedCargoEn: 'Industrial spares, high-density e-commerce parcels, electronics, diplomatic mail.',
    recommendedCargoAr: 'قطع الغيار الصناعية، طرود التجارة الإلكترونية الكثيفة، الإلكترونيات، البريد الدبلوماسي.',
    descriptionEn: 'The universal workhorse of commercial widebody aviation. Engineered with contoured aluminum shell to fit the lower hold lobe perfectly.',
    descriptionAr: 'الحاوية القياسية الأكثر انتشاراً عالمياً، مشكلة هندسياً لتطابق انحناء عنبر الطائرة السفلي وتحقيق أقصى استغلال للمساحة.',
    dimensionsEn: '156 × 153 × 160 cm (Base: 156 × 119 cm)',
    dimensionsAr: '156 × 153 × 160 سم (القاعدة: 156 × 119 سم)',
    internalCm: { lengthCm: 145, widthCm: 142, heightCm: 152 },
  },
  {
    id: 'uld-pmc',
    code: 'PMC',
    categoryEn: 'Main & Lower Deck Universal Pallet',
    categoryAr: 'منصة شحن عامة للسطحين العلوي والسفلي',
    nameEn: 'PMC / P6P Heavy-Duty Aircraft Pallet',
    nameAr: 'منصة PMC المعدنية فائقة الحمولة مع شباك التثبيت',
    tareWeightKg: 120,
    maxGrossWeightKg: 6804,
    volumeCbm: 11.5,
    activeCooling: false,
    tempRangeEn: 'Ambient / Thermal Blanketing Allowed',
    tempRangeAr: 'شحن عادي / عزل حراري بالأغطية',
    compatibleAircraft: ['Boeing 777F Main Deck', 'Boeing 747-400F/8F', 'Airbus A330F Lower Deck', 'Boeing 787'],
    recommendedCargoEn: 'Heavy machinery, automotive powertrains, oilfield valves, oversized manufacturing equipment.',
    recommendedCargoAr: 'المعدات الثقيلة، محركات السيارات، صمامات حقول البترول، الماكينات الصناعية الضخمة.',
    descriptionEn: 'Extruded high-tensile aluminum sheet with perimeter seat-tracks and heavy-duty nylon tie-down restraint net for bulky loads.',
    descriptionAr: 'صفيحة ألمنيوم عالية المقاومة مزودة بحواف تثبيت قياسية وشباك نيلون قوية لإحكام ربط الحمولات الضخمة والشاذة.',
    dimensionsEn: '318 × 244 × 163–244 cm (125 × 96 in)',
    dimensionsAr: '318 × 244 × 163–244 سم (125 × 96 بوصة)',
    // Lower-deck contour build height (163 cm) is the conservative planning case.
    internalCm: { lengthCm: 312, widthCm: 238, heightCm: 163 },
  },
  {
    id: 'uld-rkn',
    code: 'RKN',
    categoryEn: 'Active Temperature-Controlled (Biopharma)',
    categoryAr: 'حاوية دوائية نشطة بالتحكم الإلكتروني',
    nameEn: 'RKN Active Envirotainer e1/t2',
    nameAr: 'حاوية RKN النشطة لحفظ الأمصال والأدوية',
    tareWeightKg: 650,
    maxGrossWeightKg: 1588,
    volumeCbm: 2.93,
    activeCooling: true,
    tempRangeEn: '+2°C to +8°C / +15°C to +25°C (±0.5°C)',
    tempRangeAr: '+2°م إلى +8°م أو +15°م إلى +25°م (بدقة ±0.5°م)',
    compatibleAircraft: ['Boeing 777F', 'Boeing 787', 'Airbus A350', 'Airbus A330'],
    recommendedCargoEn: 'Insulin, biological vaccines, blood plasma, oncology therapeutics, clinical trial kits.',
    recommendedCargoAr: 'الأنسولين، اللقاحات البيولوجية، بلازما الدم، علاجات الأورام، مستحضرات التجارب السريرية.',
    descriptionEn: 'Advanced electrical compressor cooling and electrical heating system. Eliminates dry ice sublimation hazards and ensures GDP audit compliance.',
    descriptionAr: 'مزودة بضاغط تبريد كهربائي وتدفئة آلية ذاتية، تمنع مخاطر غاز ثاني أكسيد الكربون الناتج عن الثلج الجاف وتضمن الامتثال لـ GDP.',
    dimensionsEn: '156 × 153 × 162 cm (Holds 1 Euro Pallet)',
    dimensionsAr: '156 × 153 × 162 سم (تستوعب منصة يورو واحدة)',
    internalCm: { lengthCm: 122, widthCm: 97, heightCm: 122 },
  },
  {
    id: 'uld-rap',
    code: 'RAP',
    categoryEn: 'High-Capacity Active Cold-Chain ULD',
    categoryAr: 'حاوية تبريد دوائي عملاقة عالية السعة',
    nameEn: 'RAP Active Envirotainer e2 Multi-Pallet',
    nameAr: 'حاوية RAP العملاقة للشحن الدوائي متعدد المنصات',
    tareWeightKg: 1200,
    maxGrossWeightKg: 6033,
    volumeCbm: 8.2,
    activeCooling: true,
    tempRangeEn: '0°C to +25°C Active Climate Management',
    tempRangeAr: '0°م إلى +25°م إدارة مناخية نشطة',
    compatibleAircraft: ['Boeing 777-200F/300ER', 'Boeing 747-8F', 'Airbus A350-900', 'Airbus A330'],
    recommendedCargoEn: 'Bulk pharmaceutical shipments, commercial vaccine batches, biopharma API raw materials.',
    recommendedCargoAr: 'الشحنات الدوائية السائبة، دفعات اللقاحات القومية، المواد الفعالة الحساسة (APIs).',
    descriptionEn: 'Among the largest active temperature-controlled ULDs in service. Accommodates up to 5 Euro-pallets or 4 US-pallets with redundant cooling.',
    descriptionAr: 'من أكبر الحاويات المبردة النشطة المستخدمة في الشحن الجوي، تستوعب حتى 5 منصات يورو أو 4 منصات أمريكية مع نظام تبريد احتياطي.',
    dimensionsEn: '318 × 224 × 162 cm (Holds 5 Euro Pallets)',
    dimensionsAr: '318 × 224 × 162 سم (تتسع لـ 5 منصات يورو)',
    internalCm: { lengthCm: 300, widthCm: 206, heightCm: 130 },
  },
];

export function findUld(id: string | null): ULDContainer | null {
  if (!id) return null;
  return ULD_FLEET.find((u) => u.id === id) ?? null;
}

export interface UldFitInput {
  /** Dimensions of one piece, in cm. */
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  /** Gross scale weight of one piece, in kg. */
  grossWeightKg: number;
  /** Identical piece count. */
  pieces: number;
  /** True when the consignment needs an actively cooled (GDP) unit. */
  requiresCoolChain: boolean;
}

/**
 * Practical stowage ceiling. Rectangular pieces never tessellate a contoured
 * shell perfectly, and nets/spacers consume envelope, so a unit is considered
 * full at 90% of its rated internal volume (standard broken-stowage reserve).
 */
export const BROKEN_STOWAGE_LIMIT = 0.9;

/**
 * Assesses one ULD against a consignment of identical pieces.
 *
 * Orientation rule: pieces may be rotated in the horizontal plane
 * (length/width swap) but not tipped on their side — air cargo is built
 * "this way up" unless a shipper explicitly certifies otherwise.
 */
export function assessUldFit(uld: ULDContainer, input: UldFitInput): UldFitAssessment {
  const blockers: UldFitBlocker[] = [];
  const { lengthCm, widthCm, heightCm, grossWeightKg, pieces, requiresCoolChain } = input;

  if (requiresCoolChain && !uld.activeCooling) {
    blockers.push('NO_ACTIVE_COOLING');
  }

  const { lengthCm: il, widthCm: iw, heightCm: ih } = uld.internalCm;
  const footprintFits =
    (lengthCm <= il && widthCm <= iw) || (widthCm <= il && lengthCm <= iw);
  if (!footprintFits || heightCm > ih) {
    blockers.push('PIECE_TOO_LARGE');
  }

  const netPayloadKg = uld.maxGrossWeightKg - uld.tareWeightKg;
  const totalWeightKg = pieces * grossWeightKg;
  const payloadUtilizationPct = Number(((totalWeightKg / netPayloadKg) * 100).toFixed(1));
  if (totalWeightKg > netPayloadKg) {
    blockers.push('OVER_PAYLOAD');
  }

  const totalVolumeCbm = (pieces * lengthCm * widthCm * heightCm) / 1_000_000;
  const volumeUtilizationPct = Number(((totalVolumeCbm / uld.volumeCbm) * 100).toFixed(1));
  if (totalVolumeCbm > uld.volumeCbm * BROKEN_STOWAGE_LIMIT) {
    blockers.push('OVER_VOLUME');
  }

  return {
    uld,
    fits: blockers.length === 0,
    blockers,
    volumeUtilizationPct,
    payloadUtilizationPct,
    netPayloadKg,
  };
}

/**
 * Assesses the whole fleet and picks the best unit: the smallest fitting
 * container (least rated volume), because flying unused envelope is paid-for
 * air. Ties broken by higher volume utilization.
 */
export function recommendUld(input: UldFitInput): UldRecommendation {
  const assessments = ULD_FLEET.map((uld) => assessUldFit(uld, input));
  const fitting = assessments
    .filter((a) => a.fits)
    .sort(
      (a, b) =>
        a.uld.volumeCbm - b.uld.volumeCbm ||
        b.volumeUtilizationPct - a.volumeUtilizationPct,
    );
  return { assessments, best: fitting[0] ?? null };
}
