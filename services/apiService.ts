// FILE: src/services/apiService.ts

import { authService } from './authService'; // Import the existing auth service
import { config } from './config';
import axios from 'axios';

// Create a single, configured axios instance for new features
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Use an interceptor to dynamically add the Authorization header to every request
// This is the key integration point.
api.interceptors.request.use(
  (config) => {
    // Get the auth header from the existing authService
    const authHeader = authService.getAuthHeader();

    // If the token exists, add it to the request header
    if (authHeader.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = authHeader.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Global error handling interceptor for convenience
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error(
        'API Service: Unauthorized request. The authService should handle logout.'
      );
      // The authService might have its own global error handling or redirection logic.
      // If not, you could call authService.logout() here as a fallback.
    }
    return Promise.reject(error);
  }
);

// Export a simplified object with the HTTP methods we'll use.
// This is the apiClient that our new ambassadorService will use.
export const apiClient = {
  get: <T>(url: string, params?: object) => api.get<T>(url, { params }),
  post: <T>(url: string, data: object) => api.post<T>(url, data),
  put: <T>(url: string, data: object) => api.put<T>(url, data),
  patch: <T>(url: string, data: object) => api.patch<T>(url, data),
  delete: <T>(url: string) => api.delete<T>(url),
};
