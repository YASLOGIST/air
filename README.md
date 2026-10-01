# YASLOGIST AIR — air.yaslogist.me

The air-freight surface of the YASLOGIST logistics suite: a bilingual
(English / العربية, LTR + RTL) single-page React application presenting
time-critical air freight, e-AWB pre-clearance and cold-chain telemetry
around Cairo International Airport (CAI) Cargo Village.

Part of a three-surface ecosystem — corporate hub (`yaslogist.me`),
ocean (`ocean.yaslogist.me`), land (`land.yaslogist.me`) — this app is the
air wing (`air.yaslogist.me`).

## Quick start

```bash
npm install        # Node 20+ required (CI runs 22)
npm run dev        # local dev server (Vite)
npm run verify     # typecheck + lint + tests + build + performance budget
```

Other commands:

| Command                    | What it does                                                       |
| :------------------------- | :----------------------------------------------------------------- |
| `npm run test` / `test:watch` | Vitest suite: 77 tests incl. axe accessibility scan of the full page |
| `npm run build`            | Production build into `dist/` (this repo deploys `dist/` as-is)    |
| `npm run build:check`      | Build + gzip-size performance budget guard (`scripts/check-bundle-size.mjs`) |
| `npm run optimize:assets`  | Regenerate WebP images / OG card / PWA icons from `assets-src/` masters |
| `npm run preview`          | Serve the production build locally                                  |

## Architecture

```
src/
├── main.tsx                # React 19 root: ThemeProvider → LanguageProvider → App
├── App.tsx                 # Section stack + lazy-loaded dialogs + ErrorBoundary
├── index.css               # Tailwind v4 tokens, themes (dark/light), motion system
├── components/
│   ├── CinematicStage.tsx      # 320vh scroll-driven descent (lazy video, settle-aware rAF)
│   ├── StatsAir / MissionAir   # Benchmarks, mission pillars (scroll reveal)
│   ├── CargoVillageFlow.tsx    # 4-phase CAI fast-track flow
│   ├── FlightRadarHUD.tsx      # Radar scope + cold-chain telemetry simulation
│   ├── ULDSelector.tsx         # Aircraft container browser (AKE/PMC/RKN/RAP)
│   ├── CargoSimAir.tsx         # IATA volumetric + GLEC carbon calculator
│   ├── CorridorsAir.tsx        # Corridor browser (FRA/DXB/AMS/PVG ⇄ CAI)
│   ├── ConsignmentTracker.tsx  # e-AWB lookup (simulated consignments)
│   ├── HandshakeAirToLand.tsx  # Air→land modal handoff
│   ├── StanceAir.tsx           # Non-carrier operating stance
│   ├── QuoteModalAir.tsx       # Serverless quote composer (mailto/tel/wa.me)
│   ├── LegalModalAir / AwbModalAir  # Lazy-loaded dialogs (useDialog a11y)
│   ├── NavbarAir / FooterAir / BrandAir / ModelBadge / DigitalTwinBadge
│   ├── Reveal.tsx / ScrollTopFab / ErrorBoundary
├── lib/
│   ├── air-math.ts         # IATA TACT 1:6000 math, GLEC CO₂, AWB Mod-7 validator
│   ├── corridors.ts        # Shared corridor + sea-lane reference data
│   ├── i18n.tsx            # EN/AR dictionary + LanguageProvider (RTL aware)
│   ├── theme.tsx           # Dark/light ThemeProvider (system-preference default)
│   ├── a11y.ts             # useDialog: focus trap, Escape, scroll lock, restore
│   ├── scroll-progress.ts  # Pure scroll-animation math (unit tested)
│   ├── useReveal.ts        # One-shot IntersectionObserver reveal primitive
│   └── suite.ts            # Ecosystem URLs (dev localhost / prod hosts)
├── test/setup.ts           # jsdom shims: matchMedia, IO, media playback
└── types/air-freight.ts    # Domain types (ULD, corridors, calculations)
```

### Key behaviours to preserve

- **Bilingual RTL**: `<html dir/lang>` flips at runtime; Arabic typography
  switches to Aref Ruqaa for headings; telemetry stays LTR-isolated.
- **Dual theme**: `data-theme` attribute + CSS custom properties; the inline
  bootstrap in `index.html` paints before React to avoid a flash. If you edit
  that script, recompute its SHA-256 and update `THEME_BOOTSTRAP_SHA256` in
  `vite.config.ts` (command is in a comment there).
- **Honesty model**: every simulated surface carries the ModelBadge
  disclosure; the calculator refuses to invent sea lanes for freehand
  distances; unknown AWB prefixes are labelled unknown, not guessed.
- **CSP**: build injects a `<meta>` CSP allowing exactly one inline script
  (the theme bootstrap, by digest). Clickjacking protection comes from
  `X-Frame-Options` in `vercel.json` headers (meta cannot carry it).

## Asset pipeline

Full-resolution masters live in `assets-src/` (gitignored, never deployed).
`npm run optimize:assets` regenerates `public/assets/`:

- `cargo-village.webp` (1200w), `founder.webp` (192w) — page images
- `og-image.jpg` (1200×630) — branded social card
- `icon-192/512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
- `runway-scrub.mp4` is committed directly (video is not re-encoded here)

A fresh clone cannot re-run the script until the masters are restored from
your backup of `assets-src/`.

## Testing & quality gates (CI: `.github/workflows/ci.yml`)

1. `tsc --noEmit` — strict, no unused locals.
2. `eslint . --max-warnings 0` — typescript-eslint + react-hooks (v6 rules).
3. `vitest run` — 77 tests: IATA/GLEC math, Mod-7 validator, corridor data
   integrity, i18n EN↔AR structural parity, theme/language providers, modal
   flows (AWB checker, quote composer), tracker flows, and an **axe-core
   accessibility scan of the full composed page**.
4. `vite build` + **performance budget** (gzip: JS ≤ 140 kB, CSS ≤ 24 kB,
   no shipped image > 400 kB).
5. `npm audit --omit=dev --audit-level=high`.

Component tests run under `prefers-reduced-motion: reduce` on purpose: the
calm render path is the path under test; motion math is covered by pure unit
tests.

## Deployment (Vercel)

`dist/` is tracked in this repository and deployed as static output.
`vercel.json` adds security headers (nosniff, XFO, referrer, permissions,
HSTS) and immutable caching for hashed assets. Static extras ship from
`public/`: `404.html`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`.

## Licence & ownership

All code, copy, brand marks and photography in this repository are the
owner's work product. The YASLOGIST monogram, the corridor/ULD reference
copy and the founder portrait are proprietary assets of YASLOGIST.
