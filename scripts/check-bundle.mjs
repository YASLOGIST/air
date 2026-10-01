import { readdir, stat } from 'node:fs/promises';

const limits = { js: 300_000, css: 120_000 };
const files = await readdir('dist/assets');
let failed = false;
for (const file of files) {
  const extension = file.split('.').pop();
  if (!(extension in limits)) continue;
  const bytes = (await stat(`dist/assets/${file}`)).size;
  console.log(`${file}: ${(bytes / 1024).toFixed(1)} KiB / ${(limits[extension] / 1024).toFixed(1)} KiB`);
  if (bytes > limits[extension]) failed = true;
}
if (failed) {
  console.error('Bundle performance budget exceeded. Split or remove the oversized module.');
  process.exit(1);
}
