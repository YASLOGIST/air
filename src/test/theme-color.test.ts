import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEME_COLORS } from '../lib/theme';

/* The browser-chrome colour has to be applied twice: once by the pre-paint
   bootstrap in `public/theme-init.js` (which runs before any module loads)
   and once by `ThemeProvider` on every toggle. Two copies drift; this pins
   them, in the same spirit as src/test/csp.test.ts. */

const bootstrap = readFileSync('public/theme-init.js', 'utf8');
const html = readFileSync('index.html', 'utf8');

describe('theme-color', () => {
  it('ships a theme-color meta tag for the bootstrap to update', () => {
    expect(html).toMatch(/<meta\s+name="theme-color"\s+content="#[0-9A-Fa-f]{6}"\s*\/?>/);
  });

  it('declares the same per-theme colours in the bootstrap and the provider', () => {
    const table = bootstrap.match(/THEME_COLORS\s*=\s*(\{[^}]*\})/);
    expect(table, 'public/theme-init.js no longer declares a THEME_COLORS table').not.toBeNull();

    const bootstrapColors = Object.fromEntries(
      [...table![1].matchAll(/(\w+)\s*:\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]]),
    );
    expect(bootstrapColors).toEqual({ ...THEME_COLORS });
  });

  it('matches the surface colours the stylesheet actually paints', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const dark = css.match(/\[data-theme="dark"\]\s*\{[\s\S]*?--c-bg:\s*(#[0-9A-Fa-f]{6})/);
    const light = css.match(/\[data-theme="light"\]\s*\{[\s\S]*?--c-bg:\s*(#[0-9A-Fa-f]{6})/);
    expect(dark?.[1]?.toUpperCase()).toBe(THEME_COLORS.dark.toUpperCase());
    expect(light?.[1]?.toUpperCase()).toBe(THEME_COLORS.light.toUpperCase());
  });
});
