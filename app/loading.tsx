'use client';
import { useLottie } from 'lottie-react';
import loadingAnimation from '../public/valmira-lottie.json';

export default function Loading() {
  const options = {
    animationData: loadingAnimation,
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
