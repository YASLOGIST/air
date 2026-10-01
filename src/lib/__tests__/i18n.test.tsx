import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DICTIONARY, LanguageProvider, useLang } from '../i18n';
import type { Dict } from '../i18n';

/* A missing Arabic key renders as `undefined` in the UI — this test compares
   the key trees of both dictionaries structurally so a one-sided edit fails
   CI instead of shipping a blank string. */

function keyTree(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keyTree(v, prefix ? `${prefix}.${k}` : k));
}

describe('DICTIONARY structural parity', () => {
  it('exposes exactly the languages en and ar', () => {
    expect(Object.keys(DICTIONARY).sort()).toEqual(['ar', 'en']);
  });

  it('has identical key trees in EN and AR', () => {
    const en = keyTree(DICTIONARY.en).sort();
    const ar = keyTree(DICTIONARY.ar).sort();
    expect(ar).toEqual(en);
  });

  it('has no empty strings in either language', () => {
    for (const lang of ['en', 'ar'] as const) {
      const dict: Dict = DICTIONARY[lang];
      const walk = (v: unknown, path: string) => {
        if (typeof v === 'string') {
          expect(v.length, `${lang}:${path} is empty`).toBeGreaterThan(0);
        } else if (Array.isArray(v)) {
          v.forEach((item, i) => walk(item, `${path}[${i}]`));
        } else if (typeof v === 'object' && v !== null) {
          for (const [k, child] of Object.entries(v)) walk(child, `${path}.${k}`);
        }
      };
      walk(dict, 'dict');
    }
  });

  it('ships the quote conversion copy in both languages', () => {
    expect(DICTIONARY.en.quote.navCta).toBeTruthy();
    expect(DICTIONARY.ar.quote.navCta).toBeTruthy();
    expect(DICTIONARY.en.quote.emailSubject).not.toBe(DICTIONARY.ar.quote.emailSubject);
  });
});

describe('LanguageProvider', () => {
  const Probe: React.FC = () => {
    const { lang, isRtl, toggleLang } = useLang();
    return (
      <div>
        <span data-testid="lang">{lang}</span>
        <span data-testid="rtl">{String(isRtl)}</span>
        <button type="button" onClick={toggleLang}>
          toggle
        </button>
      </div>
    );
  };

  it('defaults to English and LTR', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('rtl')).toHaveTextContent('false');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches the document to RTL Arabic and persists the choice', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('lang')).toHaveTextContent('ar');
    expect(screen.getByTestId('rtl')).toHaveTextContent('true');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(localStorage.getItem('yaslogist-air-lang')).toBe('ar');
  });

  it('honours a stored Arabic preference on mount', () => {
    localStorage.setItem('yaslogist-air-lang', 'ar');
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang')).toHaveTextContent('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
