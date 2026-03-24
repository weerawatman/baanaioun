import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of sessions for session replay (free quota-friendly)
  replaysSessionSampleRate: 0.1,
  // Capture 100% of sessions where an error occurs
  replaysOnErrorSampleRate: 1.0,

  // Capture 10% of transactions for performance tracing
  tracesSampleRate: 0.1,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
