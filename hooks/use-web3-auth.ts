import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import CryptoJS from 'crypto-js';
import { jwtDecode } from 'jwt-decode';
import { useAccount } from 'wagmi';

import { appkit } from '@/components/providers';
import { authService } from '@/services/authService';
import {
  logout,
  setError,
  setLoading,
  setUser,
} from '@/store/slices/authSlice';
import type { RootState } from '@/store/store';

// JWT token interface
interface JwtPayload {
  id: string;
  walletAddress: string;
  exp: number;
  iat: number;
}

export const useWeb3Auth = () => {
  const dispatch = useDispatch();
  const { address, isConnected, isDisconnected } = useAccount();
  const { user } = useSelector((state: RootState) => state.auth);

  // Use refs to maintain stable references
  const addressRef = useRef(address);
  const isConnectedRef = useRef(isConnected);
  const userRef = useRef(user);
  const isAuthenticatingRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    addressRef.current = address;
    isConnectedRef.current = isConnected;
    userRef.current = user;

    // Reset isAuthenticatingRef when component unmounts or when connection changes
    return () => {
      isAuthenticatingRef.current = false;
    };
  }, [address, isConnected, user]);

  const handleLogout = useCallback(() => {
    isAuthenticatingRef.current = false;
    dispatch(logout());
    authService.logout();
  }, [dispatch]);

  // Validate existing token from localStorage
  const validateExistingToken = useCallback(
    (walletAddress: string): boolean => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
          return false;
        }

        // Decode the token to get payload
        const decodedToken = jwtDecode<JwtPayload>(token);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decodedToken.exp <= currentTime) {
          return false;
        }

        // Check if walletAddress in token matches connected wallet
        if (
          decodedToken.walletAddress.toLowerCase() !==
          walletAddress.toLowerCase()
        ) {
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error validating token:', error);
        // If there's an error decoding, the token is likely invalid
        localStorage.removeItem('token');
        return false;
      }
    },
    []
  );

  // Load user profile using existing token
  const loadUserProfile = useCallback(async () => {
    try {
      isAuthenticatingRef.current = true;
      dispatch(setLoading(true));
      const userProfile = await authService.getProfile();
      console.log('userProfile', userProfile);
      dispatch(setUser(userProfile));
      return true;
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If profile loading fails, clear the token as it may be invalid
      localStorage.removeItem('token');
      return false;
    } finally {
      dispatch(setLoading(false));
      isAuthenticatingRef.current = false;
    }
  }, [dispatch]);

  const checkMetaMaskLockStatus = useCallback(async () => {
    try {
      // Use Wagmi's connection status which works across all wallet types
      return !isConnected;
    } catch (error: any) {
      console.error('Error checking wallet connection:', error);
      return true; // If we can't check connection, assume locked
    }
  }, [isConnected]);

  const handleAuthentication = useCallback(
    async (referralCode?: string) => {
      // Reset isAuthenticatingRef if it's been stuck for too long
      if (isAuthenticatingRef.current) {
        isAuthenticatingRef.current = false;
      }

      const currentAddress = addressRef.current;
      const currentIsConnected = isConnectedRef.current;
      const currentUser = userRef.current;

      if (!currentAddress || !currentIsConnected) {
        return;
      }

      // Check if MetaMask is locked
      const isLocked = await checkMetaMaskLockStatus();
      if (isLocked) {
        dispatch(
          setError('Please unlock your wallet to continue authentication')
        );
        alert('Please unlock your wallet to continue.');
        return;
      }

      // If user is already authenticated with the current address, skip
      if (
        currentUser &&
        currentUser.walletAddress.toLowerCase() === currentAddress.toLowerCase()
      ) {
        return;
      }

      try {
        isAuthenticatingRef.current = true;
        dispatch(setLoading(true));

        // Check if we have a valid token in localStorage
        if (validateExistingToken(currentAddress)) {
          // If token is valid, load user profile and return
          const profileLoaded = await loadUserProfile();
          if (profileLoaded) {
            return;
          }
          // If profile loading failed, proceed with full authentication
        }

        // If we have a referral code from widget, make a request to capture it in middleware first
        // This only happens when referralCode is explicitly passed (widget flow)
        // Normal app flow relies on URL parameters being captured automatically
        if (
          referralCode &&
          typeof window !== 'undefined' &&
          window.location.pathname.includes('/embed/')
        ) {
          try {
            const captureUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/me?amb=${referralCode}`;

            // Make a dummy request to trigger referral middleware (widget-only)
            await fetch(captureUrl, {
              method: 'GET',
              credentials: 'include', // Include cookies
            }).catch(() => null);
          } catch (error) {
            // Silently handle errors
            console.log(error);
          }
        }

        // Get nonce from backend
        const nonceResponse = await authService.getNonce(currentAddress);

        // Create verification token using MD5 hash of wallet address + nonce
        const walletAddress = currentAddress.toLowerCase();
        const nonce = nonceResponse.nonce;
        const verificationToken = CryptoJS.MD5(
          `${walletAddress}-${nonce}`
        ).toString();

        // Verify with backend
        const response = await authService.verifySignature(
          walletAddress,
          verificationToken,
          nonce,
          referralCode // Pass referral code to the backend
        );
        //if response.user is not null, set the user
        if (response.user) {
          dispatch(setUser(response.user));
        }
      } catch (error: any) {
        dispatch(setError(error?.message || 'Authentication failed'));
        // Only logout if we're not in the middle of authenticating
        if (!isAuthenticatingRef.current) {
          handleLogout();
        }
      } finally {
        dispatch(setLoading(false));
        isAuthenticatingRef.current = false;
      }
    },
    [
      dispatch,
      handleLogout,
      validateExistingToken,
      loadUserProfile,
      checkMetaMaskLockStatus,
    ]
  );

  // Handle initial connection and address changes
  useEffect(() => {
    if (isConnected && address && !isAuthenticatingRef.current) {
      // Add a small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        // Auto-authentication doesn't use referral code
        // Referral code is only used for manual authentication from widget
        handleAuthentication();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, handleAuthentication]);

  // Handle disconnection
  useEffect(() => {
    if (isDisconnected && !isAuthenticatingRef.current) {
      appkit.disconnect();
      handleLogout();
    }
  }, [isDisconnected, handleLogout]);

  // Expose a manual authentication method for UI buttons
  const manualAuthenticate = useCallback(
    (referralCode?: string) => {
      if (isConnected && address) {
        handleAuthentication(referralCode);
      }
    },
    [isConnected, address, handleAuthentication]
  );

  return {
    isConnected,
    address,
    isAuthenticated: !!user,
    user,
    logout: handleLogout,
    authenticate: manualAuthenticate,
    isAuthenticating: isAuthenticatingRef.current,
  };
};
