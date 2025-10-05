import React from 'react';

import '../globals.css';

export const metadata = {
  title: 'Valmira.xyz - Login',
  description: 'Login to access Valmira dashboard',
};

export default function SplashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The <html> and <body> tags are already rendered by the root layout,
  // so they should not be included in nested layouts.
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
}
