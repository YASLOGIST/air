/**
 * YASLOGIST AIR — Corridor reference data
 *
 * Moved out of CorridorsAir.tsx so the volumetric simulator and the corridor
 * browser read the same numbers. Distances and frequencies were duplicated
 * across the two before, which is how they drift apart.
 *
 * Air distances are great-circle to CAI. Sea distances are sailing distances
 * over the actual routing and are deliberately unrelated to them — see
 * SeaLaneBenchmark. Schedule ranges are indicative of published liner
 * services, not a quoted transit time.
 */

import type { AirCorridor } from '../types/air-freight';

export const AIR_CORRIDORS: AirCorridor[] = [
  {
    id: 'corridor-fra-cai',
    code: 'FRA ⇄ CAI',
    fromIata: 'FRA',
    fromCityEn: 'Frankfurt, Germany',
    fromCityAr: 'فرانكفورت، ألمانيا',
    toIata: 'CAI',
    toCityEn: 'Cairo, Egypt',
    toCityAr: 'القاهرة، مصر',
    distanceKm: 2910,
    flightTimeEn: '4h 15m Block Time',
    flightTimeAr: '4 ساعات و15 دقيقة',
    weeklyFrequencies: 18,
    primaryCargoEn: 'German biopharma, oncology drugs, MRI medical systems, automotive engineering parts.',
    primaryCargoAr: 'الأدوية البيولوجية الألمانية، علاجات الأورام، أنظمة الرنين المغناطيسي، قطع غيار المحركات.',
    strategicSignificanceEn: 'The primary humanitarian & industrial healthcare lifeline connecting Central European production directly to Egyptian healthcare distribution.',
    strategicSignificanceAr: 'الشريان الدوائي والصناعي الرئيسي الرابط بين مراكز الإنتاج الطبية في وسط أوروبا ومنظومة الرعاية الصحية المصرية.',
    carrierEn: 'Lufthansa Cargo / EgyptAir Cargo Alliance',
    carrierAr: 'تحالف لوفتهانزا للشحن / مصر للطيران للشحن الجوي',
    // Frankfurt is inland; the competing sea move stages through Hamburg.
    seaLane: {
      originPortEn: 'Hamburg',
      originPortAr: 'هامبورغ',
      destPortEn: 'Alexandria',
      destPortAr: 'الإسكندرية',
      seaDistanceKm: 6400,
      portToPortDaysMin: 16,
      portToPortDaysMax: 21,
    },
  },
  {
    id: 'corridor-dxb-cai',
    code: 'DXB ⇄ CAI',
    fromIata: 'DXB',
    fromCityEn: 'Dubai, UAE',
    fromCityAr: 'دبي، الإمارات',
    toIata: 'CAI',
    toCityEn: 'Cairo, Egypt',
    toCityAr: 'القاهرة، مصر',
    distanceKm: 2420,
    flightTimeEn: '3h 35m Block Time',
    flightTimeAr: '3 ساعات و35 دقيقة',
    weeklyFrequencies: 28,
    primaryCargoEn: 'Cross-border e-commerce, express documents, courier consolidations, re-exported luxury goods.',
    primaryCargoAr: 'التجارة الإلكترونية الإقليمية، البريد السريع، الطرود المجمعة، الإلكترونيات والسلع المعاد تصديرها.',
    strategicSignificanceEn: 'Regional high-frequency fulfillment corridor supporting same-day and next-day consumer goods velocity across the MENA trade axis.',
    strategicSignificanceAr: 'محور التجارة والتوزيع السريع الإقليمي الداعم لسرعة تدفق بضائع التجارة الإلكترونية والتسليم في اليوم التالي.',
    carrierEn: 'Emirates SkyCargo / EgyptAir / Flydubai Cargo',
    carrierAr: 'الإمارات للشحن الجوي / مصر للطيران / فلاي دبي للشحن',
    seaLane: {
      originPortEn: 'Jebel Ali',
      originPortAr: 'جبل علي',
      destPortEn: 'Port Said',
      destPortAr: 'بورسعيد',
      seaDistanceKm: 6300,
      portToPortDaysMin: 11,
      portToPortDaysMax: 15,
      routingCaveatEn: 'Assumes Red Sea and Suez transit.',
      routingCaveatAr: 'بافتراض العبور عبر البحر الأحمر وقناة السويس.',
    },
  },
  {
    id: 'corridor-ams-cai',
    code: 'AMS ⇄ CAI',
    fromIata: 'AMS',
    fromCityEn: 'Amsterdam (Schiphol), Netherlands',
    fromCityAr: 'أمستردام (شيفول)، هولندا',
    toIata: 'CAI',
    toCityEn: 'Cairo, Egypt',
    toCityAr: 'القاهرة، مصر',
    distanceKm: 3280,
    flightTimeEn: '4h 40m Block Time',
    flightTimeAr: '4 ساعات و40 دقيقة',
    weeklyFrequencies: 14,
    primaryCargoEn: 'Fresh Egyptian horticultural exports (strawberries, green beans, flowers) northbound; diagnostic reagents southbound.',
    primaryCargoAr: 'الصادرات الزراعية المصرية الطازجة (الفراولة، الزهور، الخضروات) شمالاً؛ والكواشف المخبرية جنوباً.',
    strategicSignificanceEn: 'Crucial cool-chain agricultural export corridor connecting Nile Delta growers directly to the European flower and fresh produce auctions.',
    strategicSignificanceAr: 'ممر التصدير الزراعي فائق الأهمية الرابط لمزارع الدلتا مع بورصات الزهور والأغذية الطازجة الأوروبية.',
    carrierEn: 'Air France KLM Cargo / EgyptAir Cargo',
    carrierAr: 'إير فرانس كيه إل إم للشحن / مصر للطيران للشحن',
    seaLane: {
      originPortEn: 'Rotterdam',
      originPortAr: 'روتردام',
      destPortEn: 'Alexandria',
      destPortAr: 'الإسكندرية',
      seaDistanceKm: 6300,
      portToPortDaysMin: 15,
      portToPortDaysMax: 19,
      // The reason this corridor flies at all.
      routingCaveatEn: 'Perishable horticulture cannot use this lane; shelf life is shorter than the sailing.',
      routingCaveatAr: 'الحاصلات الزراعية الطازجة لا تحتمل هذا المسار؛ عمرها التخزيني أقصر من زمن الإبحار.',
    },
  },
  {
    id: 'corridor-pvg-cai',
    code: 'PVG ⇄ CAI',
    fromIata: 'PVG',
    fromCityEn: 'Shanghai (Pudong), China',
    fromCityAr: 'شنغهاي (بودونغ)، الصين',
    toIata: 'CAI',
    toCityEn: 'Cairo, Egypt',
    toCityAr: 'القاهرة، مصر',
    distanceKm: 8350,
    flightTimeEn: '10h 20m Long-Haul',
    flightTimeAr: '10 ساعات و20 دقيقة (شحن بعيد المدى)',
    weeklyFrequencies: 12,
    primaryCargoEn: 'Advanced microelectronics, smartphone components, solar panel inverters, high-value optical components.',
    primaryCargoAr: 'المكونات الإلكترونية الدقيقة، قطع الهواتف الذكية، محولات الطاقة الشمسية، الألياف الضوئية المتقدمة.',
    strategicSignificanceEn: 'Industrial high-tech supply line feeding electronics manufacturing, telecommunications infrastructure, and renewable energy plants in Egypt.',
    strategicSignificanceAr: 'خط الإمداد التقني الصناعي الذي يغذي مصانع الإلكترونيات والبنية التحتية للاتصالات والطاقة المتجددة بمصر.',
    carrierEn: 'China Cargo Airlines / EgyptAir Long-Range Cargo',
    carrierAr: 'الخطوط الصينية للشحن / مصر للطيران للشحن بعيد المدى',
    seaLane: {
      originPortEn: 'Shanghai',
      originPortAr: 'شنغهاي',
      destPortEn: 'Port Said',
      destPortAr: 'بورسعيد',
      seaDistanceKm: 15000,
      portToPortDaysMin: 26,
      portToPortDaysMax: 32,
      routingCaveatEn: 'Assumes Suez transit. Cape of Good Hope routing adds roughly 10–14 days.',
      routingCaveatAr: 'بافتراض العبور عبر السويس. التحويل حول رأس الرجاء الصالح يضيف نحو 10 إلى 14 يوماً.',
    },
  },
];

export const DEFAULT_CORRIDOR_ID = AIR_CORRIDORS[0].id;

export function findCorridor(id: string | null): AirCorridor | null {
  if (!id) return null;
  return AIR_CORRIDORS.find((c) => c.id === id) ?? null;
}
