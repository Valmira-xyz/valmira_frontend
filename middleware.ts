import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if the request is for the splash page or a static asset
  const isSplashPage = path === '/splash';
  const isStaticAsset =
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/sidebar');

  // Get the cookie for trial authentication
  const isTrialAuthenticated = request.cookies.has('isTrialAuthenticated');

  // For splash page or static assets, allow access regardless of authentication
  if (isSplashPage || isStaticAsset) {
    return NextResponse.next();
  }

  // For all other routes, require authentication
  if (!isTrialAuthenticated) {
    // If not authenticated, redirect to splash page
    return NextResponse.redirect(new URL('/splash', request.url));
  }

  // Continue for authenticated users
  return NextResponse.next();
}

// Configure the middleware to run on all routes except specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
