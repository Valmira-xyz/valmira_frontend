'use client';

import { useEffect } from 'react';

export function FontLoader() {
  useEffect(() => {
    // 1. Let's log a message to see if this code is ever reached.
    console.log('FontLoader component has mounted. Checking for reload...');

    const hasReloaded = sessionStorage.getItem('fontReloaded');

    if (!hasReloaded) {
      console.log('Reloading page to cache fonts.');
      sessionStorage.setItem('fontReloaded', 'true');
      setTimeout(() => window.location.reload(), 50);
    } else {
      console.log('Page has already been reloaded for fonts.');
    }
  }, []);

  return null;
}
