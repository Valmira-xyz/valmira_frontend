import React from 'react';
import { useWeb3Auth } from '../hooks/use-web3-auth';   

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isConnected, address, isAuthenticating } = useWeb3Auth();

  // Show loading state while authentication is in progress
  // if (isAuthenticating) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
}; 