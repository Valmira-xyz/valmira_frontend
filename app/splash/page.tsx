'use client';

import { useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get referral code from URL if present
  const referralCode = searchParams.get('amb');

  useEffect(() => {
    // Automatically redirect to home page, preserving referral code
    const homeUrl = referralCode ? `/?amb=${referralCode}` : '/';
    router.push(homeUrl);
  }, [router, referralCode]);

  // Show a simple loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
