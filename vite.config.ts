/// <reference types="vitest/config" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";


/* ── Content Security Policy ───────────────────────────────────────────────
   index.html carries one inline <script>: the theme/direction bootstrap that
   runs before React mounts to avoid a flash of the wrong theme. Vite copies it
   into the build byte-for-byte, so its SHA-256 is stable and we can allow that
   one script by digest instead of opening the policy with 'unsafe-inline'.

   If that bootstrap is ever edited, recompute the digest:

     node -e "const f=require('fs'),c=require('crypto');\
     const m=f.readFileSync('index.html','utf8')\
       .match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/);\
     console.log('sha256-'+c.createHash('sha256').update(m[1]).digest('base64'))"

   A stale digest blocks the bootstrap and the page loads in the default theme —
   visible immediately, and reported in the console as a CSP violation.
────────────────────────────────────────────────────────────────────────── */
const THEME_BOOTSTRAP_SHA256 =
  "'sha256-sm7lV1VVyIdShiJkLkce5PsOWe3A/705rKqqRF4FE8Y='";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' ${THEME_BOOTSTRAP_SHA256}`,
  // 'unsafe-inline' is required for style only: React sets inline `style` props
  // (the radar gauges and progress bars compute widths at runtime) and Tailwind
  // v4 injects a style element. No inline script is permitted.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

/* Build-only. A static meta tag in index.html would also govern `vite dev`,
   where @vitejs/plugin-react injects an unhashed Fast Refresh preamble and HMR
   opens a WebSocket — both blocked by the policy above, breaking local dev.

   Note: `frame-ancestors` and `X-Frame-Options` are ignored when delivered via
   <meta>, so clickjacking protection still has to come from a response header
   at the host. This policy does not claim to provide it. */
function contentSecurityPolicy(): Plugin {
  return {
    name: "yaslogist-air:csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: () => [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: CONTENT_SECURITY_POLICY,
          },
          injectTo: "head-prepend" as const,
        },
      ],
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  preview: {
    host: true,
    // The sandboxed preview proxy serves the build under *.e2b.app; without
    // this allowlist Vite rejects those Host headers with a 403.
    allowedHosts: [".e2b.app"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Component tests deliberately run with prefers-reduced-motion: reduce so
    // the animation-free render paths (the ones a11y users get) are the paths
    // under test. The motion math is covered by pure unit tests instead.
    css: false,
    restoreMocks: true,
  },
});
