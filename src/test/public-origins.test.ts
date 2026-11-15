import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync('index.html', 'utf8');
const suite = readFileSync('src/lib/suite.ts', 'utf8');
const robots = readFileSync('public/robots.txt', 'utf8');
const sitemap = readFileSync('public/sitemap.xml', 'utf8');

describe('public origin and crawlability contract', () => {
  it('publishes canonical and social URLs on the actual deployed Air hostname', () => {
    expect(html).toContain('rel="canonical" href="https://air.yaslogist.me/"');
    expect(html).toContain('property="og:url" content="https://air.yaslogist.me/"');
    expect(html).toContain('https://air.yaslogist.me/assets/og-image-animated.gif');
    expect(html).toContain('https://air.yaslogist.me/assets/og-image-static.jpg');
    expect(html).not.toContain('air.yaslogist.com');
    expect(html).not.toContain('directly integrated with Cairo International Airport');
  });

  it('uses reachable, public suite links without requiring environment overrides', () => {
    for (const origin of [
      'https://www.yaslogist.com',
      'https://land.yaslogist.me',
      'https://ocean.yaslogist.me',
      'https://air.yaslogist.me',
    ]) {
      expect(suite).toContain(origin);
    }
    expect(suite).not.toContain('land.yaslogist.com');
    expect(suite).not.toContain('ocean.yaslogist.com');
    expect(suite).not.toContain('air.yaslogist.com');
  });

  it('advertises an actual sitemap matching the canonical page', () => {
    expect(robots).toContain('Sitemap: https://air.yaslogist.me/sitemap.xml');
    expect(sitemap).toContain('<loc>https://air.yaslogist.me/</loc>');
    expect(sitemap).not.toContain('air.yaslogist.com');
  });
});
