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

// ROLE MAPPING FUNCTIONS
// Map frontend roles to backend roles
const mapRoleForBackend = (frontendRole: string): string => {
  const roleMap: { [key: string]: string } = {
    'team_member': 'member',
    'supervisor': 'supervisor', 
    'manager': 'manager',
    'super_admin': 'super_admin'
  };
  return roleMap[frontendRole] || frontendRole;
};

// Map backend roles to frontend roles
const mapRoleForFrontend = (backendRole: string): string => {
  const roleMap: { [key: string]: string } = {
    'member': 'team_member',
    'supervisor': 'supervisor',
    'manager': 'manager', 
    'super_admin': 'super_admin'
  };
  return roleMap[backendRole] || backendRole;
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
    console.log('Fetching all users...');
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log('All users API response:', data);
      
      // Map backend roles to frontend roles
      const mappedUsers = data.map((user: User) => ({
        ...user,
        role: mapRoleForFrontend(user.role)
      }));
      
      return mappedUsers;
    } else {
      console.error('Failed to fetch all users:', response.status, response.statusText);
      throw new Error('Failed to fetch users');
    }
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// ENHANCED: Get only active users with role mapping
export const getActiveUsers = async (): Promise<User[]> => {
  try {
    console.log('Fetching active users...');
    const response = await fetch(`${API_BASE_URL}/api/users/active`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Active users API response:', data);
      
      // Map backend roles to frontend roles
      const mappedUsers = data.map((user: User) => ({
        ...user,
        role: mapRoleForFrontend(user.role)
      }));
      
      console.log('Active users with mapped roles:', mappedUsers);
      return mappedUsers;
    } else {
      console.error('Failed to fetch active users:', response.status, response.statusText);
      // Fallback to old method if new endpoint doesn't exist
      const response2 = await fetch(`${API_BASE_URL}/api/users`, {
        headers: getAuthHeaders()
      });

      if (response2.ok) {
        const data = await response2.json();
        console.log('All users API response (fallback):', data);
        
        // Filter for active users only and map roles
        const activeUsers = data.filter((user: User) => user.status === 'active');
        const mappedUsers = activeUsers.map((user: User) => ({
          ...user,
          role: mapRoleForFrontend(user.role)
        }));
        
        console.log('Active users filtered and mapped:', mappedUsers);
        return mappedUsers;
      } else {
        throw new Error('Failed to fetch users');
      }
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
      const user = await response.json();
      // Map role to frontend format
      return {
        ...user,
        role: mapRoleForFrontend(user.role)
      };
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
      const user = await response.json();
      // Map role to frontend format
      return {
        ...user,
        role: mapRoleForFrontend(user.role)
      };
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
      
      // Map role to frontend format before storing
      const userWithMappedRole = {
        ...data.user,
        role: mapRoleForFrontend(data.user.role)
      };
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userWithMappedRole));
      
      console.log('Authentication successful:', userWithMappedRole);
      return userWithMappedRole;
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

// PENDING USERS (for approval system)
export const getPendingUsers = async (): Promise<User[]> => {
  try {
    console.log('Fetching pending users...');
    const response = await fetch(`${API_BASE_URL}/api/users/pending`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Pending users API response:', data);
      
      // Map roles to frontend format
      const mappedUsers = data.map((user: User) => ({
        ...user,
        role: mapRoleForFrontend(user.role)
      }));
      
      return Array.isArray(mappedUsers) ? mappedUsers : [];
    } else {
      console.error('Failed to fetch pending users:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return [];
    }
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }
};

// ENHANCED APPROVAL FUNCTION with role mapping and hierarchical assignments
export const approveUser = async (
  userId: string, 
  role: string, 
  supervisorId?: string, 
  managerId?: string
): Promise<boolean> => {
  try {
    console.log('=== APPROVE USER API CALL ===');
    console.log(`Approving user ${userId} with role ${role}`);
    console.log('Supervisor ID:', supervisorId);
    console.log('Manager ID:', managerId);

    // Map frontend role to backend role (if needed)
    const backendRole = mapRoleForBackend(role);
    console.log('Mapped role for backend:', backendRole);

    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!role) {
      throw new Error('Role is required');
    }

    // Validate hierarchy requirements
    if (role === 'member') {
      if (!supervisorId || !managerId) {
        throw new Error('Members must have both supervisor and manager assigned');
      }
    } else if (role === 'supervisor') {
      if (!managerId) {
        throw new Error('Supervisors must have a manager assigned');
      }
    }

    const requestBody = { 
      role: backendRole, // Use mapped role
      supervisorId: supervisorId || null, 
      managerId: managerId || null 
    };

    console.log('Approval request body:', requestBody);

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Approval response status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Approval error response:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('User approved successfully:', data);
    
    // Show success message with hierarchy info
    let successMessage = `User approved as ${role.replace('_', ' ')}`;
    if (data.hierarchy) {
      if (data.hierarchy.supervisor) {
        successMessage += ` under supervisor ${data.hierarchy.supervisor.name}`;
      }
      if (data.hierarchy.manager) {
        successMessage += ` reporting to manager ${data.hierarchy.manager.name}`;
      }
    } else if (supervisorId || managerId) {
      successMessage += ' with reporting structure assigned';
    }
    
    toast.success(successMessage);
    return true;
    
  } catch (error) {
    console.error('=== APPROVAL ERROR ===');
    console.error('Error approving user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Network error: Cannot connect to server. Please check your connection.');
      } else if (error.message.includes('401')) {
        toast.error('Authentication failed. Please log in again.');
        // Redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.message.includes('403')) {
        toast.error('Permission denied. You do not have permission to approve users.');
      } else if (error.message.includes('404')) {
        toast.error('User not found or approval endpoint not available.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.error('Failed to approve user - unknown error');
    }
    
    return false;
  }
};

// ENHANCED HIERARCHICAL FUNCTIONS

// NEW: Get users by role with proper mapping and backend endpoint
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    console.log(`Fetching users with role: ${role}`);
    const backendRole = mapRoleForBackend(role);
    
    // Try new backend endpoint first
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/by-role/${backendRole}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const users = await response.json();
        // Map roles back to frontend format
        const mappedUsers = users.map((user: User) => ({
          ...user,
          role: mapRoleForFrontend(user.role)
        }));
        console.log(`Found ${mappedUsers.length} users with role ${role}:`, mappedUsers);
        return mappedUsers;
      } else {
        console.log('New endpoint not available, falling back to client-side filtering');
        throw new Error('Endpoint not available');
      }
    } catch (endpointError) {
      // Fallback to client-side filtering
      console.log('Using fallback method for role filtering');
      const allUsers = await getActiveUsers();
      const filteredUsers = allUsers.filter(user => user.role === role);
      console.log(`Found ${filteredUsers.length} users with role ${role}:`, filteredUsers);
      return filteredUsers;
    }
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    return [];
  }
};

// Function to get supervisors
export const getSupervisors = async (): Promise<User[]> => {
  return getUsersByRole('supervisor');
};

// Function to get managers  
export const getManagers = async (): Promise<User[]> => {
  return getUsersByRole('manager');
};

// Function to validate hierarchical assignment
export const validateHierarchy = (
  role: string, 
  supervisorId?: string, 
  managerId?: string
): { isValid: boolean; error?: string } => {
  switch (role) {
    case 'team_member':
      if (!supervisorId || !managerId) {
        return {
          isValid: false,
          error: 'Team members must have both a supervisor and manager assigned'
        };
      }
      break;
    
    case 'supervisor':
      if (!managerId) {
        return {
          isValid: false,
          error: 'Supervisors must have a manager assigned'
        };
      }
      break;
    
    case 'manager':
      // Managers don't need supervisor or manager assignments
      break;
    
    default:
      return {
        isValid: false,
        error: 'Invalid role specified'
      };
  }
  
  return { isValid: true };
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
      const users = await response.json();
      // Map roles to frontend format
      return users.map((user: User) => ({
        ...user,
        role: mapRoleForFrontend(user.role)
      }));
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
      const users = await response.json();
      // Map roles to frontend format
      return users.map((user: User) => ({
        ...user,
        role: mapRoleForFrontend(user.role)
      }));
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
    // Map role to backend format before sending
    const memberWithBackendRole = {
      ...member,
      role: mapRoleForBackend(member.role)
    };
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(memberWithBackendRole)
    });

    if (response.ok) {
      const newMember = await response.json();
      // Map role back to frontend format
      const mappedMember = {
        ...newMember,
        role: mapRoleForFrontend(newMember.role)
      };
      
      toast.success('Team member added successfully');
      return mappedMember;
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
    console.log(`Attempting to register user: ${email}`);
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    console.log('Registration response:', data);

    if (response.ok) {
      // Map role to frontend format if user data is returned
      let userWithMappedRole = data.user;
      if (data.user && data.user.role) {
        userWithMappedRole = {
          ...data.user,
          role: mapRoleForFrontend(data.user.role)
        };
      }
      
      // Store token and user data if registration is successful
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userWithMappedRole));
      }

      return {
        success: true,
        message: data.message || 'Registration successful',
        user: userWithMappedRole
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

// Clean up localStorage initialization (remove mock data)
export const resetDataToDefaults = () => {
  console.log('Clearing localStorage');
  localStorage.clear();
};
