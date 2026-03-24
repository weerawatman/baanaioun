import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

// 401 Refresh Interceptor ─────────────────────────────────────────────────
// `supabase` is referenced inside the fetch lambda before the const is
// "declared" below, but this is safe: the lambda body is only evaluated when
// a network request fires, which is always after module initialisation is
// complete. TypeScript allows this pattern for arrow-function closures.
//
// On a 401 from a PostgREST (database) request we fire-and-forget a token
// refresh so the NEXT SWR retry uses a valid access token — without blocking
// the current (failed) response from propagating to the caller.
// We skip Auth-API URLs (/auth/) to avoid an infinite refresh loop.
// ─────────────────────────────────────────────────────────────────────────
export const supabase = createBrowserClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: async (input, init) => {
      const response = await fetch(input, init);

      if (response.status === 401) {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : (input as Request).url;

        if (!url.includes('/auth/')) {
          // Fire-and-forget — don't await, don't block the failed response.
          // autoRefreshToken will store the new token in cookies;
          // SWR's errorRetryCount will replay the request and pick it up.
          supabase.auth.refreshSession().catch(() => {});
        }
      }

      return response;
    },
  },
});
