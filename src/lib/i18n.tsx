import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Language } from '../types/air-freight';

const STORAGE_KEY = 'yaslogist-air-lang';

export interface Dict {
  brand: {
    name: string;
    subdomain: string;
    tagline: string;
    badge: string;
    modelBadge: string;
    modelBadgeDesc: string;
  };
  nav: {
    hero: string;
    radar: string;
    simulator: string;
    uld: string;
    cargoVillage: string;
    corridors: string;
    stats: string;
    landLink: string;
    trackAwb: string;
    toggleLang: string;
    toggleTheme: string;
    ecosystem: {
      corporate: string;
      ocean: string;
      land: string;
      air: string;
    };
  };
  hero: {
    badge: string;
    titlePrimary: string;
    titleAccent: string;
    subtitle: string;
    ctaSim: string;
    ctaRadar: string;
    telemetryBar: {
      flight: string;
      route: string;
      altitude: string;
      speed: string;
      temp: string;
      eta: string;
      status: string;
      statusValue: string;
    };
  };
  radar: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    terminalLabel: string;
    targetAirport: string;
    runwayAssignment: string;
    transponder: string;
    heading: string;
    verticalSpeed: string;
    airTrafficMode: string;
    cargoIdentity: string;
    awbNumber: string;
    acidNumber: string;
    pharmaCooling: string;
    tempLog: string;
    stable: string;
    excursion: string;
    approachingWaypoint: string;
    livePing: string;
  };
  simulator: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    dimensions: string;
    length: string;
    width: string;
    height: string;
    grossWeight: string;
    distance: string;
    chargeableWeight: string;
    volumetricWeight: string;
    actualWeight: string;
    cbm: string;
    basisLabel: string;
    basisGross: string;
    basisVolumetric: string;
    densityClass: string;
    denseTitle: string;
    voluminousTitle: string;
    denseDesc: string;
    voluminousDesc: string;
    iataFormulaNotice: string;
    co2Metric: string;
    co2Flight: string;
    co2Ocean: string;
    tradeoffTitle: string;
    tradeoffDesc: string;
    transitAir: string;
    transitOcean: string;
  };
  uld: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    specsTitle: string;
    tare: string;
    maxWeight: string;
    volume: string;
    activeCoolingBadge: string;
    passiveBadge: string;
    aircraftSuitability: string;
    recommendedCargo: string;
    filterAll: string;
    filterPharma: string;
    filterGeneral: string;
  };
  cargoVillage: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    cairoAirportNotice: string;
    timeSavedBadge: string;
    steps: {
      touchdown: {
        title: string;
        subtitle: string;
        desc: string;
        metric: string;
        compliance: string;
      };
      tarmacCool: {
        title: string;
        subtitle: string;
        desc: string;
        metric: string;
        compliance: string;
      };
      preClearance: {
        title: string;
        subtitle: string;
        desc: string;
        metric: string;
        compliance: string;
      };
      gateOut: {
        title: string;
        subtitle: string;
        desc: string;
        metric: string;
        compliance: string;
      };
    };
  };
  corridors: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    weeklyFlights: string;
    flightDuration: string;
    distance: string;
    primaryCommodities: string;
    corridorRole: string;
  };
  stats: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    stat1: { value: string; label: string; desc: string };
    stat2: { value: string; label: string; desc: string };
    stat3: { value: string; label: string; desc: string };
    stat4: { value: string; label: string; desc: string };
  };
  handshake: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    cardHeadline: string;
    statusAwb: string;
    statusCold: string;
    statusNext: string;
    ctaLand: string;
    ctaSubtext: string;
  };
  legal: {
    modalTitle: string;
    termsTitle: string;
    privacyTitle: string;
    securityTitle: string;
    nonCarrierNotice: string;
    closeBtn: string;
  };
  footer: {
    tagline: string;
    contactHeading: string;
    phone: string;
    email: string;
    address: string;
    founderLabel: string;
    founderName: string;
    copyright: string;
    termsLink: string;
    privacyLink: string;
    securityLink: string;
  };
  cinematic: {
    phase01Kicker: string;
    phase01Title: string;
    phase01Body: string;
    hudFlight: string;
    hudRoute: string;
    hudFl: string;
    hudTemp: string;
    phase02Kicker: string;
    phase02Title: string;
    phase02Body: string;
    hudRunway: string;
    phase03Kicker: string;
    phase03Title: string;
    phase03Body: string;
    hudDwell: string;
    scrubHint: string;
  };
  mission: {
    kicker: string;
    title: string;
    items: string[];
  };
  stance: {
    headline: string;
    body: string;
  };
  tracker: {
    kicker: string;
    title: string;
    subtitle: string;
    placeholder: string;
    search: string;
    samples: string;
    notFound: string;
    commodity: string;
    uld: string;
    acid: string;
    eawb: string;
    chargeable: string;
    dwell: string;
    eta: string;
  };
}

export const DICTIONARY: Record<Language, Dict> = {
  en: {
    brand: {
      name: 'YASLOGIST AIR',
      subdomain: 'air.yaslogist.me',
      tagline: 'High-Velocity Cargo & Cold-Chain Telemetry',
      badge: 'Time-Critical Aviation Logistics',
      modelBadge: 'Interactive Model · Digital Twin Simulation',
      modelBadgeDesc: 'Telemetry and operations simulated for demonstration purposes under IATA and Egyptian Customs frameworks.',
    },
    nav: {
      hero: 'Overview',
      radar: 'Flight Telemetry',
      simulator: 'Volumetric Engine',
      uld: 'ULD Fleet',
      cargoVillage: 'Cargo Village Hub',
      corridors: 'Aero Corridors',
      stats: 'Standards',
      landLink: 'To Land Freight',
      trackAwb: 'Validate AWB',
      toggleLang: 'العربية',
      toggleTheme: 'Toggle Theme',
      ecosystem: {
        corporate: 'Corporate Hub',
        ocean: 'Ocean Freight',
        land: 'Land Logistics',
        air: 'Air Freight',
      },
    },
    hero: {
      badge: 'Aero-Speed Operations · Cairo Hub (CAI)',
      titlePrimary: 'PRECISION AIR FREIGHT',
      titleAccent: 'AT TRANSONIC SPEED',
      subtitle:
        'Resolving the 48-hour Cairo Cargo Village bottleneck. Synchronized e-AWB pre-clearance with Egyptian Nafeza ACID and continuous real-time pharma cold-chain monitoring directly from tarmac to land reefer fleet.',
      ctaSim: 'Launch Volumetric Simulator',
      ctaRadar: 'View Live Flight HUD',
      telemetryBar: {
        flight: 'CARGO FLIGHT',
        route: 'SECTOR',
        altitude: 'ALTITUDE',
        speed: 'GROUND SPEED',
        temp: 'COLD-CHAIN SENSOR',
        eta: 'CAI TOUCHDOWN',
        status: 'DISPATCH STATUS',
        statusValue: 'TARMAC READY',
      },
    },
    radar: {
      sectionBadge: 'Live Aviation Telemetry',
      title: 'Real-Time Flight Vector & Sensor HUD',
      subtitle:
        'Continuous surveillance of critical cargo in transit between European hubs and Cairo International Airport Cargo Village.',
      terminalLabel: 'CAI TERMINAL 3 CARGO DISPATCH',
      targetAirport: 'Cairo Int’l (HECA / CAI)',
      runwayAssignment: 'Assigned Runway 05L',
      transponder: 'Transponder (Mode S)',
      heading: 'HEADING',
      verticalSpeed: 'V/S DESCENT',
      airTrafficMode: 'En-route Control: Cairo Air Control Center (ACC)',
      cargoIdentity: 'HIGH-VALUE PHARMACEUTICAL CONSIGNMENT',
      awbNumber: 'AWB 077-94821031',
      acidNumber: 'ACID 2026000994108770001',
      pharmaCooling: 'Active Pharma Temperature',
      tempLog: 'Logger: RKN-Active-Envirotainer (±0.5°C Precision)',
      stable: 'THERMALLY STABLE',
      excursion: 'TEMPERATURE EXCURSION',
      approachingWaypoint: 'Approaching Waypoint CVO VOR / ILS Inbound',
      livePing: 'AIR TELEMETRY FEED LIVE',
    },
    simulator: {
      sectionBadge: 'IATA TACT Volume Calculator',
      title: 'Air Freight Volumetric & Carbon Simulator',
      subtitle:
        'Chargeable weight under the IATA 1:6000 divisor, with carbon and transit modelled on GLEC Framework factors against the sea lane each corridor competes with.',
      dimensions: 'Package Dimensions (cm)',
      length: 'Length (cm)',
      width: 'Width (cm)',
      height: 'Height (cm)',
      grossWeight: 'Gross Scale Weight (kg)',
      distance: 'Flight Distance (km)',
      chargeableWeight: 'Chargeable Weight',
      volumetricWeight: 'Volumetric Weight (IATA)',
      actualWeight: 'Gross Weight',
      cbm: 'Total Volume (CBM)',
      basisLabel: 'Billing Basis',
      basisGross: 'Billed on Gross Weight (High Density)',
      basisVolumetric: 'Billed on Volumetric Weight (Light Density)',
      densityClass: 'Cargo Profile Classification',
      denseTitle: 'Dense & Compact Cargo',
      voluminousTitle: 'Voluminous & Light Cargo',
      denseDesc: 'Actual weight exceeds volumetric weight. Pricing is calculated directly per physical kilogram.',
      voluminousDesc: 'Volume occupies disproportionate aircraft hold space. In accordance with IATA rules, billing utilizes the 1:6 ratio.',
      iataFormulaNotice: 'Formula: (L × W × H in cm) ÷ 6,000 = Volumetric Weight (kg). Standardized across IATA member airlines.',
      co2Metric: 'Environmental Impact (GLEC Framework / EN 16258)',
      co2Flight: 'Estimated Air CO2',
      co2Ocean: 'Equivalent Ocean CO2',
      tradeoffTitle: 'Speed vs Sustainability Trade-Off',
      tradeoffDesc: 'Air freight provides immediate time advantage for shelf-life critical and urgent goods while generating higher specific carbon per tonne-km.',
      transitAir: 'Airport-to-Airport Block Time',
      transitOcean: 'Sea Transit, Port to Port',
    },
    uld: {
      sectionBadge: 'Aircraft Unit Load Devices',
      title: 'Smart ULD Container & Pallet Fleet',
      subtitle:
        'Standardized containers engineered to maximize widebody aircraft belly volume and safeguard sensitive consignments.',
      specsTitle: 'Container Specifications',
      tare: 'Tare Weight',
      maxWeight: 'Max Gross Weight',
      volume: 'Internal Volume',
      activeCoolingBadge: 'Active Climate Control',
      passiveBadge: 'Ambient Cargo Structure',
      aircraftSuitability: 'Compatible Aircraft Types',
      recommendedCargo: 'Optimized Cargo Categories',
      filterAll: 'All ULD Units',
      filterPharma: 'Pharma & Cold-Chain',
      filterGeneral: 'Commercial & High-Density',
    },
    cargoVillage: {
      sectionBadge: 'Airport Logistics Workflow',
      title: 'Cairo Cargo Village 4-Phase Rapid Flow',
      subtitle:
        'Cutting ground dwell at Cairo Airport by completing the e-AWB and Nafeza customs formalities before the aircraft departs, not after it lands.',
      cairoAirportNotice: 'Cairo International Airport (CAI) Cargo Village Gateway',
      timeSavedBadge: 'Target Ground Dwell: < 180 Minutes',
      steps: {
        touchdown: {
          title: 'Runway Touchdown & Ramp Marshaling',
          subtitle: 'Touchdown & Tarmac Marshalling',
          desc: 'Cargo aircraft arrives at Runway 05L/23R. Priority marshalling directs high-value ULDs directly from the belly hold via high-loader dolly.',
          metric: '15 min to apron offload',
          compliance: 'IATA Ramp Safety Standards',
        },
        tarmacCool: {
          title: 'Tarmac to Temperature-Controlled Vaults',
          subtitle: 'Shaded Transfer, No Open-Tarmac Dwell',
          desc: 'Pharma containers bypass open sun tarmac exposure into specialized +2°C to +8°C or +15°C to +25°C cool corridors within CAI Cargo Village.',
          metric: 'Continuous ±0.5°C Logging',
          compliance: 'GDP (Good Distribution Practice)',
        },
        preClearance: {
          title: 'Digital Pre-Clearance & Nafeza ACID Matching',
          subtitle: 'Automated Customs Release',
          desc: 'The e-AWB is matched against the Nafeza ACID registered before the aircraft departs. Duty is assessed and settled in advance, so the consignment is not held for paperwork after it lands.',
          metric: 'Filed pre-departure, released on arrival',
          compliance: 'Nafeza ACI / Egyptian Customs Law 207',
        },
        gateOut: {
          title: 'Direct Handshake to Land Fleet',
          subtitle: 'Gate-Out to Reefer Transport',
          desc: 'Immediate container loading onto dedicated refrigerated trucks connected to land.yaslogist.me for final distribution across Egypt.',
          metric: 'Immediate dispatch to highway',
          compliance: 'Air-to-Land Seamless SLA',
        },
      },
    },
    corridors: {
      sectionBadge: 'Strategic Air Lanes',
      title: 'Key Egyptian Air Freight Corridors',
      subtitle:
        'Connecting Egyptian manufacturing, agriculture, and healthcare to global trading partners with scheduled frequency.',
      weeklyFlights: 'Weekly Cargo Services',
      flightDuration: 'Average Flight Duration',
      distance: 'Great Circle Distance',
      primaryCommodities: 'Primary Flow Commodities',
      corridorRole: 'Strategic Economic Significance',
    },
    stats: {
      sectionBadge: 'Integrity & Verification',
      title: 'Engineered Standards & Measurable SLAs',
      subtitle: 'Transparent technical benchmarks reflecting operational discipline and compliance.',
      stat1: {
        value: '1:6 CBM',
        label: 'IATA Volumetric Ratio',
        desc: 'Strict compliance with 6,000 cm³/kg divisor for equitable billing.',
      },
      stat2: {
        value: '< 180 Min',
        label: 'Airport Ground Target',
        desc: 'Touchdown to highway gate-out duration for pre-cleared critical freight.',
      },
      stat3: {
        value: '±0.5°C',
        label: 'Sensor Accuracy',
        desc: 'Continuous real-time temperature loggers protecting life-saving biologics.',
      },
      stat4: {
        value: 'ONE Record',
        label: 'IATA Standard Ready',
        desc: 'Full data model interoperability for seamless paperless supply chains.',
      },
    },
    handshake: {
      sectionBadge: 'Multi-Modal Logistics Integration',
      title: 'Air-to-Land Seamless Handshake',
      subtitle: 'The aviation leg is complete. The shipment transitions immediately to the highway.',
      cardHeadline: 'Cairo Cargo Village Clear → Ground Reefer Transport Active',
      statusAwb: 'e-AWB & Nafeza ACID: Verified & Customs Released',
      statusCold: 'Cold-Chain Integrity: +4.2°C held, no excursion logged on this run',
      statusNext: 'Next Milestone: Direct Delivery to 10th of Ramadan Pharma Hub',
      ctaLand: 'Track Consignment on Land Network (land.yaslogist.me)',
      ctaSubtext: 'Continuous multimodal visibility across highway and distribution network.',
    },
    legal: {
      modalTitle: 'Regulatory Compliance & Operational Framework',
      termsTitle: 'Terms of Use & Aviation Scope',
      privacyTitle: 'Data Privacy & Telemetry Persistence',
      securityTitle: 'Platform Security & Integrity',
      nonCarrierNotice:
        'Notice of Scope: YASLOGIST AIR operates as an advanced digital twin, supply chain intelligence platform, and logistics orchestration system. It is not a direct air carrier, airline, freight forwarder, or customs broker. All flight information and metrics are digital simulations and analytical models.',
      closeBtn: 'Close Window',
    },
    footer: {
      tagline: 'High-Velocity Cargo & Cold-Chain Telemetry Engine',
      contactHeading: 'Corporate Air Logistics Desk',
      phone: '+20 104 113 9910',
      email: 'contact@yaslogist.me',
      address: 'New Cairo, Cairo, Egypt',
      founderLabel: 'Platform Architect & Founder',
      founderName: 'Ahmed Yasser Ali',
      copyright: '© 2026 YASLOGIST. All rights reserved.',
      termsLink: 'Terms & Conditions',
      privacyLink: 'Privacy Policy',
      securityLink: 'Security Protocols',
    },
    cinematic: {
      phase01Kicker: 'Phase 01 · Stratosphere Cruise',
      phase01Title: 'Stratosphere Airbridge & Transistor Velocity',
      phase01Body: 'Wide-body freighter cruising at FL380 on the Frankfurt/Dubai-to-Cairo airbridge with active cold-chain logging and pre-lodged ACID filings.',
      hudFlight: 'MS-552',
      hudRoute: 'FRA → CAI',
      hudFl: 'FL380',
      hudTemp: '+4.2°C',
      phase02Kicker: 'Phase 02 · Runway 05L Final Approach',
      phase02Title: 'Runway 05L Descent & Touchdown Precision',
      phase02Body: 'Glide slope capture into Cairo International Airport (CAI). Customs clearance commences before wheels contact tarmac.',
      hudRunway: '05L',
      phase03Kicker: 'Phase 03 · Cairo Cargo Village Rapid Ramp',
      phase03Title: 'Direct Reefer Gate-Out & Multi-Modal Transfer',
      phase03Body: 'Direct apron transfer to refrigerated trucks with active dwell clocks to eliminate tarmac delay.',
      hudDwell: '< 15 MIN',
      scrubHint: 'SCROLL TO SCRUB ARRIVAL / مرر الشاشة للتحكم بمسار الهبوط',
    },
    mission: {
      kicker: 'Engineered Operating Stance',
      title: 'Mission Architecture for Time-Critical Air Freight',
      items: [
        'Digital Pre-Clearance: Harmonizing IATA ONE Record with Egyptian Nafeza ACID before takeoff.',
        'Active Cold-Chain Custody: Unbroken 2–8°C thermal telemetry from aircraft belly to pharmaceutical distribution.',
        'Air-to-Land Multi-Modal Handshake: Transferring palletized cargo to heavy transport in under 15 minutes.'
      ],
    },
    stance: {
      headline: 'Architects of Cargo Velocity, Not Passive Capacity Resellers',
      body: 'YASLOGIST operates as an orchestrator of guaranteed transit windows. By locking strategic main-deck and lower-deck allocations across Tier-1 carriers and integrating customs pre-clearance, we convert air freight from an unpredictable tariff line into an auditable, clockwork supply pipeline.',
    },
    tracker: {
      kicker: 'Consignment Radar',
      title: 'Real-Time e-AWB Tracking & Customs Audit',
      subtitle: 'Inspect live consignment status, temperature excursions, and ACID registration numbers across active corridors.',
      placeholder: 'Enter Master AWB (e.g. 077-88442115)...',
      search: 'Inspect Consignment',
      samples: 'Active Live Samples:',
      notFound: 'No active shipment found matching this AWB number. Verify prefix and checksum.',
      commodity: 'Commodity',
      uld: 'Assigned ULD',
      acid: 'Nafeza ACID',
      eawb: 'e-AWB Status',
      chargeable: 'Chargeable Weight',
      dwell: 'Tarmac Dwell',
      eta: 'Estimated Arrival',
    },
  },
  ar: {
    brand: {
      name: 'ياسلوجست للشحن الجوي',
      subdomain: 'air.yaslogist.me',
      tagline: 'شحن فائق السرعة وتيليميتري سلاسل التبريد',
      badge: 'اللوجستيات الجوية للشحنات الحرجة',
      modelBadge: 'نموذج تفاعلي · محاكاة توأم رقمي',
      modelBadgeDesc: 'بيانات التيليميتري والرحلات معروضة لأغراض المحاكاة الرقمية وفق معايير IATA وقوانين الجمارك المصرية.',
    },
    nav: {
      hero: 'نظرة عامة',
      radar: 'رادار الرحلات',
      simulator: 'محاكي الحجم والوزن',
      uld: 'أسطول الحاويات ULD',
      cargoVillage: 'قرية البضائع',
      corridors: 'الممرات الجوية',
      stats: 'المعايير القياسية',
      landLink: 'إلى الشحن البري',
      trackAwb: 'فحص بوليصة e-AWB',
      toggleLang: 'English',
      toggleTheme: 'تبديل المظهر',
      ecosystem: {
        corporate: 'المركز الرئيسي',
        ocean: 'الشحن البحري',
        land: 'النقل البري',
        air: 'الشحن الجوي',
      },
    },
    hero: {
      badge: 'عمليات جوية فائقة السرعة · مطار القاهرة (CAI)',
      titlePrimary: 'دقة الشحن الجوي',
      titleAccent: 'بسرعة التحليق الترانزستورية',
      subtitle:
        'علاج معضلة مكوث البضائع لـ 48 ساعة بقرية بضائع مطار القاهرة. مطابقة مسبقة رقمية لبوالص e-AWB مع نظام نافذة (ACID) المصري، ومراقبة حية لسلاسل تبريد الأدوية الحساسة من المهبط وحتى الشاحنات المبردة.',
      ctaSim: 'تشغيل محاكي الوزن الحجمي',
      ctaRadar: 'استعراض شاشة الرادار والتيليميتري',
      telemetryBar: {
        flight: 'رحلة الشحن',
        route: 'المسار الملاحي',
        altitude: 'ارتفاع التحليق',
        speed: 'السرعة الأرضية',
        temp: 'مستشعر التبريد',
        eta: 'الهبوط بالقاهرة',
        status: 'جاهزية الاستلام',
        statusValue: 'جاهز للمهبط',
      },
    },
    radar: {
      sectionBadge: 'تيليميتري الملاحة الجوية المباشرة',
      title: 'شاشة الرادار وتتبع متجهات الرحلة',
      subtitle:
        'مراقبة مستمرة للشحنات الحرجة والأدوية فائقة القيمة أثناء عبورها بين المراكز الأوروبية وقرية بضائع مطار القاهرة الدولي.',
      terminalLabel: 'مركز ترحيل بضائع صالة 3 - مطار القاهرة',
      targetAirport: 'مطار القاهرة الدولي (HECA / CAI)',
      runwayAssignment: 'المدرج المخصص 05L',
      transponder: 'المستجيب الراداري (Mode S)',
      heading: 'الاتجاه المغناطيسي',
      verticalSpeed: 'معدل الهبوط V/S',
      airTrafficMode: 'التحكم الجوي: مركز القاهرة للمراقبة الجوية (ACC)',
      cargoIdentity: 'شحنة مستحضرات دوائية وبيولوجية فائقة الأهمية',
      awbNumber: 'بوليصة AWB 077-94821031',
      acidNumber: 'رقم نافذة ACID 2026000994108770001',
      pharmaCooling: 'درجة حرارة الشحنة الدوائية النشطة',
      tempLog: 'مسجل البيانات: حاوية RKN-Envirotainer بدقة ±0.5°م',
      stable: 'مستقرة حرارياً',
      excursion: 'انحراف حراري',
      approachingWaypoint: 'الاقتراب من نقطة CVO VOR / نظام الهبوط الآلي ILS',
      livePing: 'بث التيليميتري الملاحي متصل',
    },
    simulator: {
      sectionBadge: 'حاسبة IATA TACT القياسية',
      title: 'محاكي الوزن الحجمي وانبعاثات الكربون الجوية',
      subtitle:
        'احسب الوزن الخاضع للرسوم وفق معادلة الاتحاد الدولي للنقل الجوي (IATA) بقاسم 6000، مع نمذجة الانبعاثات وزمن العبور وفق معاملات إطار GLEC مقارنةً بالمسار البحري المنافس لكل ممر.',
      dimensions: 'أبعاد الطرد (سنتيمتر)',
      length: 'الطول (سم)',
      width: 'العرض (سم)',
      height: 'الارتفاع (سم)',
      grossWeight: 'الوزن الفعلي بالميزان (كجم)',
      distance: 'مسافة الرحلة الجوية (كم)',
      chargeableWeight: 'الوزن الخاضع للرسوم',
      volumetricWeight: 'الوزن الحجمي (معيار IATA)',
      actualWeight: 'الوزن الفعلي',
      cbm: 'إجمالي الحجم (متر مكعب)',
      basisLabel: 'أساس احتساب التكلفة',
      basisGross: 'يُحسب على الوزن الفعلي (كثافة عالية)',
      basisVolumetric: 'يُحسب على الوزن الحجمي (خفيف وضخم)',
      densityClass: 'تصنيف كثافة الشحنة',
      denseTitle: 'شحنة كثيفة وثقيلة',
      voluminousTitle: 'شحنة ضخمة وخفيفة الوزن',
      denseDesc: 'الوزن الفعلي أكبر من الحجمي؛ يتم احتساب السعر بناءً على الكيلوجرام الحقيقي مباشرة دون زيادة.',
      voluminousDesc: 'تشغل الشحنة حيزاً ضخماً في عنبر الطائرة مقارنة بوزنها، لذا يتم تطبيق معيار IATA (قاسم 6000) لحساب الوزن العادل.',
      iataFormulaNotice: 'المعادلة القياسية: (الطول × العرض × الارتفاع بالسم) ÷ 6000 = الوزن الحجمي بالكيلوجرام.',
      co2Metric: 'الأثر البيئي وانبعاثات الكربون (إطار GLEC / معيار EN 16258)',
      co2Flight: 'انبعاثات الطيران التقديرية',
      co2Ocean: 'انبعاثات الشحن البحري المقابلة',
      tradeoffTitle: 'معادلة المفاضلة: السرعة مقابل الاستدامة',
      tradeoffDesc: 'يوفر الشحن الجوي ميزة زمنية فورية للبضائع الحساسة والطارئة، في مقابل انبعاثات كربونية أعلى لكل طن/كم.',
      transitAir: 'زمن الطيران من مطار لمطار',
      transitOcean: 'زمن الإبحار من ميناء لميناء',
    },
    uld: {
      sectionBadge: 'حاويات ومنصات الطائرات القياسية',
      title: 'أسطول حاويات الشحن الجوي الذكية (ULD)',
      subtitle:
        'وحدات تحميل قياسية مصممة هندسياً لمطابقة بطن الطائرات عريضة البدن وتأمين الشحنات الأكثر حساسية.',
      specsTitle: 'المواصفات الفنية للحاوية',
      tare: 'وزن الحاوية فارغة',
      maxWeight: 'أقصى وزن إجمالي مسموح',
      volume: 'السعة الداخلية',
      activeCoolingBadge: 'تبريد نشط إلكتروني',
      passiveBadge: 'شحن بدرجات الحرارة العادية',
      aircraftSuitability: 'الطائرات المتوافقة',
      recommendedCargo: 'أنواع البضائع الموصى بها',
      filterAll: 'جميع الحاويات',
      filterPharma: 'الأدوية والتبريد',
      filterGeneral: 'البضائع العامة والكثيفة',
    },
    cargoVillage: {
      sectionBadge: 'دورة العمل بمطار القاهرة',
      title: 'المسار السريع بقرية البضائع (4 مراحل)',
      subtitle:
        'تقليص زمن المكوث بمطار القاهرة عبر استكمال بوليصة e-AWB والإجراءات الجمركية عبر نافذة قبل إقلاع الطائرة، لا بعد هبوطها.',
      cairoAirportNotice: 'بوابة قرية البضائع بمطار القاهرة الدولي (CAI)',
      timeSavedBadge: 'المستهدف الزمني: أقل من 180 دقيقة للإفراج',
      steps: {
        touchdown: {
          title: 'ملامسة المهبط والتوجيه للساحة',
          subtitle: 'الهبوط والتفريغ السريع',
          desc: 'وصول طائرة الشحن على المدرج 05L. تفريغ فوري لحاويات الشحن فائق الأهمية عبر رافعات الـ High-Loader المجهزة.',
          metric: '15 دقيقة للتفريغ من عنبر الطائرة',
          compliance: 'معايير IATA لسلامة ساحات الطيران',
        },
        tarmacCool: {
          title: 'النقل المحمي لمستودعات التبريد',
          subtitle: 'منع التعرض لحرارة الشمس المباشرة',
          desc: 'سحب حاويات الأدوية عبر ممرات محمية إلى غرف التبريد المخصصة (+2°م إلى +8°م) فوراً لمنع كسر سلسلة التبريد.',
          metric: 'تسجيل حراري مستمر بدقة ±0.5°م',
          compliance: 'معايير التوزيع الدوائي الجيد (GDP)',
        },
        preClearance: {
          title: 'المطابقة الرقمية المسبقة مع نظام نافذة (ACID)',
          subtitle: 'الإفراج الجمركي الآلي المسبق',
          desc: 'مطابقة بوليصة الشحن الإلكترونية e-AWB مع رقم التسجيل المسبق (ACID) المُصدر قبل إقلاع الطائرة، مع تقدير الرسوم وسدادها مقدماً، فلا تُحتجز الشحنة لاستكمال المستندات بعد الهبوط.',
          metric: 'تسجيل مسبق قبل الإقلاع، وإفراج عند الوصول',
          compliance: 'منظومة نافذة / قانون الجمارك المصري رقم 207',
        },
        gateOut: {
          title: 'التسليم المباشر لأسطول النقل البري المبرد',
          subtitle: 'الانطلاق إلى الوجهة النهائية',
          desc: 'تحميل الحاويات مباشرة على شاحنات مبردة متصلة بمنصة land.yaslogist.me للانطلاق الفوري إلى المصانع والمستودعات.',
          metric: 'انطلاق فوري لشبكة الطرق السريعة',
          compliance: 'تكامل لوجستي سلس بين الجو والبر',
        },
      },
    },
    corridors: {
      sectionBadge: 'شرايين الملاحة الجوية لمصر',
      title: 'الممرات الجوية الاستراتيجية للتجارة المصرية',
      subtitle:
        'ربط قطاعات التصنيع والزراعة والرعاية الصحية المصرية بأهم المراكز العالمية برحلات منتظمة وجداول دقيقة.',
      weeklyFlights: 'رحلات الشحن الأسبوعية',
      flightDuration: 'متوسط زمن التحليق',
      distance: 'المسافة الجوية المباشرة',
      primaryCommodities: 'أبرز السلع المشحونة',
      corridorRole: 'الأهمية الاقتصادية الاستراتيجية',
    },
    stats: {
      sectionBadge: 'الشفافية والامتثال للمعايير',
      title: 'معايير هندسية صادقة واتفاقيات مستوى خدمة صارمة',
      subtitle: 'أرقام تعكس الدقة التشغيلية والالتزام بالمعايير الدولية والمحلية.',
      stat1: {
        value: '1:6 CBM',
        label: 'معيار IATA للوزن الحجمي',
        desc: 'التزام كامل بقاسم 6000 سم³/كجم لاحتساب التكلفة العادلة.',
      },
      stat2: {
        value: '< 180 دقيقة',
        label: 'الهدف الزمني بالمطار',
        desc: 'من ملامسة المهبط وحتى الخروج من بوابة المطار للشحنات مسبقة الإفراج.',
      },
      stat3: {
        value: '±0.5°م',
        label: 'دقة أجهزة التبريد',
        desc: 'مستشعرات رقمية حية تحفظ سلامة الأدوية واللقاحات الحساسة.',
      },
      stat4: {
        value: 'ONE Record',
        label: 'جاهزية الربط الدولي',
        desc: 'توافق برمجي كامل مع معيار تبادل البيانات الرقمي الموحد لـ IATA.',
      },
    },
    handshake: {
      sectionBadge: 'التكامل اللوجستي متعدد الوسائط',
      title: 'التسليم الانسيابي من الجو إلى البر',
      subtitle: 'اكتملت رحلة الطيران، والشحنة تنتقل فوراً إلى شبكة الطرق البرية.',
      cardHeadline: 'اكتمال إجراءات قرية البضائع ← شاحنات التبريد البرية تبدأ الانطلاق',
      statusAwb: 'بوليصة e-AWB ورقم نافذة ACID: مستوفاة ومطابقة جمركياً بالكامل',
      statusCold: 'سلامة سلسلة التبريد: +4.2°م مستقرة، دون تسجيل أي انحراف حراري في هذه الرحلة',
      statusNext: 'المحطة القادمة: التسليم المباشر للمنطقة الصناعية بالعاشر من رمضان',
      ctaLand: 'تتبع الشحنة على شبكة النقل البري عبر land.yaslogist.me',
      ctaSubtext: 'رؤية لوجستية متعددة الوسائط متصلة بين المطارات والطرق السريعة.',
    },
    legal: {
      modalTitle: 'الامتثال التنظيمي والإطار التشغيلي لمنصة الطيران',
      termsTitle: 'شروط الاستخدام ونطاق خدمات الشحن الجوي',
      privacyTitle: 'سياسة الخصوصية وتخزين التيليميتري',
      securityTitle: 'معايير الأمان والنزاهة الرقمية',
      nonCarrierNotice:
        'إشعار النطاق والمسؤولية: تعمل منصة YASLOGIST AIR كتوأم رقمي متقدم، ونظام ذكاء اصطناعي لإدارة سلاسل الإمداد والتنسيق اللوجستي، وليست ناقلاً جوياً أو شركة طيران أو مخلصاً جمركياً مباشراً. كافة مسارات الطيران والتيليميتري المعروضة هي نماذج محاكاة رقمية لأغراض التدقيق والتخطيط اللوجستي.',
      closeBtn: 'إغلاق النافذة',
    },
    footer: {
      tagline: 'منظومة الشحن الجوي فائق السرعة وتيليميتري سلاسل التبريد',
      contactHeading: 'مكتب تنسيق اللوجستيات الجوية الموحد',
      phone: '+20 104 113 9910',
      email: 'contact@yaslogist.me',
      address: 'القاهرة الجديدة، القاهرة، مصر',
      founderLabel: 'المؤسس والمعماري التقني',
      founderName: 'أحمد ياسر علي',
      copyright: '© 2026 YASLOGIST. جميع الحقوق محفوظة.',
      termsLink: 'الشروط والأحكام',
      privacyLink: 'سياسة الخصوصية',
      securityLink: 'بروتوكولات الأمان',
    },
    cinematic: {
      phase01Kicker: 'المرحلة 01 · تحليق الستراتوسفير',
      phase01Title: 'جسر جوي عريض البدن عبر الستراتوسفير',
      phase01Body: 'طائرات الشحن عريضة البدن على ارتفاع 38,000 قدم تربط فرانكفورت ودبي بالقاهرة مع تسجيل متواصل لسلاسل التبريد وإيداع مسبق لبيانات الشحن.',
      hudFlight: 'MS-552',
      hudRoute: 'FRA → CAI',
      hudFl: 'FL380',
      hudTemp: '+4.2°C',
      phase02Kicker: 'المرحلة 02 · الاقتراب النهائي من مهبط 05L',
      phase02Title: 'محاذاة الهبوط والاقتراب النهائي على مهبط 05L',
      phase02Body: 'التقاط مسار الانحدار نحو مطار القاهرة الدولي مع إتمام بوالص الشحن الإلكترونية e-AWB مسبقاً، ليبدأ التخليص الجمركي قبل لمس المدرج.',
      hudRunway: '05L',
      phase03Kicker: 'المرحلة 03 · قرية البضائع بمطار القاهرة',
      phase03Title: 'تسليم فوري للمبردات وانتقال مباشر للنقل البري',
      phase03Body: 'تسليم فوري من ساحة المطار لأسطول الشاحنات المبردة مع مؤقتات مكوث إلكترونية تضمن الخروج في أقل من 15 دقيقة.',
      hudDwell: '< 15 دقيقة',
      scrubHint: 'مرر الشاشة للتحكم بمسار الهبوط والاقتراب',
    },
    mission: {
      kicker: 'الركائز التشغيلية الجوية',
      title: 'هندسة المهام للشحنات الحرجة وفائقة السرعة',
      items: [
        'المطابقة الرقمية المسبقة: مواءمة معايير IATA ONE Record مع منظومة نافذة وACID المصرية قبل الإقلاع.',
        'حراسة سلاسل التبريد النشطة: رصد حراري غير منقطع لنطاق 2–8°م من بطن الطائرة وحتى مستودعات التوزيع الدوائي.',
        'التسليم متعدد الوسائط الفوري: نقل الحاويات والمنصات لأسطول النقل البري في أقل من 15 دقيقة.'
      ],
    },
    stance: {
      headline: 'مهندسو سرعة الشحن الجوي، لا مجرد مسوقي سعة عابرين',
      body: 'تعمل ياسلوجست كمنسق مؤسسي لنوافذ الشحن المحجوزة مسبقاً. من خلال ضمان المساحات على متن كبرى خطوط الطيران والدمج الرقمي مع التخليص الجمركي المسبق، نحوّل الشحن الجوي من بند تكلفة غير متوقع إلى خط إمداد دقيق وقابل للتدقيق بالدقيقة.',
    },
    tracker: {
      kicker: 'رادار تتبع الشحنات الجوية',
      title: 'تتبع بوالص الشحن الجوي الإلكترونية والتدقيق الجمركي',
      subtitle: 'استعلم لحظياً عن حالة الشحنات وسجلات درجات الحرارة وأرقام ACID لمنظومة نافذة عبر الممرات الجوية.',
      placeholder: 'أدخل رقم بوليصة الشحن (مثال: 077-88442115)...',
      search: 'فحص الشحنة',
      samples: 'شحنات تجريبية نشطة:',
      notFound: 'لم يتم العثور على شحنة تطابق هذا الرقم. يرجى التحقق من الرقم وكود شركة الطيران.',
      commodity: 'طبيعة البضاعة',
      uld: 'حاوية التحميل (ULD)',
      acid: 'رقم قيد نافذة (ACID)',
      eawb: 'حالة البوليصة الإلكترونية',
      chargeable: 'الوزن الخاضع للرسوم',
      dwell: 'زمن المكوث على الساحة',
      eta: 'موعد الوصول المتوقع',
    },
  },
};

interface LanguageContextType {
  lang: Language;
  dict: Dict;
  isRtl: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') {
        return saved;
      }
    }
    return 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Unable to persist language', e);
    }
  }, [lang]);

  const toggleLang = () => {
    setLangState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dict: DICTIONARY[lang],
        isRtl: lang === 'ar',
        setLang,
        toggleLang,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLang must be used within a LanguageProvider');
  }
  return context;
};
