
import { User, Task, Report } from './types';

// Base API URL - change this to your production URL when deploying
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://taskberry-backend.onrender.com/api' 
  : 'http://localhost:5000/api';

// Helper function for API requests with better error handling
async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
    ...(data ? { body: JSON.stringify(data) } : {})
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear it and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Please check if the backend server is running');
    }
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API calls
export const register = async (userData: { name: string; email: string; password: string; role: string }) => {
  return apiRequest<{ token: string; user: User }>('/auth/register', 'POST', userData);
};

export const login = async (email: string, password: string) => {
  return apiRequest<{ token: string; user: User }>('/auth/login', 'POST', { email, password });
};

export const getCurrentUser = async () => {
  return apiRequest<User>('/auth/me');
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// Users API calls
export const getAllUsers = async () => {
  return apiRequest<User[]>('/users');
};

export const getUserById = async (id: string) => {
  return apiRequest<User>(`/users/${id}`);
};

export const getTeamMembers = async (userId: string) => {
  return apiRequest<User[]>(`/users/team/${userId}`);
};

export const addTeamMember = async (userData: Omit<User, 'id'>) => {
  return apiRequest<User>('/users', 'POST', userData);
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  return apiRequest<User>(`/users/${userId}`, 'PUT', userData);
};

export const updateUserPassword = async (email: string, newPassword: string) => {
  return apiRequest<{ success: boolean }>(`/users/password`, 'PUT', { email, newPassword });
};

// Tasks API calls
export const getAllTasks = async () => {
  return apiRequest<Task[]>('/tasks');
};

export const getTaskById = async (id: string) => {
  return apiRequest<Task>(`/tasks/${id}`);
};

export const getTasksForUser = async (userId: string) => {
  return apiRequest<Task[]>(`/tasks/user/${userId}`);
};

export const getTasksForTeam = async (userId: string) => {
  return apiRequest<Task[]>(`/tasks/team/${userId}`);
};

export const addTask = async (taskData: Omit<Task, 'id' | 'lastUpdated'>) => {
  return apiRequest<Task>('/tasks', 'POST', taskData);
};

export const updateTask = async (task: Task) => {
  return apiRequest<Task>(`/tasks/${task.id}`, 'PUT', task);
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  return apiRequest<Task>(`/tasks/${taskId}/status`, 'PUT', { status });
};

export const deleteTask = async (taskId: string) => {
  return apiRequest<{ success: boolean }>(`/tasks/${taskId}`, 'DELETE');
};

// Reports API calls
export const getReports = async () => {
  return apiRequest<Report[]>('/reports');
};

export const generateReport = async (title: string, type: 'daily' | 'weekly' | 'monthly') => {
  return apiRequest<Report>('/reports', 'POST', { title, type });
};

export const getReportById = async (id: string) => {
  return apiRequest<Report>(`/reports/${id}`);
};

export const deleteReport = async (id: string) => {
  return apiRequest<{ success: boolean }>(`/reports/${id}`, 'DELETE');
};

// Password reset API calls
export const forgotPassword = async (email: string) => {
  return apiRequest<{ message: string }>('/auth/forgot-password', 'POST', { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return apiRequest<{ message: string }>('/auth/reset-password', 'POST', { token, newPassword });
};
