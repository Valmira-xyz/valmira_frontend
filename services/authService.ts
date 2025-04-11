import axios from 'axios';

import type { ApiResponse, NonceResponse, User, VerifyResponse } from '@/types';

const API_URL =
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || 'http://localhost:5000';

class AuthService {
  private token: string | null = null;

  constructor() {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async getNonce(walletAddress: string): Promise<NonceResponse> {
    try {
      const response = await axios.get<ApiResponse<{ nonce: string }>>(
        `${API_URL}/users/nonce/${walletAddress}`,
        {
          withCredentials: true,
        }
      );
      return response.data.data;
    } catch (error) {
      throw new Error('Failed to get nonce');
    }
  }

  async verifySignature(
    walletAddress: string,
    verificationToken: string,
    nonce: string
  ): Promise<VerifyResponse> {
    try {
      const response = await axios.post<ApiResponse<VerifyResponse>>(
        `${API_URL}/users/verify-signature`,
        {
          walletAddress,
          verificationToken,
          nonce,
        },
        {
          withCredentials: true,
        }
      );

      const { user, token } = response.data.data;
      this.setToken(token);

      // Ensure the user object has all required fields
      if (!user._id) {
        throw new Error('Invalid user data received from server');
      }

      return {
        user: {
          _id: user._id,
          walletAddress: user.walletAddress,
          role: user.role as 'user' | 'admin',
          name: user.name,
        },
        token,
      };
    } catch (error) {
      throw new Error('Failed to verify authentication');
    }
  }

  async register(walletAddress: string, name?: string): Promise<User> {
    try {
      const response = await axios.post<ApiResponse<{ user: User }>>(
        `${API_URL}/users/register`,
        {
          walletAddress,
          name,
        },
        {
          withCredentials: true,
        }
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error('Registration failed');
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await axios.get<ApiResponse<{ user: User }>>(
        `${API_URL}/users/profile`,
        {
          headers: this.getAuthHeader(),
          withCredentials: true,
        }
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error('Failed to get profile');
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await axios.put<ApiResponse<{ user: User }>>(
        `${API_URL}/users/profile`,
        data,
        {
          headers: this.getAuthHeader(),
          withCredentials: true,
        }
      );
      return response.data.data.user;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }

  logout() {
    this.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = new AuthService();
