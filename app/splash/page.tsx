'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { setTrialAuthenticated } from '@/store/slices/splashAuthSlice';
import { RootState } from '@/store/store';

export default function SplashPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const isTrialAuthenticated = useSelector(
    (state: RootState) => state.splashAuth.isTrialAuthenticated
  );

  useEffect(() => {
    // Check if already authenticated via cookie
    const isAuthCookie = Cookies.get('isTrialAuthenticated');
    if (isAuthCookie === 'true' && !isTrialAuthenticated) {
      dispatch(setTrialAuthenticated(true));
    }

    if (isTrialAuthenticated) {
      router.push('/');
    }
  }, [isTrialAuthenticated, router, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const correctPassword = process.env.NEXT_PUBLIC_TRIAL_PERIOD_PASSWORD;

    if (password === correctPassword) {
      setError('');
      // Set cookie to persist authentication
      Cookies.set('isTrialAuthenticated', 'true', { expires: 7 }); // Expires in 7 days
      dispatch(setTrialAuthenticated(true));
      router.push('/');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-center">
          <Image
            src="/sidebar/logo.svg"
            alt="Valmira Logo"
            width={200}
            height={80}
            priority
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
              placeholder="Enter password"
              required
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
