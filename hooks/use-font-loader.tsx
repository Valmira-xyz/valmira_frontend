'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// The context will now provide a clear "isLoading" boolean.
type FontStatusContextType = {
  isLoading: boolean;
};

const FontStatusContext = createContext<FontStatusContextType | undefined>(
  undefined
);

export const FontStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // 1. State is now `isLoading`, and it correctly starts as `true`.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 2. After a short delay, we set `isLoading` to `false`.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <FontStatusContext.Provider value={{ isLoading }}>
      {children}
    </FontStatusContext.Provider>
  );
};

export const useFontStatus = () => {
  const context = useContext(FontStatusContext);
  if (context === undefined) {
    throw new Error('useFontStatus must be used within a FontStatusProvider');
  }
  return context;
};
