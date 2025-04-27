import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if the request is for the splash page
  const isSplashPage = path === '/splash';

  // Get the cookie for trial authentication
  const isTrialAuthenticated = request.cookies.has('isTrialAuthenticated');

  // Allow access to splash page without authentication
  if (isSplashPage) {
    return NextResponse.next();
  }

  // Allow access to static files without authentication
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/sidebar')
  ) {
    return NextResponse.next();
  }

  // If not authenticated and not on the splash page, redirect to splash
  if (!isTrialAuthenticated) {
    return NextResponse.redirect(new URL('/splash', request.url));
  }

  // Continue for authenticated users
  return NextResponse.next();
}

// Configure the middleware to run on all routes except api routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
