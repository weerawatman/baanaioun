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

  // getUser() validates the access token with the Supabase Auth server on every
  // call — more secure than getSession() which only decodes the JWT locally.
  // It also transparently refreshes the access token (and updates cookies via
  // the setAll callback above) when the token is expired, as long as the refresh
  // token in the cookie is still valid.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Resilience against transient server errors (Supabase free-tier cold start,
  // brief network blip). If getUser() fails with an error while auth cookies
  // still exist, the refresh token may be valid — let the page load and allow
  // the client-side autoRefreshToken + focus handler to recover the session.
  // Only hard-redirect when there are provably no credentials at all.
  const hasAuthCookies = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'));

  const allowThrough = !user && hasAuthCookies && !!error;

  return { user: user ?? null, allowThrough, supabaseResponse };
}
