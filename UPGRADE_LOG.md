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
