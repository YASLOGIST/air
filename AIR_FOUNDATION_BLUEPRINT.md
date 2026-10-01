# YASLOGIST AIR — المخطط التأسيسي والمعماري الشامل (Foundation Blueprint)
**التاريخ:** سبتمبر 2026
**المسار المستهدف:** `air.yaslogist.com`
**الحالة:** تأسيس جديد من الصفر (Clean Slate) لضمان أعلى درجات الجودة والتناسق المؤسسي.

---

## 1. الرؤية التنفيذية والهدف الاستراتيجي (Strategic Purpose)

يمثل **YASLOGIST AIR** الجناح الجوي المتخصص في **الشحن فائق السرعة والشحنات الحرجة وعالية القيمة (Time-Critical & High-Value Freight)**.

### المشكلة التي يعالجها في السوق المصري والإقليمي:
- الطائرة تقطع المسافة بين فرانكفورت أو دبي والقاهرة في 3 إلى 5 ساعات، ولكن الشحنة تظل عالقة لـ **36 إلى 72 ساعة داخل قرية البضائع بمطار القاهرة الدولي (CAI)** بسبب الإجراءات الورقية لبوليصة الشحن (AWB)، وتأخر مطابقة أرقام الإفراج الجمركي المسبق (ACID / نافذة)، وغياب التنسيق مع شاحنات الاستلام.
- يحل YASLOGIST هذه الأزمة بـ:
  1. **المطابقة الرقمية المسبقة لبوالص الشحن (e-AWB Pre-Clearance)** بالتكامل مع المعايير الدولية (IATA ONE Record) ومنظومة "نافذة" المصرية.
  2. **تتبع سلاسل التبريد الحساسة لحظة بلحظة (Cold-Chain Pharma Monitoring)** من بطن الطائرة وحتى غرف التبريد بقرية البضائع.
  3. **الربط الفوري مع أسطول النقل البري (Air-to-Land Handshake)** لتستلم شاحنات `land.yaslogist.com` الشحنة من بوابة المطار دون أي هدر زمني.

---

## 2. الهيكل التقني وأدوات البناء (Tech Stack)

تم اختيار أحدث وأخف حزمة تقنية لتكون متطابقة في الأداء مع بقية فروع المنصة:
- **المحرك الأساسي:** `Vite 7` + `React 19` + `TypeScript 5.9`.
- **نظام التنسيق:** `Tailwind CSS 4` (CSS-first token architecture) لضمان أقصى سرعة تحميل.
- **الحركات والواجهات التفاعلية:** `Framer Motion` للحركات الانسيابية، و`lucide-react` للأيقونات الهندسية.
- **إدارة اللغة والاتجاه:** نظام محلي خفيف يدعم التبديل الفوري بين الإنجليزية والعربية (`LTR` / `RTL`) مع احترام التباعد المنطقي.
- **نظام المظهرين:** دعم كامل للمظهر الداكن الفاخر (Stratosphere Dark) والمظهر الفاتح المريح (Aero Daylight) مع حفظ التفضيل في `localStorage` ومنع الوميض.

---

## 3. شجرة الملفات المقترحة للمشروع (Directory Structure)

```text
air/
├── package.json                   # إعدادات الحزم والاعتماديات الصرفة
├── vite.config.ts                # ضبط البناء والنشر السحابي
├── tsconfig.json                 # إعدادات TypeScript الصارمة
├── index.html                    # البوابة الأساسية مع سكريبت منع وميض المظهر
├── public/
│   ├── favicon.ico
│   └── assets/                   # أيقونات، شعارات متجهة، ومخططات الطيران
└── src/
    ├── index.css                 # توكنات الألوان الفولاذية ونظام الزجاج
    ├── main.tsx                  # نقطة الانطلاق
    ├── App.tsx                   # المكون الجذري
    ├── components/
    │   ├── NavbarAir.tsx         # شريط التنقل الشامل المشترك مع باقي المنصات
    │   ├── HeroAir.tsx           # هيدر التحليق الجوي وشريط التيليميتري الحي
    │   ├── FlightRadarHUD.tsx    # شاشة تتبع مسار الرحلات وزاوية الارتفاع
    │   ├── CargoSimAir.tsx       # محاكي الوزن الحجمي وانبعاثات الطيران
    │   ├── ULDSelector.tsx       # مستعرض ومحدد حاويات التحميل الجوي النشطة
    │   ├── CargoVillageFlow.tsx  # مخطط قرية البضائع بمطار القاهرة والتسليم البري
    │   ├── CorridorsAir.tsx      # شرايين الشحن الجوي الحيوية لمصر
    │   ├── StatsAir.tsx          # عدادات الأداء والمعايير الصادقة
    │   ├── HandshakeAirToLand.tsx # مكون التسليم البصري الفوري لنهاية الصفحة
    │   ├── LegalModalAir.tsx     # الشروط والتوافق مع لوائح الطيران المدني
    │   └── FooterAir.tsx         # التذييل وبيانات التواصل الموحدة مع المؤسس
    ├── lib/
    │   ├── i18n.tsx              # قاموس النصوص الثنائي (EN / AR) عالي الدقة
    │   ├── theme.tsx             # محرك المظهرين (داكن / فاتح)
    │   └── air-math.ts           # المعادلات الفيزيائية واللوجستية لحسابات الشحن
    └── types/
        └── air-freight.ts        # تعريفات TypeScript لكافة كائنات الشحن الجوي
```

---

## 4. المواصفات التفصيلية للمكونات والشاشات التفاعلية (The Wow Factor)

### أ. هيدر التحليق والتيليميتري الجوي (`HeroAir.tsx` & `FlightRadarHUD.tsx`)
- **المظهر البصري:** خلفية تدرج طبقات الجو العليا (Stratosphere) مع خطوط أفق طيران دقيقة وشبكة إحداثيات رادارية.
- **شريط التيليميتري التفاعلي المباشر:**
  - استعراض حي لمحاكاة رحلة قادمة إلى مطار القاهرة:
    - `Flight ID:` **MS-552** (Cargo Operator)
    - `Route:` **Frankfurt (FRA) → Cairo (CAI)**
    - `Altitude:` **FL380 (38,000 FT)** | `Ground Speed:` **485 KTS**
    - `Cargo Status:` **ULD RKN-7821 · Active Pharma Cooling: +4.2°C (STABLE)**
    - `ETA CAI:` **14:45 UTC · Runway 05L Assigned**

### ب. محاكي الشحن الجوي وحساب الوزن الحجمي (`CargoSimAir.tsx`)
**هذه الأداة هي قلب الإبهار الهندسي والعملي:**
- في الشحن الجوي، لا يدفع العميل دائماً بناءً على الوزن الفعلي فقط؛ بل تحسب شركات الطيران التكلفة بناءً على **الوزن الخاضع للرسوم (Chargeable Weight)** وهو الأكبر بين:
  1. الوزن الفعلي (Gross Weight بالكيلوجرام).
  2. الوزن الحجمي (Volumetric Weight بالسنتيمتر المكعب):
     $$	ext{Volumetric Weight (kg)} = \frac{	ext{Length} 	imes 	ext{Width} 	imes 	ext{Height (cm)}}{6000}$$
- **كيف يعمل المحاكي:**
  - يتيح للمستخدم إدخال الأبعاد وسحب مؤشر الوزن الفعلي.
  - يبرز المحاكي بصرياً فور تحريك المؤشر: هل الشحنة **ثقيلة وكثيفة (High-Density / Billed on Weight)** أم **ضخمة الحجم خفيفة الوزن (Voluminous / Billed on Volume)**.
  - حساب انبعاثات الكربون الجوية وفق إطار GLEC / EN 16258 مع مقارنتها ببدائل النقل البحري لتوضيح معادلة (السرعة مقابل الاستدامة).

### ج. مستعرض حاويات الشحن الجوي الذكية (`ULDSelector.tsx`)
عرض تفاعلي لأشكال ومواصفات حاويات ومنصات الطائرات (Unit Load Devices):
1. **AKE (LD3):** الحاوية القياسية الأكثر استخداماً في عنابر الطائرات عريضة البدن لنقل الطرود التجارية وقطع الغيار.
2. **PMC Pallet:** منصة الشحن ذات الشباك العلوية المخصصة للمعدات الضخمة والسلع سريعة الشحن.
3. **RKN / RAP Envirotainer:** حاوية الشحن الدوائي ذات التحكم الإلكتروني النشط في درجات الحرارة ومولدات التبريد الذاتية لحماية الأدوية واللقاحات الحساسة.

### د. مسار قرية البضائع بمطار القاهرة والتسليم البري (`CargoVillageFlow.tsx`)
مخطط تفاعلي يُظهر خطوة بخطوة كيف تعالج المنصة الشحنة فور هبوطها لتسليمها لشبكة النقل البري:
1. **الهبوط على المهبط (Touchdown):** وصول الطائرة إلى مطار القاهرة الدولي.
2. **النقل الآمن (Tarmac to Cool-Chain):** سحب الحاوية فوراً إلى غرف التبريد المخصصة بمستودعات المطار وتفادي الوقوف تحت حرارة الشمس.
3. **المطابقة الرقمية (Digital Pre-Clearance):** مطابقة بوليصة الشحن الجوي الإلكترونية (e-AWB) ورقم التسجيل المسبق (ACID) عبر نافذة.
4. **التسليم لبوابة الشاحنات البرية (Gate-Out to Reefer Truck):** خروج الشحنة لبوابة الشاحنات المتصلة بـ `land.yaslogist.com` للانطلاق للمصنع أو المستودع النهائي.

### هـ. شبكة الممرات الجوية الاستراتيجية لمصر (`CorridorsAir.tsx`)
أربعة ممرات ملاحية جوية تخدم الواقع التجاري المصري بدقة:
1. **Frankfurt (FRA) ⇄ Cairo (CAI):** شريان المستحضرات الدوائية واللقاحات والمعدات الطبية الألمانية وقطع الغيار الهندسية.
2. **Dubai (DXB) ⇄ Cairo (CAI):** محور الشحن السريع الإقليمي، والبريد السريع، والتجارة الإلكترونية العاجلة.
3. **Amsterdam (AMS) ⇄ Cairo (CAI):** ممر الصادرات الزراعية الطازجة، والزهور، والمنتجات البيولوجية سريعة التلف.
4. **Shanghai / Guangzhou (PVG/CAN) ⇄ Cairo (CAI):** شريان الرقائق الإلكترونية والمكونات التقنية فائقة القيمة.

### و. بطاقات الأداء والمعايير الصادقة (`StatsAir.tsx`)
أرقام صادقة تعبر عن الدقة الهندسية والامتثال للمعايير:
- **1:6 CBM Standard:** مطابقة معيار IATA العالمي للوزن الحجمي للشحن الجوي الدولي.
- **< 180 Min:** زمن الاستجابة والفرز المستهدف من المهبط حتى بوابة الخروج في الشحنات الحرجة.
- **±0.5°C Sensor Logging:** دقة تسجيل مستشعرات التبريد المباشرة لضمان عدم كسر سلسلة التبريد الدوائي.
- **IATA ONE Record:** التوافق الكامل مع المعيار العالمي الحديث لتبادل البيانات اللوجستية بدون أوراق.

---

## 5. نظام التصميم والألوان (Design System Tokens)

- **اللون المميز الأساسي:** **الأزرق الفولاذي والسحابي (`#9BB0BC` - Aero Steel)** مع لمسات من **أزرق الارتفاعات العالية (`#38bdf8`)**.
- **الخلفية الداكنة:** كربون ستراتوسفير (`#0A0F16`) يمنح هيبة منصات الطيران العالمية.
- **الطباعة:**
  - اللاتينية: `Archivo` (العناوين الكبرى) و `IBM Plex Sans` (النصوص).
  - العربية: `Aref Ruqaa` (العناوين المميزة) و `IBM Plex Sans Arabic` (النصوص والمحاور).
  - الأرقام والإحداثيات والرموز: `IBM Plex Mono`.

---

## 6. المعادلات الرياضية للشحن الجوي (`src/lib/air-math.ts`)

```typescript
/**
 * YASLOGIST AIR — Logistics Mathematical Engine
 */

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
  billingBasis: 'GROSS_WEIGHT' | 'VOLUMETRIC_WEIGHT';
  estimatedCo2Tonnes: number;
  freightClass: 'DENSE_HEAVY' | 'VOLUMINOUS_LIGHT';
}

export function calculateAirFreight(input: AirCalculationInput): AirCalculationOutput {
  const { lengthCm, widthCm, heightCm, grossWeightKg, distanceKm } = input;

  // 1. حساب الحجم بالمتر المكعب (CBM)
  const volumeCbm = Number(((lengthCm * widthCm * heightCm) / 1_000_000).toFixed(3));

  // 2. حساب الوزن الحجمي وفق معيار IATA (قاسم 6000)
  const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 6000).toFixed(1));

  // 3. تحديد الوزن الخاضع للرسوم (الأكبر بينهما)
  const chargeableWeightKg = Math.max(grossWeightKg, volumetricWeightKg);
  const billingBasis = grossWeightKg >= volumetricWeightKg ? 'GROSS_WEIGHT' : 'VOLUMETRIC_WEIGHT';
  const freightClass = grossWeightKg >= volumetricWeightKg ? 'DENSE_HEAVY' : 'VOLUMINOUS_LIGHT';

  // 4. حساب انبعاثات الكربون الجوية (عامل نموذجي من GLEC / EN 16258: ~0.50 كجم CO2 لكل طن/كم للشحن الجوي العريض)
  const tonneKm = (chargeableWeightKg / 1000) * distanceKm;
  const estimatedCo2Tonnes = Number((tonneKm * 0.000502).toFixed(2));

  return {
    volumeCbm,
    volumetricWeightKg,
    chargeableWeightKg,
    billingBasis,
    estimatedCo2Tonnes,
    freightClass,
  };
}
```

---

## 7. التصميم التفصيلي لقسم التسليم التفاعلي في نهاية الصفحة (Multi-Modal Visual Handshake Component)

لتحقيق الانتقال البصري الانسيابي وتسليم الشحنة من الجو إلى البر، يوضع مكون تفاعلي قبل الفوتر مباشرة بعنوان `HandshakeAirToLand.tsx`:

### أ. الفكرة البصرية للمكون:
- بعد أن يتابع الزائر هبوط الطائرة وخروج الطرد الدوائي الحرج من قرية البضائع بمطار القاهرة، تنتهي الصفحة ببطاقة زجاجية أفقية عريضة بتوهج فولاذي (`#9BB0BC` / `#38bdf8`) تحت عنوان:
  **"اكتمال رحلة الجو: الشحنة تنتقل إلى شاحنة التبريد البرية (Cargo Village Clear → Ground Reefer Active)"**.
- **المؤشرات الحية داخل البطاقة:**
  - `AWB Cleared:` بوليصة الشحن الجوي مستوفاة ومعتمدة.
  - `Cold-Chain Maintained:` درجة حرارة الشحنة +4.1°م مستقرة داخل الحاوية.
  - `Next Stage:` التحميل الفوري على مقطورة مبردة متصلة بنظام النقل البري.
- **زر الانتقال التفاعلي (Call to Action):**
  - زر مميز ينقل الزائر مباشرة إلى منصة الشحن البري:
    **[ تتبع الشحنة على شبكة الطرق البرية عبر land.yaslogist.com ← ]**
  - هذا الربط يختم زيارة صفحة الشحن الجوي بتقديم الدليل الملموس على أن الشحنة لا تتوقف، بل تنتقل بسلاسة إلى أسطول النقل البري.

---

## 8. خارطة التنفيذ الميدانية لـ `air` (Execution Checklist)

- [ ] **الخطوة 1:** تهيئة هيكل المشروع وملفات التكوين (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`).
- [ ] **الخطوة 2:** بناء نظام التصميم والألوان في `src/index.css` وقاموس اللغتين في `src/lib/i18n.tsx`.
- [ ] **الخطوة 3:** تنفيذ شاشة الهيدر والرادار الملاحي `HeroAir.tsx` و `FlightRadarHUD.tsx`.
- [ ] **الخطوة 4:** بناء محاكي الوزن الحجمي التفاعلي `CargoSimAir.tsx` ومستعرض حاويات `ULDSelector.tsx`.
- [ ] **الخطوة 5:** بناء مخطط قرية البضائع بمطار القاهرة والتسليم البري `CargoVillageFlow.tsx`.
- [ ] **الخطوة 6:** إضافة الممرات الجوية الاستراتيجية `CorridorsAir.tsx` وشاشات الأداء `StatsAir.tsx`.
- [ ] **الخطوة 7:** إضافة مكون التسليم النهائي التفاعلي `HandshakeAirToLand.tsx` وشريط التنقل الشامل (Global Ecosystem Bar).
