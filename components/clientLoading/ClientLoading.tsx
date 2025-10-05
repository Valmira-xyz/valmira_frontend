//components/ClientLoading.tsx
'use client';

import { useEffect, useState } from 'react';

import { useLottie } from 'lottie-react';

import loadingAnimationDark from '@/lib/animations/valmira-lottie-dark.json';
import loadingAnimationLight from '@/lib/animations/valmira-lottie-light.json';

export default function ClientLoading() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'light';
      setTheme(currentTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const options = {
    animationData:
      theme === 'dark' ? loadingAnimationDark : loadingAnimationLight,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="h-32 w-32">{View}</div>
    </div>
  );
}
