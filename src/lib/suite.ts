/* ── The YASLOGIST suite ──────────────────────────────────────────────────
   Cross-surface links deliberately use public origins by default. A browser
   preview is not the same network namespace as the dev server, so emitting a
   `localhost` URL from the client makes the Hub/Land/Ocean controls point at
   the visitor's own machine (and silently fail in Arena/Vercel previews).

   Local sibling apps can still be exercised by opting in through Vite env
   variables, e.g. VITE_LAND_URL=http://localhost:3000. Keeping the override
   explicit makes the safe production/preview behavior the default.
────────────────────────────────────────────────────────────────────────── */

const envUrl = (key: keyof ImportMetaEnv, fallback: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

export const SUITE_URLS = {
  hub: envUrl('VITE_HUB_URL', 'https://yaslogist.com'),
  land: envUrl('VITE_LAND_URL', 'https://land.yaslogist.com'),
  ocean: envUrl('VITE_OCEAN_URL', 'https://ocean.yaslogist.com'),
  air: envUrl('VITE_AIR_URL', 'https://air.yaslogist.com'),
} as const;
