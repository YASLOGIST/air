# UPGRADE_LOG

**Artifact:** YASLOGIST AIR — bilingual (EN/AR) simulation-grade air-freight cockpit for `air.yaslogist.com`
**Mode:** UPGRADE · **Autonomy:** FULL · **Date:** 2026-10-02
**Baseline:** commit `adc4158` · **Checkpoint branch:** `checkpoint/pre-upgrade-adc4158`
**Working branch:** `arena/01a0fe1a-air`

Every number below is tagged **MEASURED** (observed in this environment), **ESTIMATED** (derived from code/measured inputs), or **UNMEASURED** (not observable here).

---

## W0 — Classification and recon

| Field | Inferred value |
|---|---|
| Artifact type | Single-page React 19 + TypeScript + Vite marketing-and-tooling site with a three.js ULD viewer |
| Intent | Convince freight prospects and technical evaluators that YASLOGIST can operate Egyptian air-cargo corridors, using working planning tools rather than claims |
| Audience | Freight/logistics buyers (EN + AR) and technical evaluators who will read the source |
| Preserve at all costs | The explicit "simulation, not live data" boundary · IATA volumetric/chargeable-weight correctness · the fail-closed consignment tracker · CSP parity between `index.html` and `vercel.json` · bilingual + RTL behaviour · the tracked `dist/` deployment contract |
| Quality bar | High — three prior documented upgrade passes, a quality CI workflow, and ratcheted bundle budgets |
| Domain packs auto-selected | Frontend/UX · Accessibility · Performance/payload · i18n-RTL · Security headers · Testing |

**Assumptions recorded** (all `operator_config` fields other than MODE/AUTONOMY/DOMAIN_PACKS/LOG_FILE/REPORT_LANGUAGE were blank):

1. Production target is a static deploy at `air.yaslogist.com`; `vercel.json` is authoritative for headers. *(Evidence: canonical tag, `vercel.json`, tracked `dist/`.)*
2. Arabic is a first-class locale, not a courtesy translation. *(Evidence: dedicated Arabic display faces, RTL logic throughout, an Arabic-language progress log in the repo.)* This assumption decided the rejection of dictionary code-splitting, below.
3. Bundle budgets in `scripts/check-bundle.mjs` are a real benchmark, not decoration — so they may be tightened but not loosened to accommodate new code.
4. `dist/` is committed deliberately and must be rebuilt to match source at the end of a pass.

## W1 — Baseline (MEASURED, before any change)

`npm ci` → 178 packages, **0 vulnerabilities**.

| Gate | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm test` | 73 tests / 14 files pass |
| `npm run build` | green, 4.7s |
| `npm run check:bundle` | green — app JS **507.6 KiB** (gzip 168.8) / 524.0 · CSS **111.6 KiB** (gzip 17.3) / 115.0 · entry 258.5 KiB · `vendor-three` 558.9 KiB (gzip 141.7) |
| `npm run audit` | 0 vulnerabilities |

**Tooling probe:** no chromium/firefox/playwright, no lighthouse, no ffmpeg. Consequence: all runtime-performance and visual claims in this log are ESTIMATED or UNMEASURED by construction, and are labelled as such.

## W2–W6 — Changes landed

Ranked by severity. Full narrative in `docs/RECONSTRUCTION.md`.

| Sev | Defect found | Fix | Proof it is fixed |
|---|---|---|---|
| **P0** | Arabic typography dead in production: nine selectors authored as `[lang='"ar"']` / `[class*='"tracking-"']` / `[data-theme='"dark"']` matched nothing, so `--font-ar-tech`, the Ruqaa display face, the cursive-join tracking reset and the dark kicker colour never rendered | Unescaped the quotes | Grep of the **built** stylesheet + 10 contract tests, including a behavioural block that runs each selector through `querySelector` against fixture RTL markup |
| **P0** | `aria-live` region wrapped a rAF-updated `{progress}%`, re-announcing the whole hero HUD continuously across a 320vh scrub | `%` set `aria-hidden`; one `sr-only role="status"` announces the phase (3 changes/scrub) | Test asserts exactly one live region, `role="status"`, and no `%` inside it |
| **P1** | Scroll-reveal never fired: one-shot `querySelectorAll` on mount vs 13 `React.lazy` sections — only the eager hero was revealed, silent failure, dead CSS still shipping | `MutationObserver`-backed observation | Test appends a section *after* mount; fails without the observer |
| **P1** | Icon-only ecosystem links in the drawer had no accessible name (WCAG 2.4.4 / 4.1.2); escaped the axe gate because no test ever opened the drawer | `sr-only` labels + `title` | New axe test with the drawer **open**; reintroducing the bug fails it |
| **P1** | Mobile drawer had no exit but its toggle — no Escape, no outside-dismiss, no focus restore, stayed open across the `xl` breakpoint | All four added, plus `aria-controls`/`useId` | 8 navbar tests |
| **P1** | 14 MB of hero video shipped to data-saver connections | Both reels gated on `saveData` / `prefers-reduced-data`; poster carries the shot | Code path; saving ESTIMATED at up to 14 MB |
| **P1** | No position indicator across ten sections of scroll | `useActiveSection` scroll spy + `aria-current`, signalled by colour **and** underline | Mutation-verified fixtures |
| **P2** | Anchor landings inconsistent: six sections had `scroll-mt-24` stacked on `scroll-padding-top: 5rem` (176px), two had neither (80px) | One mechanism — `scroll-padding-top: 7rem`; spy offset derived from it | Test pins the derivation; a second test forbids `scroll-margin-top` from returning |
| **P2** | Active "Air" nav entry was `<a href="#">` — announced as a link, jumped to top | `<span aria-current="true">` | axe + navbar tests |
| **P2** | Progress bar painted over modals (`z-10001`), used physical `left-4`, mirrored wrong in RTL, re-rendered React every frame | Re-layered to 9500, logical `start-4`, `rtl:origin-right`, direct ref write | Documented z-order: back-to-top 8500 < navbar 9000 < progress 9500 < modals 10000 |
| **P2** | `theme-color` declared in three places that could drift | Exported `THEME_COLORS`, pinned to `--c-bg` | 3 tests |
| **P2** | `ErrorBoundary`, skip link, back-to-top and hero landmark were English-only in Arabic sessions | Bilingual; the boundary reads `documentElement.lang` rather than `useLang`, so a dictionary fault cannot take the fallback down with it | typecheck + render tests |
| **P3** | `HeroAir.tsx` dead (referenced by docs, imported by nothing); no `robots.txt`; no `<noscript>`; no OG locale alternates | Deleted / added | Build + preview smoke test |
| **P3** | esbuild minification leaving measurable bytes on the table | terser, 2 compress passes | Measured below |

## W7 — Verification (MEASURED unless noted)

| Metric | Baseline | Final | Δ |
|---|---|---|---|
| Typecheck errors | 0 | 0 | — |
| Tests / files | 73 / 14 | **100 / 19** | **+27 / +5** |
| App-total JS raw | 507.6 KiB | **492.4 KiB** | **−15.2 KiB** |
| App-total JS gzip | 168.8 KiB | **165.0 KiB** | **−3.8 KiB** |
| App CSS raw | 111.6 KiB | **107.2 KiB** | **−4.4 KiB** |
| `vendor-three` gzip | 141.7 KiB | **138.4 KiB** | **−3.3 KiB** |
| JS ratchet | 524,000 B | **515,000 B** (tightened) | −9,000 B |
| CSS ratchet | 115,000 B | **112,000 B** (tightened) | −3,000 B |
| `vendor-three` ratchet | 625,000 B | **592,000 B** (tightened) | −33,000 B |
| `npm audit` | 0 vulns | 0 vulns | — |
| Build time | 4.7s | 11.7s | +7.0s (CI only) |

Additional checks: all built chunks parse as ESM (`node --check`); production preview returned **200** for `/`, `/theme-init.js`, `/robots.txt`, the entry JS/CSS, `vendor-three`, two lazy chunks and the OG image; the Arabic and dark-mode selectors were confirmed present in the shipped stylesheet.

**Invariant Gate (I1–I7): PASS.** Truth preserved (no claim added that the artifact cannot back) · intent preserved · critical behaviour preserved (IATA math, fail-closed tracker, CSP, storage keys, routes, public URLs all untouched) · data integrity preserved (no new persistence) · security preserved (CSP unchanged, no new network calls, 0 vulns) · maintainability improved (+27 tests, dead code removed, duplicated constants unified) · recoverability preserved (`checkpoint/pre-upgrade-adc4158`).

## Rejected after analysis (recorded so they are not retried)

- **Raising the JS ratchet** to absorb this pass's +4.2 KiB — that is weakening a benchmark to flatter the result. Found a real optimisation instead; every budget ended up tighter.
- **Code-splitting the 36.9 KB Arabic dictionary** (the largest first-party entry module). Every delivery mechanism either serialises a request before first render or shows English to Arabic readers first. Degrading Arabic to speed up English is the wrong trade here.
- **`Disallow: /assets/`** in robots.txt — written, then reverted: Googlebot must fetch the bundle to render a CSR page, and the OG image lives there.
- **JSON-LD structured data** — would require weakening `script-src 'self'`.
- **ESLint** — 5+ new devDeps for modest marginal value over strict TS, `noUnused*`, axe tests and the CI gates. Deferred, not dismissed.

## Externally blocked

- No browser engine or lighthouse → LCP, INP, CLS and real-device FPS are **UNMEASURED**. Nothing in this log claims them.
- No ffmpeg → the 14 MB of hero MP4s could not be re-encoded; gating them was the available win.

---

# Pass 2 — WebGL context-loss recovery

**Mode:** UPGRADE · **Autonomy:** FULL · **Date:** 2026-10-02
**Baseline:** commit `3a9cfb3` (merge of `arena/01a0fe1a-air`, the pass above) · **Working branch:** `arena/01a0fe37-air`

## W0/W1 — Recon and baseline (MEASURED)

`npm ci` → 185 packages, 0 vulnerabilities. `npm run typecheck` 0 errors. `npm test` 100/100 passing across 19 files. `npm run build` green, 10.2s. `npm run check:bundle` green. No headless browser engine was installable in this sandbox (no network egress for the Playwright binary, no package manager access for its system deps) — identical constraint to Pass 1 — so this pass again routes around that by reading the shipped renderer source (`node_modules/three/src/renderers/WebGLRenderer.js`) directly rather than guessing at its behaviour.

Routing: this repository had already been taken through a full accessibility/i18n/bundle pass. A second recon pass over the two hand-written WebGL surfaces (`src/three/airgl/uld/scene.ts`, `src/three/airgl/globe/scene.ts`) found the engine itself — render-on-demand, zero-allocation loops, full resource-lifecycle disposal, reduced-motion handling, DPR ceiling — already at a high bar. The one load-bearing gap: **no code anywhere handled `webglcontextlost` / `webglcontextrestored`.**

## What that gap actually meant (verified against three.js r186 source, not assumed)

`THREE.WebGLRenderer` already registers its own internal `webglcontextlost` listener and calls `preventDefault()` — so the browser was already *attempting* restoration; that part was never broken. On restore, `initGLContext()` replaces the renderer's internal `WebGLProperties` registry wholesale, which means ordinary geometries, textures and shader programs already re-upload themselves automatically from their JS-side data on the next `render()` call. What three.js's generic recovery cannot do:

1. **Pause the app's own rAF loop.** Both scenes kept ticking every frame into a renderer whose `render()` had become a silent no-op (`if (this._isContextLost) return;`) — CPU spent on damping/spring/sun-position math for a frame nobody would ever see, for an indefinite window.
2. **Tell the user anything.** A lost context freezes the last rendered frame with zero explanation — exactly the "unexplained blank canvas" the loading/failure contract forbids.
3. **Rebuild GPU-only artifacts.** The ULD viewer's environment reflections are baked once by a `PMREMGenerator` pass with no source image; after a restore that bake is still "applied" as far as three.js is concerned, but the pixels it produced lived only on the now-dead GPU, so it would have rendered as flat/blank lighting until the unit was changed (which `setModel` happens to avoid, but nothing accounted for it directly) and never actually re-baked.

## Changes landed

| File | Change |
|---|---|
| `src/three/airgl/gl.ts` | New `watchContextLoss(canvas, { onLost, onRestored })` — the one shared, pure-DOM primitive both scenes wire into. `onLost` calls `event.preventDefault()`. |
| `src/three/airgl/uld/scene.ts` | Wires `watchContextLoss`; pauses/arms the rAF loop on loss/restore; exposes `onContextChange(cb)`; extracted the environment bake into `buildEnvironment()` so it can run again on restore (disposing the stale `PMREMGenerator` and render target first); `wake()`/`renderOnce()` now also gate on `contextLost`; `dispose()` detaches the listener. |
| `src/three/airgl/globe/scene.ts` | Same wiring, without the environment rebuild — every resource in this scene is a plain `BufferGeometry`/`ShaderMaterial` with scalar uniforms, which three.js's generic recovery already handles correctly. |
| `src/components/ULDViewer3D.tsx`, `src/components/CorridorGlobe3D.tsx` | Subscribe to `onContextChange`; render a bilingual, `role="status" aria-live="polite"` notice over the canvas while lost, which clears itself on restore — no new persistent UI state, no change to any existing control. |
| `src/three/airgl/gl.test.ts` (new) | Proves the DOM contract directly: `preventDefault()` is called, both callbacks fire independently, cleanup detaches both listeners. |
| `src/components/ULDViewer3D.test.tsx`, `src/components/CorridorGlobe3D.test.tsx` (new) | Mock the scene controllers (jsdom has no real WebGL, so the real classes never instantiate in any test — this was literally untested before) and drive the lost→restored cycle through the component, asserting the accessible notice appears and clears. |

## W7 — Verification (MEASURED)

| Metric | Before this pass | After | Δ |
|---|---|---|---|
| Typecheck errors | 0 | 0 | — |
| Tests / files | 100 / 19 | **109 / 22** | **+9 / +3** |
| App-total JS raw | 492.4 KiB | **495.0 KiB** | +2.6 KiB (new recovery logic + bilingual UI strings) |
| App-total JS gzip | 165.0 KiB | **165.9 KiB** | +0.9 KiB |
| App CSS | 107.2 KiB | 107.9 KiB | +0.7 KiB |
| Bundle ratchets (`scripts/check-bundle.mjs`) | — | **all pass**, headroom intact (495.0/502.9 KiB JS, 107.9/109.4 KiB CSS) | no ratchet raised |
| `npm audit` | 0 vulns | 0 vulns | — |
| New dependencies | — | **0** | the fix uses only standard DOM events and existing three.js/React APIs |

`dist/` was rebuilt from current `src/` as part of this pass (see "Fixed in passing" below) and is committed to match, per the repo's tracked-`dist/` contract.

**Invariant Gate (I1–I7): PASS.** No behaviour change for the common case (context never lost): the new code paths are inert until the browser actually fires `webglcontextlost`. No new runtime errors. PRESERVE intact (no public API, route, data contract or copy changed outside the two new UI strings). No regression — bundle ratchets still pass with headroom. Resource behaviour stays bounded (the PMREMGenerator/render-target pair is explicitly disposed before each rebuild, on both the first boot and every subsequent restore). No new dependency. No cross-boundary files touched.

## Fixed in passing

- `dist/` had drifted from `src/` (it still shipped Pass 1's pre-`noscript`/pre-OG-locale HTML and an unminified-looking stale `theme-init.js`) — a plain `npm run build` with no source changes would have produced a different `dist/` than what was committed. Rebuilt so the tracked output matches `HEAD` exactly, honouring the "`dist/` is a deliberate deployment contract" decision from Pass 1.

## Rejected after analysis

- **A full renderer/scene teardown-and-remount on every context loss** (the pattern shown in three.js's own `webgl_materials_context_restore` example) — unnecessary here: both scenes' own resource model (geometries/materials with persistent JS-side data, no streamed assets) is exactly the case three.js's built-in `initGLContext()` recovery already covers. Rebuilding everything would have meant re-running `buildUldModel`/`buildDotShell` et al. unconditionally, doubling the surface area of this change for no measurable benefit over the targeted fix (pause loop + notify + rebake the one GPU-only artifact).
- **An FPS-based adaptive-quality governor** (dynamic DPR/particle-count stepping for Tier C) — considered and set aside: there is no post-processing, no shadow map, and both scenes already run at a DPR ceiling of 2 with single-digit draw calls; without a measured low-FPS device sample in this sandbox (no headless GPU available), adding a stepping governor now would be unjustified complexity against the Prime Directive's "proportionate complexity" test, not a confirmed fix for a confirmed problem.

## Externally blocked

- No headless Chromium (no network path to the Playwright CDN, no package-manager access for its system deps in this sandbox) → an actual `forceContextLoss()`/`forceContextRestore()` round-trip against a live GPU-backed context, and any FPS/draw-call numbers for the two 3D surfaces, remain **UNMEASURED** here. The DOM-event contract and the React wiring it drives are covered by the new unit/component tests instead, which do not depend on a real WebGL context.

# Pass 3 — Truth-preserving simulation language

**Mode:** UPGRADE · **Autonomy:** FULL · **Date:** 2026-10-03
**Baseline:** commit `78f6a56` · **Process depth:** STANDARD

## W0/W1 — Recon

The repository is a mature static React 19 + TypeScript + Vite air-freight simulation with a deliberate no-network/data-boundary contract. Existing automated coverage was green: 111 tests across 23 files, strict typecheck, production build, and bundle budgets. A copy audit found several user-facing labels and social metadata saying **LIVE**, **REAL-TIME**, or **ONLINE** even though the underlying vectors, corridors, consignment records, and sensor values are bundled/scripted demo data.

## W4/W5 — Changes landed

- Reframed English and Arabic hero, radar, tracker, and statistics copy as modeled, scripted, simulated, or demo content.
- Renamed the globe HUD from “LIVE ARCS” to “SIMULATED ARCS”.
- Renamed the ULD HUD from “LIVE TELEMETRY FEED / ONLINE” to “SIMULATED TELEMETRY / DEMO ACTIVE”, including Arabic.
- Corrected Open Graph/Twitter image alt text and the README preview alt text so external previews cannot imply a live feed.
- Kept the interactive motion and controls intact; this is a truth/copy correction, not a capability reduction.
- Rebuilt tracked `dist/` from the updated source.

## W7 — Verification

- **PASSED / MEASURED:** `npm run check` — typecheck passed; 111 tests / 23 files passed; Vite production build passed; bundle budget passed.
- **MEASURED:** app total JS 495.1 KiB raw / 165.9 KiB gzip; CSS 107.9 KiB raw / 16.8 KiB gzip; vendor-three 563.7 KiB raw / 138.4 KiB gzip.
- **UNMEASURED:** no browser/GPU visual capture available in this environment; copy changes were verified through source/build output and automated suite only.

## Residual risk

Some operational-sounding illustrative terms remain intentionally as domain vocabulary (for example, “flight”, “runway”, and “temperature stable” inside the model). The persistent simulation badge and revised surrounding labels now make their modeled status explicit without flattening the product’s aviation design language.
