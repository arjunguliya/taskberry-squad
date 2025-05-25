// src/services/userService.ts
interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'supervisor' | 'member' | 'Super_admin';
  avatarUrl?: string;
  supervisorId?: string;
  managerId?: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  user?: T;
  deletedUser?: T;
}

class UserService {
  private static getAuthToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    return token;
  }

  private static async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Get the API base URL - Your actual Render backend URL
    const API_BASE_URL = process.env.REACT_APP_API_URL || 
                        process.env.VITE_API_URL || 
                        'https://taskberry-backend.onrender.com/api';

    console.log('Making request to:', `${API_BASE_URL}${url}`);

    const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use the default error message
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Get all team members
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await this.makeRequest<User[]>('/users');
      return Array.isArray(response) ? response : [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }
  
  // Get single user
  static async getUser(userId: string): Promise<User> {
    try {
      const response = await this.makeRequest<User>(`/users/${userId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  }
  
  // Delete user
  static async deleteUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.makeRequest<ApiResponse<User>>(`/users/${userId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }
  
  // Update user role
  static async updateUserRole(userId: string, role: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.makeRequest<ApiResponse<User>>(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user role');
    }
  }

  // Get current user profile
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await this.makeRequest<User>('/auth/me');
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch current user');
    }
  }
}

export default UserService;
