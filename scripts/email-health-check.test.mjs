import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { countSpfLookups, dkimKeyBits } from './email-health-check.mjs';

/* Guards for the mail-health tooling and the MTA-STS policy this repo serves.
   Everything here is offline: DNS is faked, keys are generated, only the policy
   file is read from disk. Kept as .mjs beside the script so `tsc --noEmit`
   (which only includes src/) never has to type a Node ESM module. */

const spki = (modulusLength) =>
  generateKeyPairSync('rsa', { modulusLength }).publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

describe('dkimKeyBits', () => {
  it('reads the modulus size of a 1024-bit DKIM key', () => {
    /* The live zmail._domainkey value for yaslogist.com at the time of writing:
       the selector that needed rotating. A regression here silently reports the
       key as "unreadable" and the rotation gets lost. */
    const published =
      'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkK3o3TV+UIJV9CYbmIBrk8j416/Spe4nqX2W9vfkLpCdF7pVsr6GR4c' +
      'bvcjbOxLSq1uENdXlDIYZNZx4ty7UbJXG2kD20OH3EDVB7AnkwQmDu7NSUzUTbgy6oGZ4fd+3EhSgBAqaGyqFd1qECnsUM2vDUP8au' +
      'LcHPqS55bB2pvwIDAQAB';
    expect(dkimKeyBits(published)).toBe(1024);
  });

  it('reads 2048- and 4096-bit keys', () => {
    expect(dkimKeyBits(spki(2048))).toBe(2048);
    expect(dkimKeyBits(spki(4096))).toBe(4096);
  });

  it('ignores whitespace that receivers tolerate inside the value', () => {
    const key = spki(2048);
    const wrapped = key.replace(/(.{64})/g, '$1\n');
    expect(dkimKeyBits(wrapped)).toBe(2048);
  });

  it('returns null for values it cannot parse', () => {
    expect(dkimKeyBits('')).toBeNull();
    expect(dkimKeyBits('not-a-key')).toBeNull();
    expect(dkimKeyBits(undefined)).toBeNull();
  });
});

describe('countSpfLookups', () => {
  const resolverFor = (zone) => async (name) => zone[name] ?? [];

  it('counts nested includes, a, mx and redirect against the RFC 7208 ceiling', async () => {
    const zone = {
      'example.com': ['v=spf1 include:_spf.a.com include:_spf.b.com a mx ~all'],
      '_spf.a.com': ['v=spf1 include:_spf.c.com ip4:192.0.2.0/24 -all'],
      '_spf.b.com': ['v=spf1 ip4:198.51.100.0/24 -all'],
      '_spf.c.com': ['v=spf1 ip4:203.0.113.0/24 -all'],
    };
    /* Root: include a, include b, a, mx = 4. Nested: _spf.a.com includes
       _spf.c.com = 1 more. ip4 terms are free. Total 5. */
    expect(await countSpfLookups(resolverFor(zone), 'example.com')).toBe(5);
  });

  it('stops on include loops instead of recursing forever', async () => {
    const zone = {
      'example.com': ['v=spf1 include:loop.com ~all'],
      'loop.com': ['v=spf1 include:example.com ~all'],
    };
    expect(await countSpfLookups(resolverFor(zone), 'example.com')).toBe(2);
  });
});

describe('MTA-STS policy', () => {
  const policy = readFileSync('public/.well-known/mta-sts.txt', 'utf8');

  it('is a valid STSv1 policy', () => {
    expect(policy).toMatch(/^version:\s*STSv1$/m);
    expect(policy).toMatch(/^mode:\s*(enforce|testing)$/m);
    expect(policy).toMatch(/^max_age:\s*\d+$/m);
  });

  it('covers every MX host that receives this domain', () => {
    const listed = [...policy.matchAll(/^mx:\s*(\S+)$/gm)].map((match) => match[1]);
    expect(listed).toEqual(expect.arrayContaining(['mx.zoho.com', 'mx2.zoho.com', 'mx3.zoho.com']));
  });

  it('ships the identical policy in the prebuilt dist/ output', () => {
    /* dist/ is committed and deployed directly on some paths; a policy that
       only exists in public/ would never be served by that deploy. */
    expect(readFileSync('dist/.well-known/mta-sts.txt', 'utf8')).toBe(policy);
  });
});
