import { Task, TaskStatus, User, Report, UserRole } from '@/lib/types';
import { toast } from 'sonner';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  if (error.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  throw error;
};

// USER FUNCTIONS
export const getCurrentUser = (): User => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      // Redirect to login if no user data
      window.location.href = '/login';
      throw new Error('No user data found');
    }

    const user = JSON.parse(userData);
    
    // Validate user data structure
    if (!user.id || !user.email || !user.name) {
      console.error('Invalid user data:', user);
      refreshUserData();
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw error;
  }
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Refresh user data from backend
const refreshUserData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const userData = await response.json();
      setCurrentUser(userData);
      return userData;
    } else {
      throw new Error('Failed to fetch user data');
    }
  } catch (error) {
    handleApiError(error);
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch users');
    }
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      return await response.json();
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return undefined;
  }
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/email/${email}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      return await response.json();
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return undefined;
  }
};

export const updateUserPassword = async (email: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, newPassword })
    });

    if (response.ok) {
      toast.success('Password updated successfully');
      return true;
    } else {
      const error = await response.json();
      toast.error(error.message || 'Failed to update password');
      return false;
    }
  } catch (error) {
    console.error('Error updating password:', error);
    toast.error('Failed to update password');
    return false;
  }
};

// AUTHENTICATION
export const authenticate = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log(`Attempting to authenticate: ${email}`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Authentication successful:', data.user);
      return data.user;
    } else {
      const error = await response.json();
      console.log('Authentication failed:', error.message);
      return null;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast.info('Logged out successfully');
  window.location.href = '/login';
};

// TASK FUNCTIONS (Mock for now - implement when you have task backend routes)
export const getTaskById = (id: string): Task | undefined => {
  // TODO: Implement with real backend when task routes are ready
  return undefined;
};

export const getTeamMembers = async (userId: string): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/team/${userId}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      return await response.json();
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

export const getDirectReports = async (userId: string): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/reports/${userId}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      return await response.json();
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }
};

export const getTasksForTeam = (userId: string): Task[] => {
  // TODO: Implement with real backend
  return [];
};

export const getTasksForUser = (userId: string): Task[] => {
  // TODO: Implement with real backend
  return [];
};

export const getAssignableUsers = (assignerId: string): User[] => {
  // TODO: Implement with real backend
  return [];
};

export const addTask = (task: Omit<Task, 'id' | 'lastUpdated'>): Task => {
  // TODO: Implement with real backend
  const newTask: Task = {
    ...task,
    id: `task${Date.now()}`,
    lastUpdated: new Date().toISOString()
  };
  toast.success('Task created successfully');
  return newTask;
};

export const updateTask = (task: Task): Task => {
  // TODO: Implement with real backend
  toast.success('Task updated successfully');
  return task;
};

export const updateTaskStatus = (taskId: string, status: TaskStatus): Task | undefined => {
  // TODO: Implement with real backend
  const statusMessage = status === TaskStatus.COMPLETED ? 
    'Task marked as complete' : 
    `Task status changed to ${status}`;
  toast.success(statusMessage);
  return undefined;
};

export const addTeamMember = async (member: Omit<User, 'id'>): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(member)
    });

    if (response.ok) {
      const newMember = await response.json();
      toast.success('Team member added successfully');
      return newMember;
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add team member');
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to add team member');
    throw error;
  }
};

export const generateReport = (title: string, type: 'daily' | 'weekly' | 'monthly'): Report => {
  // TODO: Implement with real backend
  const newReport: Report = {
    id: `report${Date.now()}`,
    title,
    type,
    generatedAt: new Date().toISOString(),
    taskIds: []
  };
  toast.success('Report generated successfully');
  return newReport;
};

export const getReports = (): Report[] => {
  // TODO: Implement with real backend
  return [];
};

// UTILITY FUNCTIONS
export const registerUser = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user data if registration is successful
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return {
        success: true,
        message: data.user?.message || 'Registration successful',
        user: data.user
      };
    } else {
      return {
        success: false,
        message: data.message || 'Registration failed'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.'
    };
  }
};

// PENDING USERS (for approval system)
export const getPendingUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/pending-users`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      return await response.json();
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }
};

export const approveUser = async (userId: string, role: string, supervisorId?: string, managerId?: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/approve-user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, role, supervisorId, managerId })
    });

    if (response.ok) {
      toast.success('User approved successfully');
      return true;
    } else {
      const error = await response.json();
      toast.error(error.message || 'Failed to approve user');
      return false;
    }
  } catch (error) {
    console.error('Error approving user:', error);
    toast.error('Failed to approve user');
    return false;
  }
};

export const rejectUser = async (userId: string, reason?: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reject-user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, reason })
    });

    if (response.ok) {
      toast.success('User rejected successfully');
      return true;
    } else {
      const error = await response.json();
      toast.error(error.message || 'Failed to reject user');
      return false;
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    toast.error('Failed to reject user');
    return false;
  }
};

// Clean up localStorage initialization (remove mock data)
export const resetDataToDefaults = () => {
  console.log('Clearing localStorage');
  localStorage.clear();
};
