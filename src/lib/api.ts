
import { User, Task, Report } from './types';

// Base API URL - change this to your production URL when deploying
const API_URL = 'http://localhost:5000/api';

// Helper function for API requests
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
    headers['x-auth-token'] = token;
  }
  
  const config: RequestInit = {
    method,
    headers,
    ...(data ? { body: JSON.stringify(data) } : {})
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API calls
export const login = async (email: string, password: string) => {
  return apiRequest<{ token: string, user: User }>('/auth/login', 'POST', { email, password });
};

export const getCurrentUser = async () => {
  return apiRequest<User>('/auth/me');
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

export const updateUserPassword = async (email: string, newPassword: string) => {
  return apiRequest<{success: boolean}>(`/users/password`, 'PUT', { email, newPassword });
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
  return apiRequest<Task>(`/tasks/${taskId}`, 'PUT', { status });
};

// Reports API calls
export const getReports = async () => {
  return apiRequest<Report[]>('/reports');
};

export const generateReport = async (title: string, type: 'daily' | 'weekly' | 'monthly') => {
  return apiRequest<Report>('/reports', 'POST', { title, type });
};
