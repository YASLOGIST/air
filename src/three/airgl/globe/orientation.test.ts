import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/* The globe shipped upside down once: the coastline sheet was correct, but
   three's TextureLoader flips images by default while the shader's UV
   convention is already image-space, so the whole planet was sampled mirrored
   in latitude. Antarctica appeared where the Arctic belongs and every airport
   beacon sat on the wrong continent.

   Nothing in the type system or the DOM tests can see that, so the two
   invariants that jointly guarantee a north-up globe are pinned here:
     1. the raster itself is north-up (its first row is Arctic ocean, its last
        row is Antarctic land);
     2. the loader does not flip it on the way to the shader.
   If either changes, this file fails. */

const PNG_PATH = 'public/assets/earth/earth-land.png';

interface DecodedPng {
  width: number;
  height: number;
  /** Grayscale channel of one row, left to right. */
  row: (y: number) => Uint8Array;
}

/** Minimal decoder for the one format this asset uses: 8-bit gray+alpha. */
function decodeGrayAlphaPng(file: string): DecodedPng {
  const buffer = readFileSync(file);
  expect(buffer.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );

  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect(data[8]).toBe(8); // bit depth
      expect(data[9]).toBe(4); // colour type 4 = grayscale + alpha
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 2; // gray + alpha
  const stride = width * bpp;
  const gray = new Uint8Array(width * height);

  /* Undo the per-row filters in place order. The encoder only emits Sub, but
     None and Up are handled so a re-export with different settings still
     decodes rather than silently returning garbage. */
  const previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const line = raw.subarray(start + 1, start + 1 + stride);
    const out = new Uint8Array(stride);
    for (let i = 0; i < stride; i++) {
      const left = i >= bpp ? out[i - bpp] : 0;
      const up = previous[i];
      switch (filter) {
        case 0:
          out[i] = line[i];
          break;
        case 1:
          out[i] = (line[i] + left) & 255;
          break;
        case 2:
          out[i] = (line[i] + up) & 255;
          break;
        default:
          throw new Error(`unsupported PNG filter ${filter} on row ${y}`);
      }
    }
    previous.set(out);
    for (let x = 0; x < width; x++) gray[y * width + x] = out[x * bpp];
  }

  return { width, height, row: (y) => gray.subarray(y * width, y * width + width) };
}

const png = decodeGrayAlphaPng(PNG_PATH);

describe('globe orientation', () => {
  it('ships a north-up land raster', () => {
    const mean = (row: Uint8Array) => row.reduce((a, b) => a + b, 0) / row.length;

    /* Row 0 is the north pole. The Arctic is ocean, so coverage is ~0; the
       Antarctic interior is land, so the last row is ~255. A flipped asset
       inverts both, which is exactly the bug this guards. */
    expect(mean(png.row(0))).toBeLessThan(20);
    expect(mean(png.row(png.height - 1))).toBeGreaterThan(200);
  });

  it('places known landmasses in the right hemisphere of the sheet', () => {
    const sampleAt = (lat: number, lon: number) => {
      const x = Math.floor(((lon + 180) / 360) * png.width) % png.width;
      const y = Math.floor(((90 - lat) / 180) * png.height);
      return png.row(y)[x];
    };

    /* Land reads 255, ocean 0. These four points pin both axes: latitude via
       the Sahara/Indian-Ocean pair, longitude via the Atlantic/Africa pair. */
    expect(sampleAt(23, 10)).toBeGreaterThan(200); // Sahara
    expect(sampleAt(-20, 80)).toBeLessThan(50); // Indian Ocean
    expect(sampleAt(0, 20)).toBeGreaterThan(200); // Congo basin
    expect(sampleAt(0, -30)).toBeLessThan(50); // mid-Atlantic
  });

  it('does not let the texture loader flip the sheet against the shader UVs', () => {
    /* SURFACE_FRAGMENT computes v = 0.5 - lat / PI, i.e. v = 0 at the north
       pole and v = 1 at the south. That already matches the raster's row
       order, so flipY must stay off. */
    const scene = readFileSync('src/three/airgl/globe/scene.ts', 'utf8');
    expect(scene).toMatch(/land\.flipY\s*=\s*false/);
    expect(scene).toMatch(/vec2 uv = vec2\(lon \/ \(2\.0 \* PI\) \+ 0\.5, 0\.5 - lat \/ PI\)/);
  });
});
