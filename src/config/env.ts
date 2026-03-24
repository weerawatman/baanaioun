/**
 * Centralized environment variable access.
 * All process.env references in the app should go through this module —
 * so if a key name changes, there is exactly one place to update.
 */
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },
  notification: {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    notificationEmail: process.env.NOTIFICATION_EMAIL ?? '',
    fromEmail: process.env.NOTIFICATION_FROM_EMAIL ?? '',
  },
  turnstile: {
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
    secretKey: process.env.TURNSTILE_SECRET_KEY ?? '',
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  },
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
    adminUserId: process.env.LINE_ADMIN_USER_ID ?? '',
  },
} as const;
