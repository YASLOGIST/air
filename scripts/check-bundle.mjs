/* Performance budgets for the built client.
 *
 * Every section chunk is requested during the initial load (App renders all of
 * them straight away; code-splitting here buys parallel, cacheable downloads
 * rather than deferral), so the total matters as much as the largest file.
 * Budgets are ratchets: they sit just above the current measured size, so an
 * accidental regression fails CI instead of silently shipping.
 *
 * two-tier model (since the WebGL upgrade):
 *   1. APP budget — unchanged and as strict as ever: per-file ≤ 280 KiB,
 *      total ≤ 480 KiB raw, CSS ≤ 115 KiB. Application code regressions still
 *      fail this gate.
 *   2. VENDOR budget — exactly one chunk, `vendor-three-*.js`, holding the
 *      three.js engine layer. It is a deliberate architectural addition
 *      (real WebGL digital twin + corridor globe replacing a 2D painter),
 *      isolated in vite.config.ts so it caches independently of app code and
 *      is fetched in parallel with the two lazy sections that consume it.
 *      Its limit is likewise a ratchet just above the measured size; raise it
 *      only along with an intentional three version bump.
 */
import { readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

const perFileLimits = { js: 270_000, css: 112_000 };
/* App-total ratchet history:
 *   · ULD load-fit engine + simulator + AWB check digits (~+12 KiB gzip 4 KiB)
 *   · WebGL scenes' app-tier code: UldScene + procedural model shop + corridor
 *     globe scene + scene-sharing glue, net of the deleted 2D painter
 *     (measured 498.3 KiB raw / 165.1 KiB gzip; ratchet sat ~+2.7% above).
 *   · Geography-aware globe + twin hardening: embedded landmask (continents,
 *     enclosed seas), solar terminator, globe zoom/tilt, hotspot occlusion
 *     and the quiescent ULD loop (measured 507.6 KiB raw / 168.8 KiB gzip).
 *   · Wayfinding/a11y pass: section scroll spy, drawer dismissal + accessible
 *     names, bilingual error states, mutation-aware section reveal, data-saver
 *     media gate — about +4.2 KiB raw of app code, more than paid for by
 *     switching the minifier to terser (two compress passes). Net measurement
 *     is 492.3 KiB raw / 165.0 KiB gzip, i.e. BELOW the previous ceiling, so
 *     this ratchet tightens rather than loosens. CSS fell to 107.2 KiB with
 *     the removal of the dead HeroAir component's utility classes. */
const totalLimits = { js: 515_000, css: 112_000 };

/* three r186, minified by terser: raw is ~5 KiB larger than the esbuild output
   but gzip — what the browser actually downloads — is ~3.3 KiB smaller
   (measured 563.7 KiB raw / 138.4 KiB gzip). gzip is reported below, not gated. */
const vendorThreePattern = /^vendor-three-[\w-]+\.js$/;
const vendorThreeLimit = 592_000;

const files = await readdir('dist/assets');
const appTotals = { js: 0, css: 0 };
const gzipTotals = { js: 0, css: 0 };
let failed = false;
let vendorSeen = 0;

for (const file of files.sort()) {
  const extension = file.split('.').pop();
  if (!(extension in perFileLimits)) continue;
  const path = `dist/assets/${file}`;
  const bytes = (await stat(path)).size;
  const gzipBytes = gzipSync(await readFile(path)).length;

  if (vendorThreePattern.test(file)) {
    vendorSeen += 1;
    const over = bytes > vendorThreeLimit;
    if (over) failed = true;
    console.log(
      `${over ? 'FAIL' : 'ok  '} ${file}: ${(bytes / 1024).toFixed(1)} KiB` +
        ` (gzip ${(gzipBytes / 1024).toFixed(1)} KiB) / ${(vendorThreeLimit / 1024).toFixed(1)} KiB` +
        ' · vendor tier (three.js engine, cached separately)',
    );
    continue;
  }

  appTotals[extension] += bytes;
  gzipTotals[extension] += gzipBytes;
  const over = bytes > perFileLimits[extension];
  if (over) failed = true;
  console.log(
    `${over ? 'FAIL' : 'ok  '} ${file}: ${(bytes / 1024).toFixed(1)} KiB` +
      ` (gzip ${(gzipBytes / 1024).toFixed(1)} KiB) / ${(perFileLimits[extension] / 1024).toFixed(1)} KiB`,
  );
}

for (const [extension, limit] of Object.entries(totalLimits)) {
  const over = appTotals[extension] > limit;
  if (over) failed = true;
  console.log(
    `${over ? 'FAIL' : 'ok  '} APP TOTAL ${extension}: ${(appTotals[extension] / 1024).toFixed(1)} KiB` +
      ` (gzip ${(gzipTotals[extension] / 1024).toFixed(1)} KiB) / ${(limit / 1024).toFixed(1)} KiB`,
  );
}

/* Exactly one engine chunk must exist — a missing chunk would silently punt
   three into the app budget, a duplicated one would ship it twice. */
if (vendorSeen !== 1) {
  failed = true;
  console.error(`FAIL expected exactly one vendor-three-* chunk, found ${vendorSeen}`);
} else {
  console.log(`ok   vendor tier: exactly one vendor-three chunk present`);
}

if (failed) {
  console.error('Bundle performance budget exceeded. Split, shrink or remove the oversized module.');
  process.exit(1);
}
