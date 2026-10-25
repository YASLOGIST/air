import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../lib/i18n';

/* The site is left-to-right, always. Language changes the words — including
   the Arabic font stack — but never the layout direction: the radar, charts,
   tables and numeric readouts are laid out on an LTR grid and mirroring them
   reversed the reading order of every data visual. These assertions keep that
   decision from being undone one `dir={isRtl ? 'rtl' : 'ltr'}` at a time. */

const read = (path: string) => readFileSync(path, 'utf8');
const componentSources = readdirSync('src/components', { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({ file: `src/components/${file}`, source: read(`src/components/${file}`) }));

describe('fixed LTR direction', () => {
  it('pins the document direction in both the provider and the pre-paint bootstrap', () => {
    expect(read('src/lib/i18n.tsx')).toMatch(/root\.dir = 'ltr';/);
    expect(read('public/theme-init.js')).toMatch(/root\.dir = 'ltr';/);
    expect(read('index.html')).toMatch(/<html[^>]*dir="ltr"/);
  });

  it('never derives direction from the language', () => {
    expect(read('src/lib/i18n.tsx')).not.toMatch(/dir\s*=\s*lang ===/);
    expect(read('public/theme-init.js')).not.toMatch(/language === 'ar' \? 'rtl'/);
  });

  it('has no component that flips its own subtree', () => {
    const offenders = componentSources.filter(({ source }) => /dir=\{isRtl/.test(source)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('carries no right-to-left utility classes', () => {
    const offenders = componentSources.filter(({ source }) => /\brtl:/.test(source)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('keeps the layout LTR when the copy is switched to Arabic', async () => {
    const user = userEvent.setup();
    const original = globalThis.localStorage?.getItem('yaslogist-air-lang');
    const { container } = render(
      <LanguageProvider>
        <button type="button" onClick={() => undefined}>
          probe
        </button>
      </LanguageProvider>,
    );
    // The provider writes direction on <html>, not on its own subtree.
    expect(document.documentElement.dir).toBe('ltr');
    document.documentElement.lang = 'ar';
    expect(document.documentElement.dir).toBe('ltr');
    expect(container.querySelector('[dir="rtl"]')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'probe' }));
    if (original) globalThis.localStorage?.setItem('yaslogist-air-lang', original);
  });
});
