/* Performance budgets for the built client.
 *
 * Every section chunk is requested during the initial load (App renders all of
 * them straight away; code-splitting here buys parallel, cacheable downloads
 * rather than deferral), so the total matters as much as the largest file.
 * Budgets are ratchets: they sit just above the current measured size, so an
 * accidental regression fails CI instead of silently shipping.
 */
import { readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

const perFileLimits = { js: 280_000, css: 115_000 };
/* Total ratchet last moved for the ULD load-fit engine + multi-piece simulator
 * + AWB check-digit suggestions (~12 KiB raw / ~4 KiB gzip of feature code). */
const totalLimits = { js: 480_000, css: 115_000 };

const files = await readdir('dist/assets');
const totals = { js: 0, css: 0 };
const gzipTotals = { js: 0, css: 0 };
let failed = false;

for (const file of files.sort()) {
  const extension = file.split('.').pop();
  if (!(extension in perFileLimits)) continue;
  const path = `dist/assets/${file}`;
  const bytes = (await stat(path)).size;
  const gzipBytes = gzipSync(await readFile(path)).length;
  totals[extension] += bytes;
  gzipTotals[extension] += gzipBytes;
  const over = bytes > perFileLimits[extension];
  if (over) failed = true;
  console.log(
    `${over ? 'FAIL' : 'ok  '} ${file}: ${(bytes / 1024).toFixed(1)} KiB` +
      ` (gzip ${(gzipBytes / 1024).toFixed(1)} KiB) / ${(perFileLimits[extension] / 1024).toFixed(1)} KiB`,
  );
}

for (const [extension, limit] of Object.entries(totalLimits)) {
  const over = totals[extension] > limit;
  if (over) failed = true;
  console.log(
    `${over ? 'FAIL' : 'ok  '} TOTAL ${extension}: ${(totals[extension] / 1024).toFixed(1)} KiB` +
      ` (gzip ${(gzipTotals[extension] / 1024).toFixed(1)} KiB) / ${(limit / 1024).toFixed(1)} KiB`,
  );
}

if (failed) {
  console.error('Bundle performance budget exceeded. Split, shrink or remove the oversized module.');
  process.exit(1);
}
