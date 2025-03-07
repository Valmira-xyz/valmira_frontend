import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useDispatch } from 'react-redux';
import { setUser, setLoading, setError, logout } from '../store/authSlice';
import { authService } from '../services/authService';
import { web3modal } from '@/components/providers';

export const useWeb3Auth = () => {
  const dispatch = useDispatch();
  const { address, isConnected, isDisconnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const handleAuthentication = async () => {
      if (!address) return;

      try {
        dispatch(setLoading(true));
        
        // Get nonce from backend
        const nonce = await authService.getNonce(address);
        const message = `Sign this message to verify your wallet ownership. Nonce: ${nonce}`;

        // Sign message with wagmi
        const signature = await signMessageAsync({ message });

        // Verify signature with backend
        const response = await authService.verifySignature(address, signature, nonce);
        
        dispatch(setUser(response.user));
      } catch (error) {
        dispatch(setError('Authentication failed'));
        dispatch(logout());
        console.error('Authentication error:', error);
        web3modal.disconnect();
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (isConnected && address) {
      handleAuthentication();
    }
  }, [isConnected, address, dispatch, signMessageAsync]);

  useEffect(() => {
    if (isDisconnected) {
      dispatch(logout());
      authService.logout();
    }
  }, [isDisconnected, dispatch]);

  return {
    isConnected,
    address,
    isLoading: false, // We'll get this from Redux state
  };
}; 