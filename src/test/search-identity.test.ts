import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');
const base = 'https://air.yaslogist.me';

describe('public Air discoverability and honest identity', () => {
  it('uses only the live Air origin in canonical and share metadata', () => {
    const html = read('index.html');
    expect(html).toContain('<link rel="canonical" href="' + base + '"');
    expect(html).toContain('<meta property="og:url" content="' + base + '"');
    expect(html).toContain('content="' + base + '/assets/og-image-animated.gif"');
    expect(html).toContain('content="' + base + '/assets/og-image-static.jpg"');
    expect(html).not.toContain('air.yaslogist.com');
  });

  it('describes the simulation without claiming an airport integration', () => {
    const html = read('index.html');
    expect(html).toContain('interactive simulation of air-freight planning');
    expect(html).toContain('Not connected to live carriers or airport systems.');
    expect(html).not.toContain('directly integrated with Cairo International Airport');
  });

  it('connects navigational defaults to reachable public origins', () => {
    const suite = read('src/lib/suite.ts');
    for (const host of [
      'https://www.yaslogist.com', 'https://land.yaslogist.me',
      'https://ocean.yaslogist.me', base
    ]) {
      expect(suite).toContain(host);
    }
    for (const broken of [
      'https://land.yaslogist.com', 'https://ocean.yaslogist.com',
      'https://air.yaslogist.com'
    ]) {
      expect(suite).not.toContain(broken);
    }
    expect((read('src/lib/i18n.tsx').match(/subdomain: 'air.yaslogist.me'/g) || []).length).toBe(2);
  });

  it('exposes a one-page sitemap and allows indexing of JS/assets', () => {
    const robots = read('public/robots.txt');
    const sitemap = read('public/sitemap.xml');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).not.toMatch(/Disallow:\s*\/assets/);
    expect(robots).toContain('Sitemap: ' + base + '/sitemap.xml');
    expect(sitemap).toContain('<loc>' + base + '/</loc>');
    expect((sitemap.match(/<loc>/g) || []).length).toBe(1);
  });
});
