/* ── The YASLOGIST suite ──────────────────────────────────────────────────
   Air's copy of the ecosystem address table, matching `land/src/lib/suite.ts`
   and `ocean/src/lib/suite.ts`.

   Air's navbar, footer and land handshake previously hard-coded the production
   hosts. That is correct in production and wrong in development: clicking
   "Land" from localhost:3200 left the dev session entirely and loaded the
   deployed site, so the three surfaces could not be exercised together. The
   URLs now resolve per environment, exactly as they do on the other surfaces.
────────────────────────────────────────────────────────────────────────── */

const DEV = import.meta.env.DEV;

export const SUITE_URLS = {
  hub: 'https://yaslogist.com',
  land: DEV ? 'http://localhost:3000' : 'https://land.yaslogist.com',
  ocean: DEV ? 'http://localhost:3100' : 'https://ocean.yaslogist.com',
  air: DEV ? 'http://localhost:3200' : 'https://air.yaslogist.com',
} as const;
