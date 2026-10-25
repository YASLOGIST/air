#!/usr/bin/env node
/**
 * Email deliverability & DNS health check for the YASLOGIST domains.
 *
 * Why this exists
 * ---------------
 * `ceo@yaslogist.com` is a Google Workspace mailbox while the domain's MX
 * points at Zoho (split delivery / relay). That mixed setup fails silently:
 * a rotated DKIM key, a second SPF record, one SPF include too many (the
 * RFC 7208 ceiling is 10 lookups), or a DMARC policy tightened before Google
 * signing exists will all degrade deliverability weeks before anyone notices.
 *
 * This script reads the live DNS and the HTTPS MTA-STS policy, then exits
 * non-zero on anything that blocks or spoofs mail, so a cron job catches the
 * regression instead of a customer's spam folder doing it first.
 *
 * Usage
 *   node scripts/email-health-check.mjs                 # human-readable table
 *   node scripts/email-health-check.mjs --json          # machine-readable
 *   node scripts/email-health-check.mjs --domain=example.com
 *   node scripts/email-health-check.mjs --strict        # warnings become failures
 *
 * Exit codes: 0 = healthy (warnings allowed), 1 = at least one FAIL.
 */

import { pathToFileURL } from 'node:url';
import { Resolver } from 'node:dns/promises';

const DEFAULT_DOMAIN = 'yaslogist.com';
/** DKIM selectors to probe. zmail = Zoho Mail, google = Google Workspace. */
const DKIM_SELECTORS = ['zmail', 'google', 'zoho', 'default'];
/** SPF mechanisms that cost a DNS lookup against the RFC 7208 limit of 10. */
const SPF_LOOKUP_MECHANISMS = /^(include|a|mx|ptr|exists|redirect)\b/i;
const SPF_MAX_LOOKUPS = 10;

/* ------------------------------------------------------------------ DKIM key */

/**
 * Read the RSA modulus size out of a DKIM `p=` value (base64 SubjectPublicKeyInfo).
 * Returns the bit length, or null when the payload cannot be parsed.
 */
export function dkimKeyBits(p) {
  if (typeof p !== 'string' || p.trim() === '') return null;
  const der = Buffer.from(p.replace(/\s+/g, ''), 'base64');
  let i = 0;
  const readLength = () => {
    let len = der[i++];
    if (len & 0x80) {
      const bytes = len & 0x7f;
      len = 0;
      for (let k = 0; k < bytes; k += 1) len = (len << 8) | der[i++];
    }
    return len;
  };
  if (der[i++] !== 0x30) return null; // SEQUENCE
  readLength();
  if (der[i++] !== 0x30) return null; // AlgorithmIdentifier
  /* Compound assignment reads `i` before the call mutates it, which lands one
     length byte early; keep the two steps apart. */
  const algorithmLength = readLength();
  i += algorithmLength;
  if (der[i++] !== 0x03) return null; // BIT STRING
  readLength();
  i += 1; // unused-bits octet
  if (der[i++] !== 0x30) return null; // RSAPublicKey
  readLength();
  if (der[i++] !== 0x02) return null; // modulus INTEGER
  let modulusBytes = readLength();
  if (der[i] === 0x00) {
    i += 1;
    modulusBytes -= 1;
  }
  return modulusBytes * 8;
}

/* ---------------------------------------------------------------------- SPF */

/**
 * Count the DNS lookups an SPF record consumes, following includes/redirects.
 * A record over the 10-lookup limit yields a permerror, which fails DMARC for
 * every message from the domain - the most common silent mail outage there is.
 */
export async function countSpfLookups(resolveTxt, name, seen = new Set(), budget = { lookups: 0 }) {
  if (seen.has(name) || budget.lookups > SPF_MAX_LOOKUPS + 1) return budget.lookups;
  seen.add(name);
  const spf = (await resolveTxt(name)).find((record) => /^v=spf1\b/i.test(record));
  if (!spf) return budget.lookups;
  for (const term of spf.split(/\s+/).slice(1)) {
    const [kind, value] = term.split(':');
    const mechanism = kind.toLowerCase();
    if ((mechanism === 'include' || mechanism === 'redirect') && value) {
      budget.lookups += 1;
      await countSpfLookups(resolveTxt, value, seen, budget);
    } else if (mechanism === 'a' || mechanism === 'mx' || mechanism === 'ptr') {
      budget.lookups += 1;
    } else if (SPF_LOOKUP_MECHANISMS.test(term)) {
      budget.lookups += 1;
    }
  }
  return budget.lookups;
}

/* --------------------------------------------------------------------- main */

async function run() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const strict = args.includes('--strict');
  const domain =
    (args.find((a) => a.startsWith('--domain=')) ?? `--domain=${DEFAULT_DOMAIN}`).split('=')[1] ||
    DEFAULT_DOMAIN;

  const resolver = new Resolver({ timeout: 5000, tries: 3 });
  const results = [];

  /** @param {'pass'|'warn'|'fail'} level */
  const record = (id, level, title, detail, fix) => {
    results.push({ id, level, title, detail, fix: level === 'pass' ? undefined : fix });
  };

  const txt = async (name) => {
    try {
      const rows = await resolver.resolveTxt(name);
      return rows.map((chunks) => chunks.join(''));
    } catch {
      return [];
    }
  };

  const mx = await (async () => {
    try {
      return await resolver.resolveMx(domain);
    } catch (error) {
      record('mx', 'fail', 'MX lookup failed', String(error?.code ?? error), 'Check the delegating nameservers and DNSSEC.');
      return null;
    }
  })();

  if (mx) {
    const sorted = [...mx].sort((a, b) => a.priority - b.priority);
    const hosts = sorted.map((entry) => `${entry.priority} ${entry.exchange}`).join(', ');
    const offsetZero = sorted.some((entry) => entry.priority === 0);
    record(
      'mx',
      offsetZero ? 'warn' : 'pass',
      'MX records',
      hosts,
      'A priority-0 MX is legal but ambiguous: keep the primary at >= 10 and give the backup a higher number.',
    );
    if (sorted.some((entry) => /zoho\.com$/i.test(entry.exchange))) {
      record(
        'mx-split',
        'warn',
        'Split delivery: MX = Zoho, mailbox = Google Workspace',
        'Inbound mail only reaches ceo@ while Zoho routing forwards it. If that rule breaks, the CEO mailbox goes dark while the domain still looks healthy.',
        'Either move MX to Google (one source of truth) or monitor external delivery into ceo@ on a schedule.',
      );
    }
  }

  const rootTxt = await txt(domain);
  const spfRecords = rootTxt.filter((recordValue) => /^v=spf1\b/i.test(recordValue));
  if (spfRecords.length === 0) {
    record('spf', 'fail', 'SPF record missing', 'No v=spf1 TXT at the apex.', 'Publish a single SPF record for the sending hosts.');
  } else if (spfRecords.length > 1) {
    record(
      'spf',
      'fail',
      'Multiple SPF records',
      spfRecords.join(' | '),
      'RFC 7208 allows exactly one; receivers treat duplicates as a permerror. Merge them.',
    );
  } else {
    const spf = spfRecords[0];
    const lookups = await countSpfLookups(txt, domain);
    const terminates = /(~|-|\?|\+)all\s*$/i.test(spf);
    record(
      'spf',
      lookups > SPF_MAX_LOOKUPS ? 'fail' : lookups >= 8 ? 'warn' : 'pass',
      'SPF record',
      `${spf}  (${lookups}/${SPF_MAX_LOOKUPS} DNS lookups)`,
      lookups > SPF_MAX_LOOKUPS
        ? 'Over the 10-lookup ceiling: SPF returns permerror and every message fails DMARC. Flatten the record or drop an unused sender.'
        : 'Keep headroom: every new include moves the record closer to permerror.',
    );
    record(
      'spf-all',
      terminates ? 'pass' : 'warn',
      'SPF termination',
      terminates ? 'Record ends with an all mechanism.' : 'No trailing all mechanism (defaults to neutral).',
      'End the record with ~all while relays are in play, -all once the sender list is complete.',
    );
    const hasZoho = /include:zoho\.com/i.test(spf);
    const hasGoogle = /include:_spf\.google\.com/i.test(spf);
    record(
      'spf-hosts',
      hasZoho && hasGoogle ? 'pass' : 'fail',
      'SPF authorises both mail hosts',
      `zoho=${hasZoho} google=${hasGoogle}`,
      'Both hosts send as this domain today; dropping either one breaks that host as a sender.',
    );
  }

  const dkimFound = [];
  for (const selector of DKIM_SELECTORS) {
    const values = await txt(`${selector}._domainkey.${domain}`);
    const dkim = values.find((value) => /v=DKIM1/i.test(value) || /\bp=/.test(value));
    if (!dkim) continue;
    const p = (dkim.match(/\bp=([A-Za-z0-9+/=\s]+)/) ?? [])[1] ?? '';
    const bits = p ? dkimKeyBits(p) : null;
    dkimFound.push({ selector, bits });
    record(
      `dkim-${selector}`,
      bits === null ? 'warn' : bits >= 2048 ? 'pass' : 'warn',
      `DKIM ${selector}._domainkey`,
      bits ? `RSA ${bits}-bit key published` : 'Record present but the key size is unreadable (revoked or non-RSA)',
      bits && bits < 2048
        ? `Rotate ${selector} to a 2048-bit key in the mail host admin console, then replace this TXT.`
        : undefined,
    );
  }
  for (const required of ['zmail', 'google']) {
    if (dkimFound.some((key) => key.selector === required)) continue;
    record(
      `dkim-${required}`,
      'warn',
      `DKIM missing: ${required}._domainkey`,
      required === 'google'
        ? 'Mail sent from Google Workspace as this domain carries no aligned DKIM signature; DMARC succeeds on SPF alignment alone. Tightening the policy before this record exists would reject the CEO\'s own mail.'
        : 'Zoho Mail signatures are not aligned to this domain, so DMARC depends on SPF alignment.',
      required === 'google'
        ? 'Google Admin console -> Apps -> Google Workspace -> Gmail -> Authenticate email -> generate new record, then publish it here.'
        : 'Zoho Mail Admin -> Email authentication -> DKIM -> publish selector zmail.',
    );
  }

  const dmarc = (await txt(`_dmarc.${domain}`)).find((value) => /^v=DMARC1/i.test(value));
  if (!dmarc) {
    record('dmarc', 'fail', 'DMARC record missing', `No v=DMARC1 TXT at _dmarc.${domain}.`, 'Publish a DMARC record, starting at p=none with reporting.');
  } else {
    const policy = (dmarc.match(/\bp=(\w+)/i) ?? [])[1]?.toLowerCase() ?? 'none';
    const hasRua = /\brua=mailto:/i.test(dmarc);
    record(
      'dmarc',
      policy === 'none' ? 'warn' : 'pass',
      'DMARC policy',
      `${dmarc}  (policy=${policy})`,
      policy === 'none'
        ? 'p=none observes but enforces nothing: anyone can spoof this domain. Move to quarantine, then reject, once alignment is proven clean.'
        : undefined,
    );
    record(
      'dmarc-rua',
      hasRua ? 'pass' : 'warn',
      'DMARC aggregate reporting',
      hasRua ? 'rua= present' : 'No rua= address: unaligned senders stay invisible.',
      `Add rua=mailto:dmarc@${domain} so forgery attempts and misconfigured senders arrive as reports.`,
    );
  }

  const mtaSts = (await txt(`_mta-sts.${domain}`)).find((value) => /^v=STSv1/i.test(value));
  if (!mtaSts) {
    record(
      'mta-sts',
      'warn',
      'MTA-STS not published',
      'SMTP transport to the mail host can be downgraded by a stripping attacker.',
      `Serve https://mta-sts.${domain}/.well-known/mta-sts.txt (this repo ships public/.well-known/mta-sts.txt) and publish TXT v=STSv1; id=<timestamp> at _mta-sts.${domain}.`,
    );
  } else {
    let policyOk = false;
    let policyDetail = 'policy file unreachable over HTTPS';
    try {
      const response = await fetch(`https://mta-sts.${domain}/.well-known/mta-sts.txt`, {
        signal: AbortSignal.timeout(8000),
      });
      const body = await response.text();
      policyOk = response.ok && /version:\s*STSv1/i.test(body) && /mode:\s*(enforce|testing)/i.test(body);
      policyDetail = response.ok ? body.replace(/\s+/g, ' ').trim() : `HTTP ${response.status}`;
    } catch (error) {
      policyDetail = `fetch failed: ${error?.message ?? error}`;
    }
    record(
      'mta-sts',
      policyOk ? 'pass' : 'warn',
      'MTA-STS policy',
      policyDetail,
      policyOk ? undefined : `The TXT record exists but the HTTPS policy at mta-sts.${domain} does not validate, so receivers ignore it.`,
    );
  }

  const tlsRpt = (await txt(`_smtp._tls.${domain}`)).find((value) => /^v=TLSRPTv1/i.test(value));
  record(
    'tls-rpt',
    tlsRpt ? 'pass' : 'warn',
    'TLS-RPT',
    tlsRpt ?? 'No report address: inbound SMTP TLS failures stay invisible.',
    `Publish TXT v=TLSRPTv1; rua=mailto:tlsrpt@${domain} at _smtp._tls.${domain}.`,
  );

  const failed = results.filter((entry) => entry.level === 'fail');
  const warned = results.filter((entry) => entry.level === 'warn');
  const exitCode = failed.length > 0 || (strict && warned.length > 0) ? 1 : 0;

  if (asJson) {
    console.log(JSON.stringify({ domain, exitCode, failed: failed.length, warned: warned.length, results }, null, 2));
  } else {
    const icon = { pass: '[ok]  ', warn: '[warn]', fail: '[FAIL]' };
    console.log(`\nEmail health check - ${domain}\n${'='.repeat(72)}`);
    for (const entry of results) {
      console.log(`${icon[entry.level]} ${entry.title}`);
      console.log(`       ${entry.detail}`);
      if (entry.fix) console.log(`       fix: ${entry.fix}`);
    }
    console.log('='.repeat(72));
    const passed = results.length - failed.length - warned.length;
    console.log(`${passed} pass, ${warned.length} warn, ${failed.length} fail`);
    console.log(exitCode ? 'RESULT: needs attention\n' : 'RESULT: healthy\n');
  }

  return exitCode;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  process.exit(await run());
}
