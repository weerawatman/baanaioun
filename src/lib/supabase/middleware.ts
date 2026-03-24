import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() reads JWT from cookie locally — no network call to Supabase.
  // Only makes a network call when the access token is expired (to refresh it).
  // getUser() by contrast always makes a network round-trip to verify the token.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // Resilience against transient refresh failures (e.g. Supabase free-tier cold
  // start, brief network blip). If the session is null because refresh failed
  // *with an error* while the user still has auth cookies, it means the refresh
  // token may still be valid — the browser client will retry once hydrated.
  // Only hard-redirect when there are provably no credentials at all.
  const hasAuthCookies = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'));

  const allowThrough = !session && hasAuthCookies && !!error;

  return { user: session?.user ?? null, allowThrough, supabaseResponse };
}
