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
        console.log('No token found in localStorage');
        return false;
      }
      
      // Decode the token to get payload
      const decodedToken = jwtDecode<JwtPayload>(token);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp <= currentTime) {
        console.log('Token is expired, needs re-authentication. Expired at:', new Date(decodedToken.exp * 1000).toLocaleString());
        return false;
      }
      
      // Check if walletAddress in token matches connected wallet
      if (decodedToken.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log('Wallet address mismatch - connected:', walletAddress.toLowerCase(), 'token:', decodedToken.walletAddress.toLowerCase());
        return false;
      }
      
      console.log('Valid token found for wallet', walletAddress, 'expires:', new Date(decodedToken.exp * 1000).toLocaleString());
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
      console.log('Loading user profile with existing token');
      const userProfile = await authService.getProfile();
      dispatch(setUser(userProfile));
      console.log('User profile loaded successfully from token');
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
      console.log('Authentication already in progress');
      return;
    }

    const currentAddress = addressRef.current;
    const currentIsConnected = isConnectedRef.current;
    const currentUser = userRef.current;

    if (!currentAddress || !currentIsConnected) {
      console.log('No address or not connected, skipping authentication');
      return;
    }

    // If user is already authenticated with the current address, skip
    if (currentUser && currentUser.walletAddress.toLowerCase() === currentAddress.toLowerCase()) {
      console.log('User already authenticated with current address');
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
      
      // Standard authentication flow with signature
      console.log('Starting authentication for address:', currentAddress);
      
      // Get nonce from backend
      const nonceResponse = await authService.getNonce(currentAddress);
      const messageToSign = `Sign this message to verify your wallet ownership & login to Valmira. Nonce: ${nonceResponse.nonce}`;
      console.log('Preparing to sign message:', messageToSign);

      try {
        // Sign message - FIXED: simplified parameters to match wagmi expectations
        console.log('Requesting signature from wallet...');
        
        // The simpler approach - just pass the message
        const signature = await signMessageAsync({ 
          message: messageToSign 
        });
        
        console.log('Raw signature response:', signature);
        
        if (!signature) {
          console.error('No signature received after signing');
          throw new Error('Failed to get signature');
        }
        
        console.log('Signature received:', signature);

        // Verify signature with backend
        const response = await authService.verifySignature(currentAddress, signature, nonceResponse.nonce);
        console.log('Signature verified, user authenticated');
        
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
    const connectionState = {
      isConnected,
      isDisconnected,
      address,
      hasUser: !!user,
      isAuthenticating: isAuthenticatingRef.current
    };
    console.log('Connection state changed:', connectionState);

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
      console.log('Wallet disconnected, logging out');
      web3modal.disconnect();
      handleLogout();
    }
  }, [isDisconnected, handleLogout]);

  // Expose a manual authentication method for UI buttons
  const manualAuthenticate = useCallback(() => {
    if (isConnected && address) {
      handleAuthentication();
    } else {
      console.log('Cannot authenticate: wallet not connected');
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