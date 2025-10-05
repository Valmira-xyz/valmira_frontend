import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AMBASSADOR_QUERY_PARAM = 'amb';
const REFERRAL_COOKIE_NAME = 'referralCode';

export function middleware(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const referralCode = params.get(AMBASSADOR_QUERY_PARAM);
  const response = NextResponse.next();

  // Set referral cookie if referral code is present
  if (referralCode) {
    console.log(`Middleware: Found referral code in URL: ${referralCode}`);
    response.cookies.set({
      name: REFERRAL_COOKIE_NAME,
      value: referralCode.toUpperCase(),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
    });
  }

  // Allow access to all routes - no authentication required
  return response;
}

// Configure the middleware to run on all routes except specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
