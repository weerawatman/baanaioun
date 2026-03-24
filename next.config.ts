import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
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
