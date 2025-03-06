interface AuthResponse {
  user: {
    address: string;
    // Add other user properties as needed
  };
}

class AuthService {
  private baseUrl: string;

  constructor() {
    // Replace with your actual API base URL
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  async getNonce(address: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error('Failed to get nonce');
    }

    const data = await response.json();
    return data.nonce;
  }

  async verifySignature(
    address: string,
    signature: string,
    nonce: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, signature, nonce }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify signature');
    }

    return response.json();
  }
}

export const authService = new AuthService(); 