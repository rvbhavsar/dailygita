import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, verifyToken } from '@/lib/jwt';

// Optimistic gate only. The authoritative checks live in the route-group
// layouts, which can hit the DB — Next's docs are explicit that proxy should
// not be a full authorization solution. Notably, isOnboarded is NOT checked
// here: it's DB-derived, and baking it into the token would go stale the
// moment onboarding completes.
const PROTECTED = ['/home', '/browse', '/challenges', '/favorites', '/settings', '/verse'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token && verifyToken(token)) return NextResponse.next();

  return NextResponse.redirect(new URL('/auth', request.url));
}

export const config = {
  matcher: ['/((?!api|audio|_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
