// src/services/authService.ts
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    supervisorId?: string;
    managerId?: string;
  };
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

class AuthService {
  private static getApiBaseUrl(): string {
    // Use environment variable or fallback to your backend URL
    return process.env.REACT_APP_API_URL || 
           process.env.VITE_API_URL || 
           'https://taskberry-backend.onrender.com/api';
  }

  // Login with email and password
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during login');
    }
  }

  // Register new user
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during registration');
    }
  }

  // Get current user profile
  static async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.getApiBaseUrl()}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error getting user profile');
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Basic check - decode JWT payload without verification
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Logout user
  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Store authentication data
  static storeAuthData(token: string, user: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get stored user data
  static getStoredUser() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
}

export default AuthService;
