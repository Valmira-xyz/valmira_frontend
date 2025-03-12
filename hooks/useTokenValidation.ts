import { useState } from 'react';
import { tokenService } from '@/services/tokenService';

export type TokenImportStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface TokenValidationState {
  status: TokenImportStatus;
  error: string;
  tokenInfo: any | null;
}

export function useTokenValidation() {
  const [state, setState] = useState<TokenValidationState>({
    status: 'idle',
    error: '',
    tokenInfo: null,
  });

  const initializeState = () => {
    setState({
      status: 'idle',
      error: '',
      tokenInfo: null,
    });
  };

  const validateToken = async (address: string) => {
    setState(prev => ({ ...prev, status: 'validating', error: '' }));

    try {
      const tokenInfo = await tokenService.getTokenInfo(address);
      setState({
        status: 'valid',
        error: '',
        tokenInfo,
      });
      return tokenInfo;
    } catch (error) {
      setState({
        status: 'invalid',
        error: error instanceof Error ? error.message : 'Failed to validate token',
        tokenInfo: null,
      });
      throw error;
    }
  };

  return {
    ...state,
    validateToken,
    initializeState,
  };
} 