import { useEffect, useCallback, useRef } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError, logout } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import type { RootState } from '@/store/store';
import { web3modal } from '@/components/providers';

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
      // dispatch(setLoading(true));
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
      // dispatch(setLoading(false));
      isAuthenticatingRef.current = false;
    }
  }, [dispatch, handleLogout, signMessageAsync]);

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