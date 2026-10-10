# Upgrade report — YASLOGIST AIR

**Discovery completed:** 2026-10-10 (UTC)  
**Upgrade verified:** 2026-10-10 (UTC)
**Working branch:** `arena/e86c4c91-air` (the Arena session branch; no branch switch)  
**Baseline commit:** `d7781fb34089d55170dc77c929be07dc48c9902d`  
**Scope:** discovery was completed before edits; the baseline below records the pre-change state. All planned work is now implemented and verified.

## 1. Project profile

### Purpose and operating boundary

YASLOGIST AIR is a static, browser-only, bilingual (English/Arabic, including RTL) air-freight planning and demonstration cockpit. Visitors can model chargeable weight, indicative cost and carbon, check an AWB's Mod-7 structure, inspect an illustrative ULD fleet and corridor globe, and view bundled sample consignment milestones. It is not a booking system and has no live airline, customs, airport, pricing, shipment, or IoT integration. That simulation-only boundary is part of the product contract and was preserved.

### Stack and runtime

| Area | Finding |
|---|---|
| Languages | TypeScript/TSX, CSS, HTML; small Node ESM scripts; Python for the generated README hero |
| UI | React 19, strict TypeScript, Tailwind CSS 4, Lucide icons |
| Build/dev | Vite 6, npm with committed `package-lock.json`; production target ES2022; Terser minification |
| 3D | Three.js r186, custom AIRGL ULD and corridor scenes, isolated `vendor-three` production chunk |
| Tests | Vitest 5 + jsdom + Testing Library + vitest-axe; 23 test files |
| Deployment | Static Vite output; `dist/` is deliberately tracked; `vercel.json` defines security/cache headers and Vercel Analytics is present |
| Environment/secrets | No required runtime environment variables or backend secrets. Optional sibling-app URLs are documented as `VITE_*` examples in `.env.example`. |
| Lint | No lint script, linter package, or lint configuration is declared. TypeScript strict mode, no-unused checks, tests, and build are the configured static/quality gates. |

### Structure, state, APIs, and data

- **Boot:** `index.html` → `public/theme-init.js` (pre-paint theme/direction) → `src/main.tsx` → theme and language providers → `src/App.tsx`.
- **Screens/sections:** one long, anchor-navigated experience in `src/components/`; no router or server-rendered route tree. `App.tsx` mounts independently lazy-loaded sections under per-section `Suspense` and error boundaries.
- **Domain logic:** `src/lib/air-math.ts`, `corridors.ts`, and `uld-fleet.ts` hold pure freight/AWB/corridor/ULD calculations and bundled constants. `src/components/ConsignmentTracker.tsx` owns demonstration records and deliberately returns not-found for unknown identifiers.
- **State:** local React state; language and theme preferences in browser `localStorage`; shareable simulator inputs in URL query parameters; exports are browser-local (copy/print/text download). No database or API client exists.
- **3D:** `src/three/airgl/` contains renderer lifecycle, geodesy, landmask, ULD model/shaders, and corridor scene code. `ULDViewer3D` and `CorridorGlobe3D` now dynamically import Three.js scenes when their canvases approach within 200px of the viewport; browsers without `IntersectionObserver` retain an eager fallback.
- **External services/assets:** Vercel Analytics when deployed on Vercel and Google Fonts; application calculations and datasets run locally. Hero videos and imagery are served from `public/assets/`. CSP and response headers are configured in `index.html` and `vercel.json`, with a test pinning policy parity.
- **Build/config:** `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `scripts/check-bundle.mjs`, and `.github/workflows/quality.yml`.

## 2. Baseline (before implementation)

### Environment and gates

Baseline was run after a clean `npm ci` using Node 22.22.3 and npm 10.9.8.

| Gate | Baseline result |
|---|---|
| Install | **PASS** — 185 packages added; 186 audited |
| Type check (`npm run typecheck`) | **PASS** — no TypeScript errors |
| Tests (`npm test`) | **PASS** — 111 tests across 23 files |
| Production build (`npm run build`) | **PASS** — Vite 6.4.3; 13.39 seconds reported by Vite |
| Bundle budget (`npm run check:bundle`) | **PASS** — app JS/CSS and the single `vendor-three` chunk are within the current ratchets |
| Combined check (`npm run check`) | **PASS** — typecheck, tests, build, and bundle budget; 57.81 seconds end-to-end in this run |
| Linter | **NOT CONFIGURED** — no command or linter to run; not reported as a pass |
| Full dependency audit (`npm audit --audit-level=high`) | **FAIL** — one high-severity transitive development-tool advisory: `source-map-js` 1.0.0–1.2.1, GHSA-68fv-2mgg-jv7q (CVSS 7.5; indexed-source-map event-loop DoS). npm reports a compatible fix at 1.2.2. |
| Production-only audit (`npm audit --omit=dev --audit-level=high`) | **PASS** — zero reported production vulnerabilities. The vulnerable package is reached through Tailwind, jsdom, and Vite development/build tooling, not the shipped runtime dependencies. |

The package script `npm run audit` runs the **full** audit and therefore failed at baseline even though the CI workflow's production-only audit passed. That mismatch was corrected by applying the compatible lockfile patch rather than narrowing the audit scope.

### Baseline bundle and performance evidence

Fresh production build output was measured with the repository's bundle script; gzip values below are local gzip estimates, not a browser/network trace.

| Measure | Baseline |
|---|---:|
| Main entry JS | 260.7 KiB raw / 84.5 KiB gzip |
| Application JS (all non-Three chunks) | 495.2 KiB raw / 166.0 KiB gzip |
| `vendor-three` | 563.7 KiB raw / 138.4 KiB gzip |
| All JS emitted by the build | 1,084,346 B raw / 311,731 B gzip (35 JS files) |
| CSS | 110,531 B raw / 17,171 B gzip |
| Static `public/assets/` | 16 MiB, including 14 MiB of two runway video reels |
| Build time | 13.39 seconds |

**Measured architecture bottleneck:** all lazy section components are rendered at startup, so their dynamic imports are invoked together. Both 3D component modules statically imported their renderer/scene modules, which pulled in the 563.7 KiB Three.js chunk. The existing scenes avoided off-screen animation work, but their JS graph was still part of the initial request graph and renderer construction happened at mount.

The 14 MiB figure is the on-disk size of the video assets, **not** a measured initial transfer: the existing code uses metadata preload and opts videos out for reduced-motion/data-saving preferences. No Chromium/Firefox/WebKit binary or browser automation package is available in this environment, so LCP/INP/CLS, actual network waterfalls, and physical-device FPS/memory were **not measured**. There is no database, API, or server process to benchmark for query/startup time.

**Tracked build output:** `dist/` is intentionally versioned. A clean build regenerated differently named hashed assets and changed the tracked build tree even with no source edits, showing that the checked-in output did not reproduce from the current lockfile/toolchain. The final verified build was regenerated and committed with the source changes.

## 3. Ranked findings and original plan

| Priority | Finding | Impact / risk | Planned treatment |
|---|---|---|---|
| 1 | Optional Three.js scenes were statically imported by two always-mounted lazy sections; the `vendor-three` chunk was in the startup module graph, and renderer creation was not deferred until visibility. | **High impact / medium implementation risk.** Users benefit from less early JS and fewer idle WebGL contexts; lifecycle/async ordering needs careful regression coverage. | Extract the lightweight WebGL capability probe from the Three.js module, load scene code only when its canvas approaches the viewport, cancel late async boots on unmount, preserve off-screen pausing, and expose bilingual loading/failure states. Keep the no-IntersectionObserver path functional. Add tests for deferral, boot, cleanup, and fallback. **Done.** |
| 2 | Full `npm audit` had one fixable high-severity transitive **development** dependency advisory. | **Medium security/maintenance impact / low risk.** It made `npm run audit` fail and left the developer toolchain exposed to a known parser DoS; production-only audit was already clear. | Update the lockfile to compatible `source-map-js` 1.2.2, keep the full audit gate, and verify both full and production-only audits. **Done.** |
| 3 | Tracked `dist/` did not reproduce from the current clean build. | **Medium release reliability impact / low risk.** A deployment using committed `dist/` could serve a stale bundle. | Rebuild and synchronize the tracked artifacts after the implementation, then rerun the bundle gate. Keep the repository's deliberate tracked-`dist/` contract. **Done.** |
| 4 | No dedicated linter exists. | **Low immediate user impact / low-to-medium setup cost.** Strict TypeScript and broad tests already pass; introducing a new lint tool/config is not needed to fix the measured user-facing or security issues. | Record as a limitation; do not add dependencies or an unrelated tooling surface in this upgrade. **Deferred intentionally.** |

## 4. Implemented changes

### Stability, performance, and accessibility

- Extracted `isWebGLSupported()` into `src/three/airgl/webgl-support.ts`, which has no Three.js runtime import. `src/three/airgl/gl.ts` re-exports the existing function names for compatibility.
- Changed both 3D viewers to import their scene modules only after `IntersectionObserver` reports the canvas within a 200px root margin. The same observer continues to pause rendering off-screen after boot. Unsupported WebGL is detected before downloading Three.js; browsers without `IntersectionObserver` still boot immediately.
- Added cancellation guards so a pending chunk import cannot allocate a renderer after unmount/React StrictMode cleanup. React control state (including a selected ULD door state/preset) is synchronized when the delayed scene becomes ready.
- Added bilingual accessible loading states and distinct unsupported/load-failure messages; the existing spec/corridor content remains usable when WebGL is unavailable or the chunk fails.
- Expanded both scene component suites to cover visibility-gated creation, cancellation of pending imports, cleanup/disposal, preserved control intents, graceful unsupported-WebGL states, and the existing GPU context-loss announcements.
- Extended `scripts/check-bundle.mjs` to fail if either always-mounted scene section statically imports `vendor-three`; byte budgets and exactly-one-vendor checks remain intact.

### Security, docs, and release output

- Updated the lockfile's transitive `source-map-js` package from 1.2.1 to patched 1.2.2. No package was added, removed, or promoted to a runtime dependency.
- Updated README/Vite/bundle-budget comments to describe the actual demand-loading policy and legacy-browser fallback.
- Rebuilt tracked `dist/` so deployment output matches the verified sources and lockfile.
- No public route, anchor, API, data format, schema, local-storage key, URL query parameter, CSP, or simulation boundary changed. No production migration is needed.

### New capabilities

No new logistics/business feature was justified by the recon. The existing interactive 3D tools now have a responsive loading state, a specific failure fallback, and delayed engine transfer; these strengthen the existing digital-twin experience rather than adding unrelated product surface.

## 5. Baseline versus after

### Gates and vulnerabilities

| Gate | Baseline | After |
|---|---|---|
| Install | `npm ci`: 185 packages; one high advisory reported | `npm ci`: 185 packages; **0 vulnerabilities** |
| Type check | Pass, 0 errors | Pass, 0 errors |
| Tests | 111 / 23 files | **117 / 23 files** |
| Production build | Pass; 13.39s reported | Pass; 12.25s reported (timing is machine/run dependent) |
| Bundle budget | Pass | Pass, including new deferred-import invariant for both 3D sections |
| Full audit | 1 high (`source-map-js` 1.2.1) | **0 vulnerabilities** (`npm run audit`) |
| Production audit | 0 | 0 |
| Linter | Not configured | Not configured; no new lint tool added |
| Static preview smoke | Not run at baseline | **200** for `/`, `/theme-init.js`, `/robots.txt`, entry JS/CSS, `vendor-three`, and a lazy scene chunk. Local sub-3ms responses are not browser load-time measurements. |

`npm run check` passed after the changes (typecheck → 117 tests → build → bundle budget); total local wall time was about 54 seconds. The test process still logs pre-existing jsdom limitations for media/canvas APIs and a few React `act(...)` warnings; they do not fail the tests.

### Production bundle measurements

| Measure | Baseline | After | Interpretation |
|---|---:|---:|---|
| Main entry JS | 260.7 KiB raw / 84.5 KiB gzip | 254.6 KiB raw / 82.5 KiB gzip | −6.1 KiB raw / −2.0 KiB gzip; small build-graph/minification changes, not the main optimization claim. |
| All non-vendor JS chunks | 495.2 KiB raw / 166.0 KiB gzip | 498.0 KiB / 167.5 KiB | +2.8 KiB raw / +1.5 KiB gzip for loading/error/cancellation handling; this total includes newly deferred scene chunks. |
| `vendor-three` | 563.7 KiB raw / 138.4 KiB gzip | 563.7 KiB / 138.4 KiB | Engine size unchanged; it is now dynamically requested rather than statically required by the initial scene-section imports. |
| All JS emitted (including deferred/conditional chunks) | 1,084,346 B raw / 311,731 B gzip | 1,087,165 B / 313,249 B | +2,819 B raw / +1,518 B gzip total; code splitting changes *when* bytes arrive, not total source bytes. |
| CSS | 110,531 B raw / 17,171 B gzip | 110,809 B / 17,212 B | +278 B raw / +41 B gzip for loading/fallback UI. |
| Deferred Three.js feature graph after split | Part of startup chunks | 628,491 B raw / 159,684 B gzip across vendor, both scene chunks, and shared easing | This graph is now behind viewport-triggered dynamic imports; the build gate and component tests verify the boundary. |
| Static `public/assets/` | 16 MiB | 16 MiB | Unchanged. The videos remain metadata/data-saving gated; actual transfer was not measured. |

The primary measured performance result is **deferral**, not a smaller full build: the roughly 156 KiB gzip Three.js+scene graph is no longer a static prerequisite before either 3D canvas approaches. Actual LCP, INP, FPS, memory, and network savings on a user's device remain unverified because no browser/GPU lab was available.

## 6. Risks, limitations, and human decisions

- Where `IntersectionObserver` is unavailable, the 3D imports intentionally fall back to eager boot to preserve functionality; those older browsers will not receive the transfer deferral.
- A user who deep-links or scrolls directly to a 3D surface will trigger the engine request immediately, by design. The UI reports loading while it arrives.
- No real browser/device waterfall, Core Web Vitals, GPU frame-rate, memory, battery, or accessibility screen-reader session was run. jsdom/axe coverage is not a substitute for those checks.
- There is no dedicated linter. A future lint tool may be useful, but installing/configuring one was outside the measured fixes and would add toolchain/dependency churn.
- This pass did not validate the domain correctness of freight/carbon/tariff factors or independently establish media redistribution rights; existing simulation disclaimers remain in place.
- No human decision is required to use or merge this technical upgrade. Separate future decisions would be needed to approve media licensing or scope any real carrier/customs integrations.

## 7. Upgrade commits

- `c48b443` — record the discovery baseline and ranked plan.
- `6836944` — patch the vulnerable transitive `source-map-js` dependency.
- `9955f95` — defer the 3D engine, add lifecycle/accessibility tests and budget checks, and synchronize tracked production output.
