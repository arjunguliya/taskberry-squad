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
    'member': 'member', // Handle both formats
    'supervisor': 'supervisor', 
    'manager': 'manager',
    'super_admin': 'super_admin'
  };
  return roleMap[frontendRole] || frontendRole;
};

// Map backend roles to frontend roles
const mapRoleForFrontend = (backendRole: string): string => {
  const roleMap: { [key: string]: string } = {
    'member': 'member', // Keep as 'member' for consistency
    'supervisor': 'supervisor',
    'manager': 'manager', 
    'super_admin': 'super_admin'
  };
  return roleMap[backendRole] || backendRole;
};

// USER CACHING FUNCTIONS
// Helper function to get all users synchronously (from cache/localStorage)
const getAllUsersSync = (): User[] => {
  try {
    // Get cached users from localStorage
    const cachedUsers = localStorage.getItem('cachedUsers');
    if (cachedUsers) {
      return JSON.parse(cachedUsers);
    }
    return [];
  } catch (error) {
    console.error('Error getting cached users:', error);
    return [];
  }
};

// Helper function to cache users
export const cacheUsers = (users: User[]): void => {
  try {
    localStorage.setItem('cachedUsers', JSON.stringify(users));
    console.log('Cached', users.length, 'users');
  } catch (error) {
    console.error('Error caching users:', error);
  }
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

// FIXED: Enhanced getUserById function to handle both string IDs and populated user objects
export const getUserById = (id: string | User): User | undefined => {
  try {
    // If the parameter is already a user object, return it
    if (typeof id === 'object' && id !== null) {
      console.log('TaskCard: AssigneeId is an object:', id);
      console.log('TaskCard: Using pre-populated assignee:', id);
      
      // Ensure the user object has a proper id field
      const userObj = id as User;
      return {
        ...userObj,
        id: userObj.id || userObj._id || 'unknown',
        role: mapRoleForFrontend(userObj.role)
      };
    }

    // If it's a string ID, proceed with lookup
    const userId = String(id);

    // Check if it's the current user first
    const currentUser = getCurrentUser();
    if (currentUser && (currentUser.id === userId || currentUser._id === userId)) {
      return {
        ...currentUser,
        id: currentUser.id || currentUser._id
      };
    }

    // Check cached users
    const allUsers = getAllUsersSync();
    const user = allUsers.find(user => (user.id || user._id) === userId);
    
    if (user) {
      return {
        ...user,
        id: user.id || user._id,
        role: mapRoleForFrontend(user.role)
      };
    }
    
    // Return a fallback user for immediate display
    console.log('getUserById: No cached user found for', userId, '- returning fallback');
    return {
      id: userId,
      name: `Loading...`,
      email: `loading@example.com`,
      role: 'member',
      avatarUrl: ''
    };
  } catch (error) {
    console.error('Error in getUserById:', error);
    const userId = typeof id === 'string' ? id : 'unknown';
    return {
      id: userId,
      name: `Unknown User`,
      email: `user-${userId.slice(-4)}@example.com`,
      role: 'member',
      avatarUrl: ''
    };
  }
};

// Async version for fetching from API
export const getUserByIdAsync = async (id: string): Promise<User | undefined> => {
  try {
    console.log('Fetching user by ID:', id);
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const user = await response.json();
      console.log('User fetched successfully:', user);
      
      // Map role to frontend format and ensure we have proper ID
      const mappedUser = {
        ...user,
        id: user.id || user._id,
        role: mapRoleForFrontend(user.role)
      };

      // Update cache with this user
      const cachedUsers = getAllUsersSync();
      const existingUserIndex = cachedUsers.findIndex(u => (u.id || u._id) === id);
      if (existingUserIndex >= 0) {
        cachedUsers[existingUserIndex] = mappedUser;
      } else {
        cachedUsers.push(mappedUser);
      }
      cacheUsers(cachedUsers);

      return mappedUser;
    } else {
      console.error('Failed to fetch user:', response.status, response.statusText);
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return undefined;
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
        id: user.id || user._id,
        role: mapRoleForFrontend(user.role)
      }));
      
      // Cache the users for synchronous access
      cacheUsers(mappedUsers);
      
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

// Get only active users with role mapping and caching
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
        id: user.id || user._id,
        role: mapRoleForFrontend(user.role)
      }));
      
      // Cache the users for synchronous access
      cacheUsers(mappedUsers);
      
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
          id: user.id || user._id,
          role: mapRoleForFrontend(user.role)
        }));
        
        // Cache the users
        cacheUsers(mappedUsers);
        
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
        id: user.id || user._id,
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
        id: data.user.id || data.user._id,
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
  localStorage.removeItem('cachedUsers'); // Clear user cache
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
        id: user.id || user._id,
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
    console.log(`Approving user ${userId} with role ${role}`);
    console.log('Supervisor ID:', supervisorId);
    console.log('Manager ID:', managerId);

    // Map frontend role to backend role
    const backendRole = mapRoleForBackend(role);
    console.log('Mapped role for backend:', backendRole);

    const requestBody = { 
      role: backendRole, // Use mapped role
      supervisorId: supervisorId || null, 
      managerId: managerId || null 
    };

    console.log('Approval request body:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User approved successfully:', data);
      
      // Clear cache to force refresh
      localStorage.removeItem('cachedUsers');
      
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
    } else {
      const error = await response.json();
      console.error('Failed to approve user:', error);
      toast.error(error.message || 'Failed to approve user');
      return false;
    }
  } catch (error) {
    console.error('Error approving user:', error);
    toast.error('Failed to approve user - network error');
    return false;
  }
};

export const rejectUser = async (userId: string, reason?: string): Promise<boolean> => {
  try {
    console.log(`Rejecting user ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/reject`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: reason || 'No reason provided' })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('User rejected:', data);
      toast.success('User rejected successfully');
      return true;
    } else {
      const error = await response.json();
      console.error('Failed to reject user:', error);
      toast.error(error.message || 'Failed to reject user');
      return false;
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    toast.error('Failed to reject user');
    return false;
  }
};

// ENHANCED HIERARCHICAL FUNCTIONS

// Get users by role with proper mapping and backend endpoint
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
          id: user.id || user._id,
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
    case 'member':
      if (!supervisorId || !managerId) {
        return {
          isValid: false,
          error: 'Members must have both a supervisor and manager assigned'
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

// ENHANCED: Get assignable users based on role hierarchy
export const getAssignableUsers = async (currentUserId: string): Promise<User[]> => {
  try {
    console.log('Getting assignable users...');
    
    // Get current user to determine permissions
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('No current user found');
      return [];
    }
    
    console.log('Current user role:', currentUser.role);
    
    // Get all active users from the backend
    const allUsers = await getActiveUsers();
    console.log('All active users:', allUsers.length);
    
    // Ensure we have an array
    if (!Array.isArray(allUsers)) {
      console.warn('getActiveUsers did not return an array:', allUsers);
      return [];
    }
    
    // Filter users based on current user's role and hierarchy
    let assignableUsers: User[] = [];
    
    switch (currentUser.role) {
      case 'super_admin':
        // Super admin can assign tasks to anyone except themselves
        assignableUsers = allUsers.filter(user => user.id !== currentUser.id);
        break;
        
      case 'manager':
        // Managers can assign to supervisors and members
        assignableUsers = allUsers.filter(user => 
          (user.role === 'supervisor' || user.role === 'member') && 
          user.id !== currentUser.id
        );
        break;
        
      case 'supervisor':
        // Supervisors can assign to members and themselves
        assignableUsers = allUsers.filter(user => 
          user.role === 'member' || 
          (user.role === 'supervisor' && user.id === currentUser.id)
        );
        break;
        
      case 'member':
        // Members can only assign tasks to themselves
        assignableUsers = allUsers.filter(user => user.id === currentUser.id);
        break;
        
      default:
        console.warn('Unknown role:', currentUser.role);
        assignableUsers = [];
        break;
    }
    
    console.log('Assignable users found:', assignableUsers.length, assignableUsers.map(u => ({ name: u.name, role: u.role })));
    return assignableUsers;
    
  } catch (error) {
    console.error('Error getting assignable users:', error);
    
    // Fallback: Create minimal assignable users list
    try {
      const currentUser = getCurrentUser();
      
      // At minimum, user should be able to assign to themselves
      const fallbackUsers: User[] = [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl
      }];
      
      console.log('Using fallback assignable users:', fallbackUsers);
      return fallbackUsers;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
};

// TASK FUNCTIONS - Updated to work with backend

// Get all tasks with proper permissions
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    console.log('Fetching all tasks...');
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const tasks = await response.json();
      console.log('Tasks fetched:', tasks.length);
      return tasks;
    } else {
      console.error('Failed to fetch tasks:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

// Get a single task by ID - FIXED: Now returns synchronously for immediate UI needs
export const getTaskById = (id: string): Task | undefined => {
  // For now, return undefined since we don't have task caching yet
  // TODO: Implement task caching similar to user caching
  return undefined;
};

// Async version for fetching from API
export const getTaskByIdAsync = async (id: string): Promise<Task | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const task = await response.json();
      return task;
    } else {
      console.error('Failed to fetch task:', response.status);
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching task:', error);
    return undefined;
  }
};

// Get tasks for a specific user
export const getTasksForUser = async (userId: string): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/user/${userId}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const tasks = await response.json();
      return tasks;
    } else {
      console.error('Failed to fetch user tasks:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
};

// Get tasks for team
export const getTasksForTeam = async (userId: string): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/team/${userId}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const tasks = await response.json();
      return tasks;
    } else {
      console.error('Failed to fetch team tasks:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    return [];
  }
};

// Add a new task
export const addTask = async (taskData: Omit<Task, 'id' | 'lastUpdated'>): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      const newTask = await response.json();
      toast.success('Task created successfully');
      return newTask;
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create task');
    }
  } catch (error: any) {
    console.error('Error creating task:', error);
    toast.error(error.message || 'Failed to create task');
    throw error;
  }
};

// Update an existing task
export const updateTask = async (task: Task): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(task)
    });

    if (response.ok) {
      const updatedTask = await response.json();
      toast.success('Task updated successfully');
      return updatedTask;
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update task');
    }
  } catch (error: any) {
    console.error('Error updating task:', error);
    toast.error(error.message || 'Failed to update task');
    throw error;
  }
};

// Update task status
export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      const updatedTask = await response.json();
      const statusMessage = status === TaskStatus.COMPLETED ? 
        'Task marked as complete' : 
        `Task status changed to ${status}`;
      toast.success(statusMessage);
      return updatedTask;
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update task status');
    }
  } catch (error: any) {
    console.error('Error updating task status:', error);
    toast.error(error.message || 'Failed to update task status');
    return undefined;
  }
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
        id: user.id || user._id,
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
        id: newMember.id || newMember._id,
        role: mapRoleForFrontend(newMember.role)
      };
      
      // Clear cache to force refresh
      localStorage.removeItem('cachedUsers');
      
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
          id: data.user.id || data.user._id,
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
