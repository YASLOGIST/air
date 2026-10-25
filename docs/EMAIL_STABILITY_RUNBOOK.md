# YASLOGIST — بريد الشركة: التشخيص والتحصين (Email Stability Runbook)

> **الهدف:** جعل `yaslogist.com` بريدًا مستقرًا تمامًا: استقبال لا ينقطع، إرسال لا يذهب
> للـ Spam، ومناعة ضد انتحال الدومين — مع إثبات قابل للتكرار لكل خطوة.
>
> **آخر فحص:** 2026-10-25 · **الدومين:** `yaslogist.com` · **الصندوق:** `ceo@yaslogist.com`
> **الأداة:** `npm run check:email` (تقرأ DNS الحقيقي وتُخرج pass/warn/fail)

---

## 1) التصميم الحالي كما هو مُثبت بالفحص

```
                         ┌──────────────────────────┐
   بريد داخل → MX        │  Zoho Mail (mx.zoho.com) │   يستقبل كل بريد الدومين
   mail to yaslogist.com │  MX 10 / 20 / 50         │
                         └────────────┬─────────────┘
                                      │ Zoho Email Routing (forward)
                                      ▼
                         ┌──────────────────────────┐
                         │ Google Workspace          │  صندوق ceo@ + الإرسال
                         │ DKIM: google._domainkey ❌ │  ← الناقص
                         └──────────────────────────┘
   إرسال من Zoho (founder@) → DKIM zmail (1024-bit ⚠) + SPF pass → موقّع ومقبول
```

هذا يُسمّى **Split Delivery**: الاستقبال عند Zoho، والصندوق عند Google. وقد أثبتت
رسالة `founder@ → ceo@` أن المسار يعمل:

| الترويسة | القيمة المرصودة | المعنى |
|---|---|---|
| `Received-SPF` | `pass … client-ip=165.173.182.65` | Zoho يمرّر بعد اجتياز SPF |
| `DKIM` | `pass header.i=@yaslogist.com header.s=zmail` | توقيع Zoho صالح ومُطابِق للدومين |
| `ARC` | `pass (i=1 spf=pass … dkim=pass)` | سلاسل التمرير سليمة (لأن التمرير يكسر SPF الأصلي) |
| `DMARC` | `pass (p=NONE)` | يمر حاليًا — لكن بفضل SPF/DKIM لا بفضل السياسة |

**نتيجة اختبار الحلقة الكاملة (2026-10-25):** رسالة من `ceo@` إلى `ceo@` عادت
**داخليًا داخل Google** (`Received: … gmailapi.google.com with HTTPREST`) ولم تمر
على Zoho إطلاقًا — لأن Google يسلّم بريد المستخدمين المعروفين داخليًا ويتجاوز MX.
**المعنى:** البريد الداخلي لا يعتمد على قاعدة التمرير؛ **الخارجي الوارد فقط** هو الذي
يعتمد عليها. لذلك المراقبة في §7 يجب أن تكون من مُرسل خارجي (Gmail شخصي أو خدمة
اختبار)، لا من داخل الدومين.

**الخلاصة:** الأساس سليم. الناقص ليس "إصلاح عطل" بل **إغلاق ثلاث ثغرات** تجعل
الإعداد يبدو ناجحًا الآن وينكسر لاحقًا بلا إنذار.

---

## 2) الثغرات الثلاث + الحل الدقيق

| # | الثغرة | لماذا تهم | الأولوية |
|---|---|---|---|
| 1 | لا يوجد `google._domainkey` | كل رسالة تُرسل من Gmail باسم `ceo@yaslogist.com` تخرج **بلا أي توقيع DKIM** وتعتمد على تطابق SPF وحده (يمر الآن). أول تمرير أو قائمة بريدية بعدها يكسر SPF، ولا يوجد توقيع ينقذ الرسالة → فشل DMARC عند المستلم النهائي | 🔴 عالية |
| 2 | `DMARC p=none` بلا `rua=` | لا أحد يستطيع انتحال الدومين؟ لا: **أي أحد يستطيع**، ولن يصلك تقرير واحد | 🟠 متوسطة |
| 3 | مفتاح Zoho DKIM بـ **1024-bit** | المعيار 2048؛ المفاتيح القصيرة عرضة للتحليل ومعرّضة للرفض من مستقبلات صارمة | 🟡 منخفضة-متوسطة |
| 4 | لا `MTA-STS` ولا `TLS-RPT` | يمكن إسقاط TLS في النقل (strip attack) بلا أي إنذار | 🟡 اختيارية |
| 5 | SPF عند 6/10 lookups | سليم الآن، لكن كل `include` جديد يقربك من `permerror` الذي يُفشل **كل** البريد | ℹ️ مراقبة |

**تأكيد مهم عن SPF:** الفحص تعمّق في `include:zoho.com` و`include:_spf.google.com`
وكلاهما يستخدم `ip4/ip6` مسطّحة (لا includes داخلية). أي: **6 lookups من 10**، سجل
واحد فقط، ينتهي بـ `~all`. لا تلمسه، ولا تُضف سجل SPF ثانيًا أبدًا (سجلان = permerror).

---

## 3) ⚠️ ترتيب التنفيذ إلزامي (هنا يقع أغلب الناس)

> **لا تُشدّد DMARC قبل تفعيل Google DKIM.**
>
> DMARC يمر إذا تطابق **نطاق** التوقيع أو نطاق SPF مع نطاق `From`. وبما أن الـ MX
> عند Zoho، فإن Google يرسل بريد ceo@ بصدفة `ceo@yaslogist.com` (لا `google.com`)،
> فيحدث تطابق SPF **ويمر DMARC اليوم** رغم غياب DKIM. الخطر ليس في الإرسال المباشر،
> بل في أول تمرير/قائمة بريدية/وسيط: ينكسر SPF ولا يوجد توقيع بديل → تفشل الرسالة
> عند المستلم، وقد تُرفض إن كان سياسته `reject`.
> لذلك: Google DKIM أولًا → تحقق منه → راقب التقارير → ثم شدّد تدريجيًا.

| المرحلة | الإجراء | البوابة (لا تنتقل قبلها) |
|---|---|---|
| **0** | أمن الحساب + تنظيف الصندوق + مراقبة | لا تسجيل دخول مجهول |
| **1** | `rua/ruf` في DMARC مع بقاء `p=none` | `npm run check:email` بلا fail |
| **2** | **Google DKIM** + نشره | `google._domainkey` = 2048-bit |
| **3** | Zoho DKIM → 2048 | `zmail._domainkey` = 2048-bit |
| **4** | 2–4 أسابيع تقارير نظيفة ثم `p=quarantine` بـ `pct=25` ↑ | نسبة نجاح ≥ 99% |
| **5** | `p=reject` + `MTA-STS enforce` | 30 يومًا بلا انحدار |

---

## 4) السجلات الجاهزة للنسخ (DNS عند Vercel)

> **قيمة مرجعية للتراجع:** احتفظ بما هو منشور الآن قبل أي تغيير — مذكور في §10.

### 4.1 DMARC — أضف التقارير وابقِ السياسة مرنة (المرحلة 1)

| Type | Name | Value |
|---|---|---|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@yaslogist.com; ruf=mailto:dmarc@yaslogist.com; fo=1; adkim=r; aspf=r; pct=100; ri=86400` |

* **استبدل** السجل الحالي `v=DMARC1; p=none; adkim=r; aspf=r` — لا تضف سجلًا ثانيًا (DMARC يتطلب واحدًا).
* `rua` = تقارير مجمّعة (XML يومي) · `ruf` = تقارير فشل (فورية) · `fo=1` = أبلغ عن أي فشل.
* إن لم ترغب في إنشاء `dmarc@` بعد، استخدم `mailto:ceo@yaslogist.com` مؤقتًا — لكن صندوق `dmarc@` (كـ alias يمرّر إلى ceo@) أنظف ويُسهّل التصفية.

### 4.2 Google Workspace DKIM (المرحلة 2) — القيمة تُولَّد عندك

1. `admin.google.com` → **Apps** → **Google Workspace** → **Gmail** → **Authenticate email**.
2. اختر الدومين `yaslogist.com` → **Generate new record** → طول المفتاح **2048**.
3. انسخ الاسم/القيمة كما يعرضهما Google:

| Type | Name | Value |
|---|---|---|
| `TXT` | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A…` (من لوحة Google) |

4. عُد للوحة Google واضغط **Start authentication** (بدونها لا يُوقّع Google شيئًا).
5. تحقق: `npm run check:email` → يجب أن يظهر `[ok] DKIM google._domainkey · RSA 2048-bit`.

> لا تُدخل قيمة من مثال أو من الإنترنت — مفتاحك الخاص فقط.

### 4.3 Zoho DKIM → 2048-bit (المرحلة 3)

1. `mailadmin.zoho.com` → **Email Authentication** → **DKIM** → الدومين `yaslogist.com`.
2. **أضف/جدّد** الـ selector `zmail` واختر 2048-bit (إن لم تظهر الخيارات، افتح تذكرة Zoho لترقية المفتاح — الحساب يبقى يعمل بالمفتاح الحالي حتى الاستبدال).
3. استبدل قيمة `zmail._domainkey` الحالية بالجديدة.
4. **لا تحذف السجل القديم قبل نشر الجديد**؛ Zoho يقبل توقيعين خلال فترة الانتقال.

### 4.4 MTA-STS + TLS-RPT (المرحلة 5)

الملف `public/.well-known/mta-sts.txt` موجود في هذا المستودع (ويُنسخ إلى `dist/`)،
وهو مضبوط على `mode: testing` و`max_age: 86400`:

```
version: STSv1
mode: testing
mx: mx.zoho.com
mx: mx2.zoho.com
mx: mx3.zoho.com
max_age: 86400
```

ليصبح فعّالًا يلزم **مضيف فرعي** `mta-sts.yaslogist.com` (لأن البروتوكول يفرض هذا الاسم):

| Type | Name | Value |
|---|---|---|
| `CNAME` | `mta-sts` | `cname.vercel-dns.com` |
| `TXT` | `_mta-sts` | `v=STSv1; id=20261025T120000Z` |
| `TXT` | `_smtp._tls` | `v=TLSRPTv1; rua=mailto:tlsrpt@yaslogist.com` |

* أضف `mta-sts.yaslogist.com` إلى نفس مشروع Vercel (Project → Domains) ليُصدر شهادة
  ويخدم الملف على `https://mta-sts.yaslogist.com/.well-known/mta-sts.txt`.
* **كل تعديل في الملف يتطلب تغيير `id`** وإلا تجاهلت المستقبلات السياسة الجديدة.
* بعد أسبوعين بلا مشاكل: `mode: enforce` و`max_age: 604800` ثم حدّث `id`.
* `rua` يجب أن يكون صندوقًا موجودًا (`tlsrpt@` كـ alias إلى ceo@) وإلا فالتقارير تُرفض.

### 4.5 لا تلمس هذه

| السجل | القيمة الحالية | ملاحظة |
|---|---|---|
| SPF (`@`) | `v=spf1 include:zoho.com include:_spf.google.com ~all` | 6/10 lookups — سليم. أي include جديد يستلزم حذف آخر |
| MX | `10 mx.zoho.com`, `20 mx2.zoho.com`, `50 mx3.zoho.com` | يعمل — أي تغيير هنا يغيّر مستقبل البريد كله |
| CAA | `letsencrypt.org`, `sectigo.com`, `pki.goog` | يسمح لـ Vercel (Let's Encrypt) وGoogle بإصدار الشهادات — جيد |
| `google-site-verification` | سجلان مختلفان | غير ضار؛ يمكن حذف الأقدم |

---

## 5) قرار المعمار: Zoho أم Google كمستقبل أساسي؟

الوضع الحالي (Zoho يستقبل ← يمرّر إلى Google) **يعمل ومُثبت**، لكن نقطة انقطاعه
واحدة: قاعدة التمرير. إن تعطّلت أو انتهى اشتراك Zoho، يتوقف وصول بريد ceo@
والدومين يبدو سليمًا في كل الفحوص.

| الخيار | متى تختاره | التكلفة |
|---|---|---|
| **أ. إبقاء Split Delivery (موصى به الآن)** | أنت تعمل داخل Gmail وتريد Zoho كواجهة/أرشيف | صفر — فقط راقب (المراقبة في §7) |
| **ب. نقل MX إلى Google** | تريد مصدرًا واحدًا للحقيقة، وصندوقك هو Gmail فقط | يجب أولًا إنشاء/نقل **كل** العناوين كـ users/aliases في Google (`contact@`, `support@`, `founder@`, `operations@`) وإلا رجعت البريد بـ 550. ثم MX واحد: `1 smtp.google.com` |
| **ج. إبقاء Zoho كمضيف أساسي وإلغاء Google** | Google Workspace مكلف وغير مستخدم فعليًا | تفقد مزايا Workspace (Drive/Meet/إدارة) |

**التوصية:** أبقِ (أ) الآن، ونفّذ المراقبة الآلية. الترحيل مشروع تحويل عناوين
لا "تغيير سجل"، ولا يُنفَّذ في يوم عمل مزدحم.

---

## 6) الأمن (أعلى أولوية — بند منفصل عن البريد)

وصل تنبيه في **23 أكتوبر**: *«An 8-digit backup code was used to sign in»* إلى
`ceo@yaslogist.com`، ومتبقٍ 9 أكواد. اسأل نفسك سؤالًا واحدًا: **هل هذا أنت؟**

**إن لم يكن أنت:**
1. `myaccount.google.com/security` → *Recent security activity* → راجع الأجهزة والـ IP.
2. **غيّر كلمة المرور فورًا** ثم *Sign out of all devices*.
3. ألغِ الأكواد الاحتياطية وولّد مجموعة جديدة (تُحفظ خارج البريد).
4. راجع `admin.google.com` → Users → Security → سجّل الدخول خلال 24 ساعة.
5. راجع Zoho: `accounts.zoho.com` → Security → Sessions، وفعّل 2FA و**App Passwords**.
6. راجع قواعد التمرير في Zoho: `Mail Admin → Email Routing` — أي قاعدة غريبة = تسريب بريد.

**في الحالتين (أنت أو غيرك):**
* استبدل الأكواد الاحتياطية بـ **Authenticator/TOTP** أو Security Key.
* فعّل **2-Step Verification إلزاميًا** لكل مستخدمي الدومين (Google Admin → Security → 2SV enforcement).
* أضف **super admin ثانٍ** حتى لا يتحول فقدان جهاز واحد إلى فقدان الدومين.

---

## 7) المراقبة: لا تعتمد على "شكل الإعداد"

أضفت لهذا المستودع:

| الملف | الوظيفة |
|---|---|
| `scripts/email-health-check.mjs` | يقرأ MX/SPF/DKIM/DMARC/MTA-STS/TLS-RPT الحيّة، يقيس lookups، ويفكّ مفتاح DKIM ليعرف 1024 أم 2048، ويطبع pass/warn/fail |
| `scripts/email-health-check.test.mjs` | 9 اختبارات بلا شبكة تحمي أدوات الفحص وسياسة MTA-STS |
| `.github/workflows/email-health.yml` | تشغيل أسبوعي (اثنين 06:00 UTC) + يدوي، ويرفع تقرير JSON |

> **قيد مهم:** الفحص أعلاه يقرأ DNS، ولا يثبت أن بريدًا **خارجيًا** يصل فعلًا إلى
> ceo@. أثبت اختبار الحلقة أن البريد الداخلي يتجاوز Zoho، لذا راقب الوصول من مُرسل
> خارجي (حساب Gmail شخصي أو خدمة مثل Healthchecks/uptime robot ترسل بريدًا يوميًا
> وتنبّه عند غيابه). هذا هو الفحص الوحيد الذي يمسك انقطاع قاعدة التمرير.
| `public/.well-known/mta-sts.txt` | سياسة MTA-STS جاهزة للنشر (نسخة مطابقة في `dist/`) |

```bash
npm run check:email                  # جدول مقروء
npm run check:email -- --json        # للأنظمة
npm run check:email -- --strict      # التحذيرات تُفشل البناء
```

**رمز الخروج:** `0` = سليم، `1` = يوجد FAIL (MX مفقود، SPF مكرر/متجاوز، DMARC مفقود).

**فحوص خارجية تكميلية (مرة واحدة بعد كل تغيير):**
1. أرسل رسالة إلى `https://www.mail-tester.com` — الهدف **10/10** مع `dkim=pass` و`d=yaslogist.com`.
2. `https://toolbox.googleapps.com/apps/checkmx/` لفحص MX/SPF/DKIM من منظور Google.
3. بعد تفعيل `rua`، راقب التقارير: أي مصدر `fail` يعني مرسلًا ينتحل الدومين أو جهازًا لا يوقّع.

---

## 8) صندوق ceo@ — ما طُبِّق فعليًا اليوم

| الإجراء | الحالة |
|---|---|
| إنشاء تصنيفات تشغيلية: `Clients`, `Operations`, `Finance`, `Vendors`, `System/Alerts` | ✅ تم |
| تعليم الرسائل التجريبية المتروكة في المهملات كمقروءة (كانت تُظهر unread زائفًا) | ✅ تم |
| اختبار وصول فعلي إلى `contact@yaslogist.com` و`support@yaslogist.com` | ✅ أُرسل — لا NDR |
| اختبار تحكّم إلى عنوان غير موجود (لقياس إن كان الـ bounce يصل أصلًا) | ⚠️ أُرسل — **لا NDR أيضًا** (انظر §9) |
| حذف رسائل الاختبار نهائيًا | ⬜ يدوي (Gmail → Trash → Empty) |

**ملاحظة عن `contact@` و`support@`:** الموقع يستخدمهما كـ `mailto:` فقط، بلا نموذج
ولا backend. إن لم يكونا صندوقين حقيقيين (أو catch-all) في Zoho، فرسائل العملاء
سترتد — وهذا أسوأ من عدم وجود عنوان. تأكد من `Mail Admin → Users` أو فعّل
**Catch-all** إلى صندوق مُراقَب.

**اجعل الردود تخرج من العنوان الصحيح (Send-as):**
Gmail → Settings → *Accounts and Import* → *Send mail as* → أضف `contact@yaslogist.com`:
SMTP `smtp.zoho.com` · port `465` (SSL) · username `contact@yaslogist.com` ·
password = **Zoho App Password** (وليس كلمة مرور الحساب). كرّرها لـ `support@`.
بهذا تبقى DKIM/Zoho مُطابِقة للدومين والرد يظهر بهوية القسم.

**فلاتر جاهزة (Gmail → Settings → Filters):**

| الشرط | الإجراء |
|---|---|
| `to:(contact@yaslogist.com)` | تطبيق `Clients` + نجم |
| `to:(support@yaslogist.com)` | تطبيق `Operations` |
| `has:attachment (filename:pdf OR filename:xlsx) (subject:(AWB OR invoice OR booking))` | تطبيق `Operations` |
| `from:(noreply OR no-reply OR notifications)` | تطبيق `System/Alerts` + تخطي Inbox |
| `subject:(invoice OR payment OR statement)` | تطبيق `Finance` |

---

## 9) سجل التنفيذ (مرجع للتراجع)

| التاريخ | الإجراء | النتيجة |
|---|---|---|
| 2026-10-25 | فحص DNS الكامل (MX/SPF/DKIM/DMARC/CAA/NS) | 4 pass · 7 warn · 0 fail |
| 2026-10-25 | تحليل ترويسات رسالة `founder@ → ceo@` | SPF/DKIM/ARC/DMARC كلها pass |
| 2026-10-25 | إرسال رسالتي تحقق إلى `contact@` و`support@` | لا NDR خلال دقائق |
| 2026-10-25 | إرسال probe لعنوان غير موجود (تحكّم) | **لا NDR بعد ٣ دقائق** — انظر الاستنتاج أدناه |
| 2026-10-25 | اختبار حلقة `ceo@ → ceo@` | عاد داخليًا عبر Google (تجاوز Zoho) — انظر §1 |
| 2026-10-25 | إضافة أدوات الفحص + سياسة MTA-STS + سكربت المراقبة | ✅ في المستودع |
| ⬜ | تنفيذ سجلات §4 (DNS) | يحتاج وصول لوحة DNS |
| ⬜ | تفعيل Google DKIM | يحتاج super admin |
| ⬜ | تدوير مفتاح Zoho | يحتاج Zoho Mail Admin |

### استنتاج اختبار التحكّم (مهم)

أُرسلت رسالة إلى عنوان غير موجود قطعًا (`air-check-control-20261025@yaslogist.com`)
وقورنت برسالتي `contact@` و`support@`: **لا واحدة منها أنتجت NDR.** الاحتمالان:

1. **Catch-all مُفعّل في Zoho** → كل عنوان غير معروف يُقبل ويُسلَّم لصندوق واحد.
   النتيجة: لا رسالة عميل تضيع، لكن أيضًا **لا إنذار** عند خطأ إملائي في عنوان،
   وقد يمتلئ صندوق الـ catch-all برسائل لا يقرأها أحد.
2. **Zoho يؤجّل الرفض** (نادر) — يظهر NDR لاحقًا.

**ما يجب فعله:** `Zoho Mail Admin → Mailbox → Catch-all` — تأكد أنه **مُفعّل** وأن
وجهته صندوق يقرأه إنسان. إن كان مُعطَّلًا، فعندها `contact@` و`support@` يجب أن
يكونَا صندوقين حقيقيين وإلا سترتد رسائل العملاء.
الفحص الحاسم الوحيد: افتح Zoho Mail وتحقق من وصول الرسائل الثلاث فعليًا.

### قيم التراجع (Snapshot قبل التغيير)

```
_dmarc.yaslogist.com      TXT  "v=DMARC1; p=none; adkim=r; aspf=r"
yaslogist.com (@)         TXT  "v=spf1 include:zoho.com include:_spf.google.com ~all"
zmail._domainkey          TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCk…"  (1024-bit)
yaslogist.com (@)         MX   10 mx.zoho.com · 20 mx2.zoho.com · 50 mx3.zoho.com
```

للتراجع عن أي خطوة: أعد نشر القيمة أعلاه، ثم `npm run check:email` للتأكيد.
تغيّر سجلات DNS ينتشر خلال دقائق (TTL الحالي 60 ثانية لسجلات البريد)، وDMARC
يحتاج حتى ساعة عند بعض المستقبلات.

---

## 10) ما نفّذته من هنا وما يحتاج وصولك

| البند | من ينفّذه | السبب |
|---|---|---|
| فحص DNS + الترويسات + تحليل المفاتيح | ✅ تم من هنا | قراءة عامة |
| تصنيفات الصندوق + تعليم كمقروء + اختبارات التسليم | ✅ تم من هنا | Gmail API |
| سكربت الفحص + الاختبارات + سياسة MTA-STS + Workflow | ✅ في هذا المستودع | كود |
| نشر سجلات DNS | ❌ يحتاجك | رمز Vercel المتاح لا يملك صلاحية إدارة الدومين (Access denied) |
| Google DKIM + إجبار 2SV | ❌ يحتاجك | Google Admin Console (super admin) |
| تدوير Zoho DKIM + تأكيد الصناديق + Catch-all | ❌ يحتاجك | Zoho Mail Admin |
| تفعيل مضيف `mta-sts` | ❌ يحتاجك | إضافة domain في Vercel + سجل CNAME |

---

## 11) قائمة تحقق نهائية

- [ ] أمن: تم التحقق من تسجيل الدخول بالكود الاحتياطي، وتغيير كلمة المرور إن لزم
- [ ] `dmarc@` و`tlsrpt@` موجودان (alias إلى ceo@)
- [ ] DMARC منشور بـ `rua/ruf` و`p=none`
- [ ] Google DKIM منشور + Start authentication
- [ ] Zoho DKIM 2048
- [ ] `npm run check:email` → بلا `[FAIL]` وبلا `[warn]` على DKIM
- [ ] `contact@` و`support@` صندوقان حقيقيان (أو catch-all) + Send-as في Gmail
- [ ] 2SV إلزامي لكل المستخدمين + super admin ثانٍ
- [ ] Workflow «Email health» أخضر أسبوعيًا
- [ ] بعد 2–4 أسابيع: `p=quarantine` ثم `p=reject`
- [ ] MTA-STS من `testing` إلى `enforce`
