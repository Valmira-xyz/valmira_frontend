import { useEffect, useCallback, useRef } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError, logout } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import type { RootState } from '@/store/store';
import { web3modal } from '@/components/providers';
import { jwtDecode } from 'jwt-decode';

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
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
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
  }, [address, isConnected, user]);

  const handleLogout = useCallback(() => {
    isAuthenticatingRef.current = false;
    dispatch(logout());
    authService.logout();   
  }, [dispatch]);

  // Validate existing token from localStorage
  const validateExistingToken = useCallback((walletAddress: string): boolean => {
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
      if (decodedToken.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      // If there's an error decoding, the token is likely invalid
      localStorage.removeItem('token');
      return false;
    }
  }, []);

  // Load user profile using existing token
  const loadUserProfile = useCallback(async () => {
    try {
      isAuthenticatingRef.current = true;
      dispatch(setLoading(true));
      const userProfile = await authService.getProfile();
      dispatch(setUser(userProfile));
      return true;
    } catch (error) {
      console.error('Failed to load user profile with existing token:', error);
      // If profile loading fails, clear the token as it may be invalid
      localStorage.removeItem('token');
      return false;
    } finally {
      dispatch(setLoading(false));
      isAuthenticatingRef.current = false;
    }
  }, [dispatch]);

  const handleAuthentication = useCallback(async () => {
    if (isAuthenticatingRef.current) {
      return;
    }

    const currentAddress = addressRef.current;
    const currentIsConnected = isConnectedRef.current;
    const currentUser = userRef.current;

    if (!currentAddress || !currentIsConnected) {
      return;
    }

    // If user is already authenticated with the current address, skip
    if (currentUser && currentUser.walletAddress.toLowerCase() === currentAddress.toLowerCase()) {
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
      
      // Get nonce from backend
      const nonceResponse = await authService.getNonce(currentAddress);
      const messageToSign = `Sign this message to verify your wallet ownership & login to Valmira. Nonce: ${nonceResponse.nonce}`;

      try {
        // Sign message
        const signature = await signMessageAsync({ 
          message: messageToSign 
        });
        
        if (!signature) {
          throw new Error('Failed to get signature');
        }

        // Verify signature with backend
        const response = await authService.verifySignature(currentAddress, signature, nonceResponse.nonce);
        dispatch(setUser(response.user));
      } catch (signError: any) {
        console.error('Signing error:', signError);
        if (signError?.code === 4001) {
          throw new Error('User rejected signature request');
        }
        throw signError;
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      dispatch(setError(error?.message || 'Authentication failed'));
      // Only logout if we're not in the middle of authenticating
      if (!isAuthenticatingRef.current) {
        handleLogout();
      }
    } finally {
      dispatch(setLoading(false));
      isAuthenticatingRef.current = false;
    }
  }, [dispatch, handleLogout, signMessageAsync, validateExistingToken, loadUserProfile]);

  // Handle initial connection and address changes
  useEffect(() => {
    if (isConnected && address && !isAuthenticatingRef.current) {
      // Add a small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        handleAuthentication();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, handleAuthentication]);

  // Handle disconnection
  useEffect(() => {
    if (isDisconnected && !isAuthenticatingRef.current) {
      web3modal.disconnect();
      handleLogout();
    }
  }, [isDisconnected, handleLogout]);

  // Expose a manual authentication method for UI buttons
  const manualAuthenticate = useCallback(() => {
    if (isConnected && address) {
      handleAuthentication();
    }
  }, [isConnected, address, handleAuthentication]);

  return {
    isConnected,
    address,
    isAuthenticated: !!user,
    user,
    logout: handleLogout,
    authenticate: manualAuthenticate,
    isAuthenticating: isAuthenticatingRef.current
  };
};