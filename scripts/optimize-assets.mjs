/* ── Asset build pipeline ─────────────────────────────────────────────────
   Generates every derived image asset in public/assets from the master
   sources, so the shipped site never carries a full-resolution master:

     cargo-village.webp      1200w WebP of the apron photo (page fallback:
                              the original JPEG stays for old browsers)
     founder.webp            192w WebP of the founder portrait (rendered at
                              48 CSS px, 4x headroom)
     og-image.jpg            1200×630 branded social card built from the
                              hero master, which it then supersedes
     icon-192/512.png        PWA icons rasterised from the monogram SVG
     icon-maskable-512.png   same mark on a safe-area padded plate
     apple-touch-icon.png    180×180 iOS home-screen icon

   Idempotent. Masters are read from assets-src/ (gitignored); outputs land
   in public/assets/. Re-running on a fresh clone requires restoring the
   masters first (see README → Asset pipeline).

   Run with:  npm run optimize:assets
────────────────────────────────────────────────────────────────────────── */

import { mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/* Full-resolution masters live in assets-src/ (gitignored, never deployed —
   the repo's established convention). A fresh clone therefore cannot re-run
   this script without restoring the masters; it is documented here and in
   the README. */
const MASTERS = path.join(process.cwd(), 'assets-src');
const ASSETS = path.join(process.cwd(), 'public', 'assets');
await mkdir(ASSETS, { recursive: true });
const master = (name) => path.join(MASTERS, name);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const report = [];

async function emit(name, pipeline) {
  const file = path.join(ASSETS, name);
  const info = await pipeline.toFile(file);
  report.push({ name, dims: `${info.width}×${info.height}`, size: kb(info.size) });
}

/* The canonical monogram, kept visually identical to the inline favicon in
   index.html so the icon and the favicon are the same mark. */
const MONOGRAM_BODY = `
  <g stroke="#38bdf8" stroke-width="1.6" opacity=".55" fill="none">
    <ellipse cx="32" cy="32" rx="12.5" ry="29"/>
    <path d="M3 32h58M8 17.5h48M8 46.5h48"/>
  </g>
  <circle cx="32" cy="32" r="29" stroke-width="2.2" stroke="#9BB0BC" fill="none"/>
  <g stroke="#38bdf8" stroke-width="5" stroke-linecap="square" fill="none">
    <path d="M16 16 L27.5 31.5 L27.5 49"/>
    <path d="M39 16 L30 28"/>
    <path d="M40.5 20 L40.5 48 L53 48"/>
  </g>`;

const monogramSvg = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${MONOGRAM_BODY}</svg>`);

/* 1. Page photography → WebP */
await emit('cargo-village.webp',
  sharp(master('cargo-village.jpg')).resize({ width: 1200 }).webp({ quality: 78 }));

await emit('founder.webp',
  sharp(master('founder.jpg')).resize({ width: 192 }).webp({ quality: 82 }));

/* 2. Social card: hero master, cover-cropped to 1200×630, darkened, branded. */
const heroMaster = master('hero-air.jpg');
const ogOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050a12" stop-opacity=".82"/>
      <stop offset=".5" stop-color="#0a1424" stop-opacity=".62"/>
      <stop offset="1" stop-color="#050a12" stop-opacity=".92"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#v)"/>
  <rect x="0" y="628" width="1200" height="2" fill="#38bdf8" opacity=".65"/>
  <g transform="translate(96,186) scale(3.1)">${MONOGRAM_BODY}</g>
  <text x="96" y="468" font-family="DejaVu Sans, Arial, sans-serif" font-size="86" font-weight="bold" fill="#ffffff" letter-spacing="2">YASLOGIST AIR</text>
  <text x="98" y="522" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#7dd3fc" letter-spacing="6">TIME-CRITICAL AIR FREIGHT · CAIRO CARGO VILLAGE</text>
</svg>`);

const heroInfo = await stat(heroMaster).catch(() => null);
if (heroInfo) {
  await emit('og-image.jpg',
    sharp(heroMaster)
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .composite([{ input: ogOverlay }])
      .jpeg({ quality: 82, mozjpeg: true }));
  report.push({ name: 'og-image.jpg (from assets-src/hero-air.jpg master)', dims: '1200×630', size: kb(heroInfo.size) });
} else {
  report.push({ name: 'og-image.jpg', dims: '1200×630', size: 'skipped — no master' });
}

/* 3. PWA / touch icons from the monogram. */
await emit('icon-192.png', sharp(monogramSvg(192)).png());
await emit('icon-512.png', sharp(monogramSvg(512)).png());
await emit('apple-touch-icon.png', sharp(monogramSvg(180)).png());

const plate = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#0A0F16"/></svg>`);
const mark = await sharp(monogramSvg(318)).png().toBuffer();
await emit('icon-maskable-512.png', sharp(plate).composite([{ input: mark, gravity: 'centre' }]).png());

console.table(report);
