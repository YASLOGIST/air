import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEME_COLORS } from '../lib/theme';

/* The daylight brief is easy to regress silently: a stray `bg-[#070c14]`, a
   swapped font stack, or moving smooth scrolling back onto the bare `html`
   rule (where it ignores the reduced-motion preference) all keep the test
   suite green because jsdom has no layout or paint. These assertions pin the
   four decisions at the source level. */

const css = readFileSync('src/index.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const bootstrap = readFileSync('public/theme-init.js', 'utf8');

/* Every TSX file that ships to the browser, so the class-name assertions below
   cannot be dodged by adding a component in a new folder. */
const componentSources = [
  'src/App.tsx',
  ...readdirSync('src/components', { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => `src/components/${file}`),
].map((file) => ({ file, source: readFileSync(file, 'utf8') }));

describe('daylight design contract', () => {
  it('paints an opaque white surface by default', () => {
    expect(css).toMatch(/:root,\s*\[data-theme="light"\]\s*\{[\s\S]*?--c-bg:\s*#FFFFFF/i);
    expect(css).toMatch(/:root,\s*\[data-theme="light"\]\s*\{[\s\S]*?--c-card-solid:\s*#FFFFFF/i);
    expect(THEME_COLORS.light.toUpperCase()).toBe('#FFFFFF');
    expect(html).toMatch(/<html[^>]*data-theme="light"/);
    expect(html).toMatch(/<meta\s+name="theme-color"\s+content="#FFFFFF"/);
  });

  it('defaults to white without consulting the OS dark preference', () => {
    expect(bootstrap).toContain("storedTheme === 'dark' ? 'dark' : 'light'");
    expect(bootstrap).not.toContain('prefers-color-scheme');
  });

  it('enables smooth scrolling only when motion is not reduced', () => {
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{\s*html\s*\{\s*scroll-behavior:\s*smooth/,
    );
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?scroll-behavior:\s*auto\s*!important/);
  });

  it('uses Inter as the single Latin family', () => {
    expect(css).toMatch(/--font-sans:\s*"Inter"/);
    expect(css).toMatch(/--font-display:\s*"Inter"/);
    expect(css).toMatch(/--font-serif:\s*"Inter"/);
    expect(html).toMatch(/family=Inter:wght@400;500;600;700/);
    expect(html).not.toMatch(/family=Archivo/);
  });

  it('keeps one accent hue for daylight decoration', () => {
    expect(css).toMatch(/:root,\s*\[data-theme="light"\]\s*\{[\s\S]*?--c-accent:\s*#0369A1/i);
    expect(css).toMatch(/\[class\*="text-cyan-"\],\s*\[class\*="text-sky-"\]/);
  });

  it('expresses theme changes through tokens, never through `dark:` utilities', () => {
    /* A `dark:` utility costs ~160 bytes of selector each and forces every
       component to carry two colour decisions. The palette is now one token
       vocabulary that flips per theme, so any new `dark:` class is a
       regression in both bundle size and consistency. */
    const offenders = componentSources
      .filter(({ source }) => /\bdark:/.test(source))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('defines the four status inks and re-scopes them on dark instrument surfaces', () => {
    const light = css.match(/:root,\s*\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    const dark = css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    for (const token of ['--c-ok', '--c-cold', '--c-warn', '--c-alert', '--c-track']) {
      expect(light).toContain(`${token}:`);
      expect(dark).toContain(`${token}:`);
    }
    /* A dark panel on a white page must not inherit the daylight inks. */
    expect(css).toMatch(/\.avionics-panel,\s*\.avionics-well\s*\{[\s\S]*?--c-muted:\s*#9BB0BC/);
  });

  it('keeps one flat weight scale', () => {
    const banned = /\bfont-(thin|extralight|light|bold|extrabold|black)\b/;
    const offenders = componentSources
      .filter(({ source }) => banned.test(source))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
    expect(css).not.toMatch(/font-weight:\s*(100|200|300|800|900)\b/);
  });
});
