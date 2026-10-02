import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECTION_ANCHOR_OFFSET_PX } from '../lib/use-active-section';

/* Why this file exists.
 *
 * `src/index.css` shipped for several releases with backslash-escaped quotes
 * inside its attribute selectors — `[lang=\"ar\"]`, `[data-theme=\"dark\"]`,
 * `[class*=\"tracking-\"]`. CSS treats `\"` as an escaped literal quote inside
 * the *value*, so Lightning CSS faithfully emitted `[lang='"ar"']`: a selector
 * matching elements whose `lang` attribute is the five-character string `"ar"`.
 * Nothing in the DOM ever carries that, so the whole Arabic typography block
 * (font binding, cursive-join letter-spacing reset, heading metrics) and the
 * dark-theme kicker accent were dead rules in every production build, while
 * still looking correct in source review.
 *
 * Nothing else in the toolchain can catch this: it is valid CSS, the build
 * succeeds, and jsdom has no layout engine to notice the missing styles. So
 * the contract is asserted here, at the source level, in two layers:
 *   1. a general structural check — no attribute selector may contain an
 *      escaped quote, whatever rule it belongs to;
 *   2. explicit pins for the specific rules whose silent loss is expensive.
 */

const css = readFileSync('src/index.css', 'utf8');

/** Attribute selectors, e.g. `[lang="ar"]` → captures name `lang`, value `ar`. */
const ATTRIBUTE_SELECTOR = /\[([a-zA-Z-]+)(?:([~^|$*]?=)("[^"]*"|'[^']*'|[^\]\s]+))?\s*[iIsS]?\]/g;

describe('index.css selector contract', () => {
  it('contains no backslash-escaped quotes', () => {
    const offenders = css
      .split('\n')
      .map((line, index) => ({ line: index + 1, text: line.trim() }))
      .filter((entry) => entry.text.includes('\\"') || entry.text.includes("\\'"));

    expect(
      offenders,
      'Escaped quotes in CSS become part of the literal value: `[lang=\\"ar\\"]` ' +
        'compiles to `[lang=\'"ar"\']` and matches nothing.',
    ).toEqual([]);
  });

  it('never embeds a quote character inside an attribute selector value', () => {
    const malformed: string[] = [];
    for (const match of css.matchAll(ATTRIBUTE_SELECTOR)) {
      const [selector, , , rawValue] = match;
      if (!rawValue) continue;
      const value = /^["']/.test(rawValue) ? rawValue.slice(1, -1) : rawValue;
      if (value.includes('"') || value.includes("'") || value.includes('\\')) {
        malformed.push(selector);
      }
    }
    expect(malformed).toEqual([]);
  });

  /* The bilingual contract. Arabic is a first-class language here, not a
     translation layer: these three rules are what keep Arabic from rendering
     in a Latin-only font stack with condensed widths and letter-spacing
     applied across cursive joins. */
  it('binds Arabic body and heading text to the Arabic font stacks', () => {
    expect(css).toMatch(/\[lang="ar"\]\s+body\s*,/);
    expect(css).toMatch(/\[lang="ar"\]\s+\.h1-hero\s*,/);
    expect(css).toContain('font-family: var(--font-ar-tech)');
    expect(css).toContain('font-family: var(--font-ruqaa)');
  });

  it('neutralises Latin letter-spacing utilities on Arabic text', () => {
    /* Arabic is cursive: any positive tracking breaks the glyph joins. */
    expect(css).toMatch(/\[lang="ar"\]\s+\[class\*="tracking-"\]\s*\{\s*letter-spacing:\s*0\s*!important/);
  });

  it('keeps the theme-specific kicker accent reachable', () => {
    expect(css).toMatch(/\[data-theme="dark"\]\s+\.kicker\s*\{/);
  });

  /* The textual pins above would still pass if someone wrote a selector that
     is well-formed but targets markup this app never produces. These run the
     selectors against the attributes the providers actually set on <html>
     (see LanguageProvider / ThemeProvider / public/theme-init.js). With the
     escaped-quote form they match nothing, which is precisely how the defect
     survived review. */
  describe('selectors match the markup the app renders', () => {
    const selectorsFor = (pattern: RegExp) =>
      [...css.matchAll(pattern)].map((match) => match[0].split('{')[0].trim());

    it('reaches Arabic text under a right-to-left document', () => {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
      document.documentElement.dataset.theme = 'dark';
      /* One element per rule the Arabic block targets, as the components
         actually write them (see MissionAir, StanceAir, ConsignmentTracker). */
      document.body.innerHTML = [
        '<p class="kicker tracking-wider">رادار تتبع الشحنات الجوية</p>',
        '<h2 class="h2-display">الركائز التشغيلية الجوية</h2>',
        '<span class="display">محاكاة تشغيلية</span>',
      ].join('');

      const selectors = selectorsFor(/\[lang="ar"\][^{]*\{/g);
      expect(selectors.length).toBeGreaterThanOrEqual(4);
      for (const selector of selectors) {
        expect(document.querySelector(selector), `no element matches: ${selector}`).not.toBeNull();
      }
    });

    it('reaches the kicker under the dark theme', () => {
      document.documentElement.dataset.theme = 'dark';
      document.body.innerHTML = '<p class="kicker">Consignment Radar</p>';
      expect(document.querySelector('[data-theme="dark"] .kicker')).not.toBeNull();
    });
  });

  it('keeps the section reading line below the anchor landing point', () => {
    /* `scroll-padding-top` decides where an in-page anchor parks a section;
       the navbar's scroll spy decides which section is "current". If the spy
       reads *above* the landing point, clicking an anchor highlights the
       section before it. */
    const match = css.match(/scroll-padding-top:\s*([\d.]+)rem/);
    expect(match, 'html no longer declares scroll-padding-top').not.toBeNull();
    const landingPx = Number(match![1]) * 16;
    expect(SECTION_ANCHOR_OFFSET_PX).toBeGreaterThan(landingPx);
    expect(SECTION_ANCHOR_OFFSET_PX - landingPx).toBeLessThanOrEqual(48);
  });

  it('leaves anchor offsets to scroll-padding alone', () => {
    /* Per-section `scroll-mt-*` used to stack on top of the document's
       scroll-padding, parking six of the eight anchors 176px down while the
       other two landed at 80px. One mechanism, one landing point. */
    expect(css).not.toMatch(/scroll-margin-top/);
  });

  it('declares tabular numerals with a parseable font-feature-settings value', () => {
    /* `font-feature-settings: \"tnum\" 1` is dropped by the parser outright. */
    const declarations = [...css.matchAll(/font-feature-settings:\s*([^;}]+)/g)].map((m) => m[1].trim());
    expect(declarations.length).toBeGreaterThan(0);
    for (const declaration of declarations) {
      expect(declaration).toMatch(/^"[a-z0-9]{4}"(\s+(0|1|on|off))?$/);
    }
  });
});
