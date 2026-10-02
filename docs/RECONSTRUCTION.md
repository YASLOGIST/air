# Reconstruction, audit, and upgrade record

## Scope, classification, success

**Scope:** source checkout at commit `8b4496f`; authorization is assumed from the provided repository. No authentication, secrets, DRM, or third-party code was reverse-engineered. **Classification:** bilingual interactive marketing/tooling web app with logistics simulation and canvas-based 3D-style visualization.

**Success:** preserve the visual air-freight experience while making every operational claim clearly simulated, making the core tools testable and accessible, reducing initial JavaScript, enforcing security/performance gates, and enabling a newcomer to install and verify the project with one documented command.

**Visual decision:** rich motion and the ULD canvas genuinely support the aviation/digital-twin concept. They are retained, but reduced-motion remains honored and hero videos now preload metadata rather than both complete reels.

## Confirmed stack

| Finding | Status | Evidence |
|---|---|---|
| React 19 + TypeScript | CONFIRMED | `package.json`, `src/main.tsx` |
| Vite 6 + Tailwind CSS 4 | CONFIRMED | `package.json`, `vite.config.ts`, `src/index.css` |
| Static client-only deployment | CONFIRMED | no server entry point; all records are constants in components |
| English/Arabic and RTL | CONFIRMED | `src/lib/i18n.tsx` providers and root direction effect |
| Canvas pseudo-3D ULD renderer | CONFIRMED | `src/components/ULDViewer3D.tsx` |
| Vercel hosting | PROBABLE | Vercel Analytics and `vercel.json`; no deployment trace supplied |

## Architecture and flows

```mermaid
flowchart LR
  Browser --> Bootstrap[theme-init.js]
  Browser --> React[ThemeProvider / LanguageProvider]
  React --> Shell[Navbar + cinematic hero]
  Shell --> Sections[Lazy section modules]
  Sections --> Math[air-math.ts]
  Sections --> Local[local demo records/corridors]
  Sections --> Canvas[ULD canvas renderer]
  React --> Vercel[Vercel analytics]
```

```mermaid
sequenceDiagram
  actor U as User
  participant UI as Cargo simulator
  participant M as air-math
  U->>UI: change dimensions/weight/corridor
  UI->>M: validated numeric input
  M-->>UI: volume, chargeable weight, CO2, time
  U->>UI: export manifest
  UI-->>U: accessible modal / TXT / print
```

```mermaid
sequenceDiagram
  actor U as User
  participant A as AWB modal
  participant M as Mod-7 validator
  U->>A: enter AWB
  A->>M: normalized digits
  M-->>A: structural validity
  A-->>U: checksum result + explicit non-operational disclaimer
```

```mermaid
sequenceDiagram
  actor U as User
  participant T as Tracker
  participant D as Local samples
  U->>T: search sample identifier
  T->>D: exact/partial local lookup
  D-->>T: sample or no match
  T-->>U: demo telemetry or not-found (never synthesized)
```

## Testable behavior

- Freight inputs must all be finite and greater than zero; invalid trust-boundary values throw `RangeError`.
- Volumetric kg is `L×W×H/6000`; chargeable kg is the greater of gross and volumetric, with gross winning equality.
- AWBs accept only 11 digits after spaces/hyphens are removed; the seven-digit serial modulo 7 must equal the check digit.
- AWB validation never asserts booking, customs, or shipment status.
- Tracker searches only the four bundled demo records; an unknown identifier returns not-found and no generated telemetry.
- Theme and language persist locally and update `data-theme`, `lang`, and `dir`.
- Open dialogs trap focus, close on Escape/backdrop, lock body scroll, and restore focus.
- Reduced-motion disables decorative animation; JavaScript/CSS chunks must stay below 300,000/120,000 bytes.

## Evidence and unknowns

| Claim | Confidence | Evidence |
|---|---|---|
| App has no live logistics integration | CONFIDENT | datasets in `ConsignmentTracker.tsx`, `corridors.ts`; no fetch/API client |
| Existing unknown AWBs previously produced plausible fake telemetry | CONFIDENT | baseline `ConsignmentTracker.tsx` fallback branch, now removed |
| Baseline CSP was duplicated and inconsistent | CONFIDENT | baseline `index.html` meta and baseline `vite.config.ts` build injection |
| Hero loaded two large videos eagerly | CONFIDENT | baseline `CinematicStage.tsx` had two `preload="auto"` elements |
| Production headers are active on Vercel | PROBABLE | `vercel.json`; deployment response was not available locally |
| Asset redistribution rights | UNKNOWN | no repository license/source ledger; resolve by obtaining owner records |
| Real-device Core Web Vitals/FPS | UNKNOWN | no representative device/network lab in this checkout; resolve with deployed Lighthouse/RUM |

## Ranked baseline audit and closure

Impact/effort are 1–5. “Closed” means implemented and verified here.

| # | Finding | I/E | Resolution |
|---|---|---:|---|
| 1 | Unknown AWBs fabricated operational records | 5/1 | **Closed:** unknowns now fail closed; regression test added |
| 2 | Checksum UI implied customs pre-clearance | 5/1 | **Closed:** claims removed; explicit boundary and test added |
| 3 | No automated tests or CI | 5/3 | **Closed:** 7 tests plus CI type/build/a11y/perf/security gates |
| 4 | 6,361 generated dependency files tracked | 4/1 | **Closed:** removed from Git index; lockfile remains reproducible |
| 5 | Duplicate/inconsistent CSP; inline script exception | 4/2 | **Closed:** external bootstrap, single compatible policy, host headers |
| 6 | Monolithic initial application imports | 4/2 | **Closed:** feature modules lazy-loaded with suspense |
| 7 | Both 8.3 MB and 6.3 MB hero videos eagerly preloaded | 4/1 | **Closed:** metadata preload; posters and reduced-motion retained |
| 8 | Manifest dialog lacked focus management/semantics | 4/2 | **Closed:** dialog primitive, Escape, backdrop, focus restoration |
| 9 | Calculation API accepted NaN/Infinity/non-positive values | 4/1 | **Closed:** finite positive validation and edge tests |
| 10 | No onboarding, security headers, or budgets | 3/2 | **Closed:** README, `.env.example`, headers, scripted budgets |

## Upgrade capabilities

1. Downloadable plain-text simulation manifest (in addition to copy/print), generated locally.
2. Recoverable lazy section loading with a user-visible error boundary and loading skeleton.
3. Keyboard skip navigation and fully managed manifest/AWB dialog interactions.
4. Truth-preserving tracker and AWB tools that clearly distinguish demonstrations/checksums from live operational data.

## Verification: baseline versus final

| Measure | Baseline | Final |
|---|---:|---:|
| Automated tests | 0 | 7 passing across 3 files |
| Production dependency vulnerabilities | not gated | 0 reported by `npm audit --omit=dev` |
| Main JS, raw | 392,607 B | 287,948 B (26.7% lower) |
| Main JS, gzip (local gzip) | 115,401 B | 91,218 B (21.0% lower) |
| JS chunks | 1 | 31 (feature code deferred) |
| CSS, raw | 90,750 B | 107,569 B (within 120 KB budget; increase from testable lazy-class discovery/new focus UI) |
| Hero video preload | 14.55 MB eligible for eager preload | metadata-only requests; byte transfer is browser/server dependent |
| Tracked `node_modules` entries | 6,361 | 0 |
| Type errors | baseline check exposed 16+ unused-code errors | 0 |
| Motion fallback | present | retained; no animation added |
| FPS / LCP / INP / CLS | not measured | not asserted; requires deployed browser/device telemetry |

Total visual assets remain approximately 22 MB in `public/assets`; no new visual asset was added. The app’s visual design and interaction model were preserved rather than adding unmeasured effects.

## Remaining risks / externally blocked work

1. **Asset license attestation:** impossible from repository evidence; owner must provide source/license records before redistribution.
2. **Live carrier/customs integration:** impossible without approved APIs, contracts, credentials, schemas, and privacy requirements. The UI now fails closed instead.
3. **Production Core Web Vitals and 60 FPS proof:** impossible to establish from static/local evidence alone; requires a deployed URL, representative devices/networks, and RUM. Bundle/preload budgets are enforced meanwhile.
4. **Authoritative tariff/emissions validation:** coefficients are explicitly estimates in code; formal sign-off requires current licensed tariff and GLEC datasets plus domain review.

---

# Second pass — runtime cost, payload, and structural a11y

**Baseline for this pass:** commit `9ab57d0` (the state documented above), re-measured locally rather than assumed. `npm ci && npm run typecheck && npm test && npm run build && npm run check:bundle && npm audit --omit=dev` all passed before any change: 7 tests, 0 type errors, 0 production advisories.

## What this pass targeted

The previous pass fixed truthfulness, security headers, code-splitting and onboarding. It explicitly left runtime rendering cost unmeasured ("FPS … not asserted"). Three cost centres were found by reading the running code rather than by guessing, and all three are measurable without a browser lab:

| # | Finding | Evidence | Disposition |
|---|---|---|---|
| 1 | `tailwind-merge` shipped in the entry chunk for a single call site | `src/utils/cn.ts`; `cn(` appears exactly once in `src/` (`BrandAir.tsx:32`); 103 KB of source in `index-*.js.map` sources, second-largest after `react-dom` | **FIX NOW** — replaced with `clsx` alone |
| 2 | ULD canvas repainted the full scene 60×/s even when nothing changed | `ULDViewer3D.tsx` loop called `render()` on every frame with no state or time gate | **FIX NOW** — `src/lib/scene-loop.ts` policy + 4 deterministic tests |
| 3 | Hero easing loop never terminated | `CinematicStage.tsx` `tick()` unconditionally re-queued a frame and a `setProgress` React render for the session's lifetime | **FIX NOW** — stops when settled, restarts on scroll |
| 4 | Radar telemetry timers ran off-screen and in background tabs | two `setInterval`s in `FlightRadarHUD.tsx` with `[]`/`[isLiveActive]` deps, each re-rendering the section | **FIX NOW** — gated on `useInView` (viewport + `visibilitychange`) |
| 5 | 7.0 MB of `public/assets` media referenced by nothing | `Airyaslogist.png` (3.4 MB), `Airyaslogis.mp4` (3.6 MB) — zero references in `src/`, `index.html`, `README`, `docs/`, `vercel.json` | **FIX NOW** — removed from `public/` (identical master retained at repo root, so the deletion is reversible) |
| 6 | One shared `ErrorBoundary`/`Suspense` for all ten sections | `App.tsx` — a single failed chunk replaced the entire page body with the error card | **FIX NOW** — one boundary + one Suspense per section |
| 7 | `<dt>` wrapped in an extra `<div>` inside `<dl>` | axe `dlitem` (8 nodes) + `definition-list`, serious, WCAG 1.3.1, in `ConsignmentTracker.tsx` `Cell` | **FIX NOW** — icon moved inside the `<dt>`; page-wide axe gate added |
| 8 | Meta CSP laxer than, and drifting from, the header CSP | `index.html` allowed `blob:` img/media and `data:` fonts, omitted `form-action`/`upgrade-insecure-requests` vs `vercel.json` | **FIX NOW** — aligned; `src/test/csp.test.ts` fails if they diverge again |
| 9 | Object URL revoked in the same task as the download click | `CargoSimAir.tsx` `handleDownloadManifest` | **FIX NOW** — anchor attached to the document, revoke deferred |
| 10 | `@/*` alias missing from the test config | `vitest.config.ts` had no `resolve.alias`; `@/…` imports failed only in tests | **FIX NOW** — alias mirrored |
| 11 | Sections are code-split but all ten still load at startup | `App.tsx` renders every lazy element immediately | **LEAVE AS IS** — viewport-deferred mounting would break the navbar's in-page anchors (`#radar`, `#simulator`, …) for unmounted targets; the chunks are parallel, cacheable and now budgeted in total |
| 12 | `dist/` tracked in Git | `.gitignore` documents this as deliberate; tracked output was stale versus `src/` | **IMPROVE** — contract kept, output rebuilt so tracked `dist/` matches source |
| 13 | ~4 MB of master images at the repo root | `Airyaslogist.png`, `airyaslogist1.jpeg`, `Airyaslogis2.jpeg` | **LEAVE AS IS** — they are the recovery path for finding 5; moving them to the ignored `assets-src/` would remove them from every clone |

## Verification (all executed locally)

| Gate | Result |
|---|---|
| `npm run typecheck` | PASSED (0 errors) |
| `npm test` | PASSED — 19 tests / 7 files (was 7 / 3) |
| `npm run build` | PASSED |
| `npm run check:bundle` | PASSED against the tightened budgets |
| `npm audit --omit=dev --audit-level=high` | PASSED — 0 vulnerabilities, one fewer production dependency |
| `vite preview` HTTP smoke | PASSED — `/`, `/assets/index-*.js`, `/assets/index-*.css`, `/theme-init.js` and sampled section chunks all 200 |
| Page-wide axe (jsdom, colour-contrast disabled) | PASSED — 0 violations (was 9 nodes across 2 serious rules) |
| Real-device FPS / LCP / INP / CLS | NOT RUN — no browser or device lab in this environment; still requires a deployed URL and RUM |

## Baseline → final

| Measure | Baseline (`9ab57d0`) | Final | Delta |
|---|---:|---:|---:|
| Entry chunk, raw | 288,788 B | 261,878 B | −9.3% |
| Entry chunk, gzip | 92,185 B | 83,527 B | −9.4% |
| Total JS, raw | 481,748 B | 455,906 B | −5.4% |
| Total JS, gzip | 158,664 B | 150,595 B | −5.1% |
| Total CSS, raw | 116,358 B | 107,122 B | −7.9% |
| Total CSS, gzip | 18,152 B | 16,950 B | −6.6% |
| Shipped `public/assets` | 23.0 MB | 16.0 MB | −7.0 MB |
| Built `dist/` | 25.9 MB | 18.0 MB | −7.9 MB |
| Production dependencies | 6 | 5 | −1 |
| Automated tests | 7 | 19 | +12 |
| Canvas repaints, model visible and idle | 60/s | ~30/s | −50% |
| Canvas repaints, reduced motion and idle | 60/s | 0/s | −100% |
| Hero frame callbacks after scrubbing settles | 60/s for the session | 0/s until the next scroll | −100% |
| Radar re-render timers while off-screen or backgrounded | 2 running | 0 running | −100% |
| axe violations on the full page | 2 rules / 9 nodes | 0 | −100% |

Repaint and timer counts are derived from the scheduling code and the deterministic frame-driver tests in `src/lib/scene-loop.test.ts`, not from a browser profiler; wall-clock CPU/FPS on real hardware remains unmeasured here.

## Behaviour deliberately preserved

The visual design, motion language, bilingual/RTL behaviour, simulation disclaimers, routes, storage keys, public URLs and the `dist/`-tracked deployment contract are unchanged. The only user-visible behaviour changes are: the inactive theme's hero reel now loads on first theme switch rather than at page load (poster shown meanwhile), and a section that fails to load no longer takes the rest of the page with it.

---

# Capability pass — multi-piece planning, ULD load-fit, AWB correction, shareable scenarios

**Baseline for this pass:** commit `d23ef19`, re-verified locally before any change: `npm run typecheck && npm test && npm run build && npm run check:bundle` all green (19 tests / 7 files).

Earlier passes made the artifact truthful, fast and tested; this pass makes the tools genuinely more capable while keeping the simulation boundary intact (everything below remains pure math over bundled constants — no network, no storage beyond the URL itself).

| # | Upgrade | Where | Notes |
|---|---|---|---|
| 1 | Multi-piece consignments: identical-piece count scales volume, volumetric/gross/chargeable weight, carbon and cost; stowed density (kg/m³) reported against the 166.7 IATA pivot with an in-UI density gauge | `air-math.ts`, `CargoSimAir.tsx` | `pieces` defaults to 1 — every existing call site keeps exact behaviour; non-integer piece counts are rejected |
| 2 | ULD fleet data moved out of `ULDSelector.tsx` into `src/lib/uld-fleet.ts` (same consolidation already done for corridors) and extended with conservative usable internal envelopes | `uld-fleet.ts`, `ULDSelector.tsx` | ULD browser now also shows net payload (max gross − tare) and the planning envelope |
| 3 | ULD load-fit engine: dimensional fit (horizontal rotation only — air cargo is built "this way up"), net-payload check, 10% broken-stowage volume reserve, GDP cool-chain matching; recommends the smallest fitting unit and explains every exclusion | `uld-fleet.ts: assessUldFit / recommendUld`, planner card in `CargoSimAir.tsx` | Verdicts are planning heuristics, labeled as such in-UI |
| 4 | AWB Mod-7 corrector: when validation fails on parseable input, the expected check digit (serial mod 7) is computed and a one-click "did you mean" correction offered; unparseable input gets no suggestion | `air-math.ts: computeAwbCheckDigit / formatAwb / suggestAwbCorrection`, `AwbModalAir.tsx` | Still asserts structure only — never booking/customs status |
| 5 | Shareable scenario deep links: simulator state serialized to `?sim=1&l=…` query params and restored on load with range clamping and corridor-distance pinning; copy-link button beside the manifest export | `sim-link.ts`, `CargoSimAir.tsx` | The URL is the only carrier; corridor ids are validated against the bundled dataset |
| 6 | Manifest export (text/modal/print) extended with pieces, total gross, density and the recommended ULD | `CargoSimAir.tsx` | |

**Verification:** `typecheck` 0 errors · 40 tests / 11 files (was 19 / 7), including an end-to-end deep-link restore test under a fresh module graph and jsdom component tests for the planner card and the AWB correction flow · build + bundle gate green (total-JS ratchet consciously moved 470,000 → 480,000 bytes for ~12 KiB raw / ~4 KiB gzip of feature code; the ratchet philosophy in `scripts/check-bundle.mjs` is unchanged) · tracked `dist/` rebuilt to match source.

**Boundary unchanged:** no live data, no fabricated telemetry, bilingual EN/AR coverage added for every new string.
