import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const legacyHrRoutes = [
  '/kras',
  '/routine-tasks',
  '/leaves',
  '/attendance',
  '/expenses',
  '/recruitment',
  '/hr-calendar',
  '/employees',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLegacyHrRoute = legacyHrRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isLegacyHrRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/kras/:path*',
    '/routine-tasks/:path*',
    '/leaves/:path*',
    '/attendance/:path*',
    '/expenses/:path*',
    '/recruitment/:path*',
    '/hr-calendar/:path*',
    '/employees/:path*',
  ],
};
