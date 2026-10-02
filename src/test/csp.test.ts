import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/* The app ships two copies of its Content-Security-Policy: the `vercel.json`
   response header (authoritative in production) and the `index.html` meta tag
   (what applies on any other host, and in `vite preview`). They had drifted —
   the meta copy additionally allowed `blob:` images/media and `data:` fonts,
   and omitted `form-action` and `upgrade-insecure-requests`. Browsers enforce
   the intersection, so the laxer copy bought nothing and only hid the drift.
   This test pins them together. */

type Directives = Record<string, string>;

function parsePolicy(policy: string): Directives {
  return Object.fromEntries(
    policy
      .split(';')
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...values] = directive.split(/\s+/);
        return [name, values.join(' ')];
      }),
  );
}

const headerPolicy = (() => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const value = vercel.headers
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === 'Content-Security-Policy')?.value;
  if (!value) throw new Error('vercel.json no longer sets a Content-Security-Policy header');
  return parsePolicy(value);
})();

const metaPolicy = (() => {
  const html = readFileSync('index.html', 'utf8');
  const match = html.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
  );
  if (!match) throw new Error('index.html no longer carries a Content-Security-Policy meta tag');
  return parsePolicy(match[1]);
})();

/** Directives a meta policy cannot express; browsers ignore them there. */
const HEADER_ONLY = new Set(['frame-ancestors', 'report-uri', 'sandbox']);

describe('content security policy', () => {
  it('declares the same directives in the meta tag and the response header', () => {
    const expected = Object.fromEntries(
      Object.entries(headerPolicy).filter(([name]) => !HEADER_ONLY.has(name)),
    );
    expect(metaPolicy).toEqual(expected);
  });

  it('keeps the baseline hardening directives', () => {
    expect(headerPolicy['default-src']).toBe("'self'");
    expect(headerPolicy['script-src']).toBe("'self'");
    expect(headerPolicy['object-src']).toBe("'none'");
    expect(headerPolicy['frame-ancestors']).toBe("'none'");
    expect(headerPolicy['base-uri']).toBe("'self'");
  });

  it('never allows inline or eval script', () => {
    expect(headerPolicy['script-src']).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(metaPolicy['script-src']).not.toMatch(/unsafe-inline|unsafe-eval/);
  });
});
