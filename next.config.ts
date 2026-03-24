import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// ---------------------------------------------------------------------------
// Content Security Policy
// ---------------------------------------------------------------------------
// Sources used by this app:
//   • Next.js hydration          → script-src 'unsafe-inline' (no nonce setup)
//   • Cloudflare Turnstile       → script-src + frame-src + connect-src
//   • Supabase REST / Realtime   → connect-src *.supabase.co + wss
//   • Leaflet tile images        → img-src *.tile.openstreetmap.org
//   • Leaflet marker icons       → img-src unpkg.com
//   • Supabase Storage images    → img-src *.supabase.co
//   • Sentry error reporting     → connect-src *.ingest.sentry.io
//   • Google Fonts (next/font)   → self-hosted at build time, no external calls
//   • Tailwind v4 / Sonner       → style-src 'unsafe-inline'
// ---------------------------------------------------------------------------
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob: https://*.supabase.co https://unpkg.com https://*.tile.openstreetmap.org;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.ingest.sentry.io;
  frame-src https://challenges.cloudflare.com;
  worker-src blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\n\s+/g, ' ')
  .trim();

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Prevent our pages from being embedded in external iframes
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Limit referrer to origin only on cross-origin requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down browser features (geolocation: self only for map picker)
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry build output noise
  silent: true,

  // Automatically tree-shake Sentry logger to reduce bundle size
  disableLogger: true,

  // Upload source maps to Sentry for readable stack traces in production
  // Requires SENTRY_AUTH_TOKEN env var (optional — errors still captured without it)
  widenClientFileUpload: true,
});
