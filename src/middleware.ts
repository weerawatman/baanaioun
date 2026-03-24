import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — skip Supabase entirely, return immediately
  if (
    pathname === '/login' ||
    pathname.startsWith('/listings') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Protected routes — check session (local cookie read, no network call unless token expired)
  const { user, allowThrough, supabaseResponse } = await updateSession(request);

  if (!user && !allowThrough) {
    // No session and no auth cookies — user is definitively logged out
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // allowThrough: session refresh failed transiently but auth cookies exist.
  // Proceed to the page — the client's autoRefreshToken + focus/visibility
  // handlers will recover the session without disrupting the user.
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
