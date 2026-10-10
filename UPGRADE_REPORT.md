# Upgrade report — YASLOGIST AIR

**Discovery completed:** 2026-10-10 (UTC)  
**Working branch:** `arena/e86c4c91-air` (the Arena session branch; no branch switch)  
**Baseline commit:** `d7781fb34089d55170dc77c929be07dc48c9902d`  
**Scope:** inspect and measure first; this report records the pre-change baseline and the implementation plan. No source files had been changed during discovery.

## 1. Project profile

### Purpose and operating boundary

YASLOGIST AIR is a static, browser-only, bilingual (English/Arabic, including RTL) air-freight planning and demonstration cockpit. Visitors can model chargeable weight, indicative cost and carbon, check an AWB's Mod-7 structure, inspect an illustrative ULD fleet and corridor globe, and view bundled sample consignment milestones. It is not a booking system and has no live airline, customs, airport, pricing, shipment, or IoT integration. That simulation-only boundary is part of the product contract and will be preserved.

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
- **3D:** `src/three/airgl/` contains renderer lifecycle, geodesy, landmask, ULD model/shaders, and corridor scene code. `ULDViewer3D` and `CorridorGlobe3D` statically import the Three.js scene graph today.
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

The package script `npm run audit` runs the **full** audit and therefore failed at baseline even though the CI workflow's production-only audit passed. This is worth correcting rather than hiding the finding by changing the audit scope.

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

**Measured architecture bottleneck:** all lazy section components are rendered at startup, so their dynamic imports are invoked together. Both 3D component modules statically import their renderer/scene modules, which pull in the 563.7 KiB Three.js chunk. The existing scenes avoid off-screen animation work, but they still require their JS graph to be downloaded and instantiate renderers when mounted. Deferring the optional 3D graph until a viewer approaches the viewport is a direct opportunity to reduce early JavaScript transfer and unnecessary GPU-context setup without changing the section content, URLs, or math.

The 14 MiB figure is the on-disk size of the video assets, **not** a measured initial transfer: the existing code uses metadata preload and opts videos out for reduced-motion/data-saving preferences. No Chromium/Firefox/WebKit binary or browser automation package is available in this environment, so LCP/INP/CLS, actual network waterfalls, and physical-device FPS/memory were **not measured**. There is no database, API, or server process to benchmark for query/startup time.

**Tracked build output:** `dist/` is intentionally versioned. A clean build regenerated differently named hashed assets and changed the tracked build tree even with no source edits, showing that the checked-in output did not reproduce from the current lockfile/toolchain. The final source change will be followed by a production rebuild so tracked `dist/` matches the verified source and deployment output.

## 3. Ranked findings and plan

| Priority | Finding | Impact / risk | Planned treatment |
|---|---|---|---|
| 1 | Optional Three.js scenes are statically imported by two always-mounted lazy sections; the 563.7 KiB raw / 138.4 KiB gzip vendor chunk is in the startup module graph, and renderer creation is not deferred until visibility. | **High impact / medium implementation risk.** Users benefit from less early JS and fewer idle WebGL contexts; lifecycle/async ordering needs careful regression coverage. | Extract the lightweight WebGL capability probe from the Three.js module, load scene code only when its canvas approaches the viewport, cancel late async boots on unmount, preserve off-screen pausing, and expose bilingual loading/failure states. Keep the no-IntersectionObserver path functional. Add tests for deferral, boot, cleanup, and fallback. |
| 2 | Full `npm audit` has one fixable high-severity transitive **development** dependency advisory. | **Medium security/maintenance impact / low risk.** It currently makes `npm run audit` fail and leaves the developer toolchain exposed to a known parser DoS; production-only audit is already clear. | Update the lockfile to compatible `source-map-js` 1.2.2 or later, keep the full audit gate, and verify both full and production-only audits. No production API or runtime change. |
| 3 | Tracked `dist/` does not reproduce from the current clean build. | **Medium release reliability impact / low risk.** A deployment using committed `dist/` could serve a stale bundle. | Rebuild and synchronize the tracked artifacts after the implementation, then rerun the bundle gate. Keep the repository's deliberate tracked-`dist/` contract. |
| 4 | No dedicated linter exists. | **Low immediate user impact / low-to-medium setup cost.** Strict TypeScript and the broad tests already pass; introducing a new lint tool/config is not needed to fix the measured user-facing or security issues. | Record as a limitation; do not add dependencies or an unrelated tooling surface in this upgrade. |

### Scope decisions

- Preserve public behavior, anchor IDs, data formats, URL query parameters, storage keys, security policy, and the simulation-only boundary.
- No new product capability is justified by this recon: the app already provides a coherent set of freight-planning tools. The selected capability improvement is *when* the existing 3D experience loads, not unrelated feature expansion.
- Add no runtime or development dependency for the performance change; resolve the advisory using the existing semver range and lockfile.
- Avoid claiming real-world Web Vitals or FPS gains without a browser/device lab. Report bundle measurements and code-path tests only.
