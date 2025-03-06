import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export interface User {
  _id: string;
  walletAddress: string;
  name?: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

interface ApiResponse<T> {
  data: T;
}

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

  async getNonce(walletAddress: string): Promise<string> {
    try {
      const response = await axios.get<ApiResponse<{ nonce: string }>>(`${API_URL}/users/nonce/${walletAddress}`);
      return response.data.data.nonce;
    } catch (error) {
      throw new Error('Failed to get nonce');
    }
  }

  async verifySignature(walletAddress: string, signature: string, nonce: string): Promise<AuthResponse> {
    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/users/verify-signature`, {
        walletAddress,
        signature,
        nonce,
      });

      const { user, token } = response.data.data;
      this.setToken(token);

      return { user, token };
    } catch (error) {
      throw new Error('Failed to verify signature');
    }
  }

  async register(walletAddress: string, name?: string): Promise<User> {
    try {
      const response = await axios.post<ApiResponse<{ user: User }>>(`${API_URL}/users/register`, {
        walletAddress,
        name,
      });
      return response.data.data.user;
    } catch (error) {
      throw new Error('Registration failed');
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await axios.get<ApiResponse<{ user: User }>>(`${API_URL}/users/profile`, {
        headers: this.getAuthHeader(),
      });
      return response.data.data.user;
    } catch (error) {
      throw new Error('Failed to get profile');
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await axios.put<ApiResponse<{ user: User }>>(`${API_URL}/users/profile`, data, {
        headers: this.getAuthHeader(),
      });
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