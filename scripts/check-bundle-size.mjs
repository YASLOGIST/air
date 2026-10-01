/* ── Performance budget guard ──────────────────────────────────────────────
   Fails CI when the production build outgrows its budget. Budgets are set
   with headroom over the measured 2026-10 baseline (JS 116 kB gzip, CSS
   14.3 kB gzip, page-critical assets ≈ 480 kB total) so a regression is
   caught before it ships, not after a Lighthouse report says so.

   Run with:  node scripts/check-bundle-size.mjs   (after `vite build`)
────────────────────────────────────────────────────────────────────────── */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
if (!existsSync(DIST)) {
  console.error('✖ dist/ not found — run `npm run build` first.');
  process.exit(1);
}

/* Budgets in gzipped bytes. */
const BUDGETS = {
  js: 140 * 1024, // entry + lazy chunks, all JS on the page if opened
  css: 24 * 1024,
};

const files = readdirSync(path.join(DIST, 'assets'));
const metrics = [];
let failed = false;

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

for (const name of files) {
  const file = path.join(DIST, 'assets', name);
  const raw = readFileSync(file);
  const gzip = gzipSync(raw).length;
  metrics.push({ name, raw: raw.length, gzip });
}

const js = metrics.filter((m) => /\.js$/.test(m.name));
const css = metrics.filter((m) => /\.css$/.test(m.name));
const sum = (arr, key) => arr.reduce((t, m) => t + m[key], 0);

console.table(
  metrics.map((m) => ({ file: m.name, raw: kb(m.raw), gzip: kb(m.gzip) })),
);

const jsGzip = sum(js, 'gzip');
const cssGzip = sum(css, 'gzip');

const checks = [
  { label: 'JS (gzip, all chunks)', value: jsGzip, budget: BUDGETS.js },
  { label: 'CSS (gzip)', value: cssGzip, budget: BUDGETS.css },
];

for (const c of checks) {
  const ok = c.value <= c.budget;
  if (!ok) failed = true;
  console.log(
    `${ok ? '✔' : '✖'} ${c.label}: ${kb(c.value)} / budget ${kb(c.budget)}`,
  );
}

/* Media sanity: nothing *page-critical* should approach the old 2.4 MB video
   weight; the video stays lazy so it is excluded. Flag any single image
   shipped into dist above 400 kB. */
for (const m of metrics.filter((m) => /\.(png|jpe?g|webp|svg)$/i.test(m.name))) {
  if (m.raw > 400 * 1024) {
    console.log(`✖ image over 400 kB: ${m.name} (${kb(m.raw)})`);
    failed = true;
  }
}

if (failed) {
  console.error('\nPerformance budget exceeded — see rows above.');
  process.exit(1);
}
console.log('\n✔ Performance budget respected.');
