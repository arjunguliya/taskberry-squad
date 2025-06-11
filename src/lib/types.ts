export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  MEMBER = 'member',
}

export enum TaskStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress', 
  NOT_STARTED = 'not-started',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | string; // Allow string for flexibility with backend mapping
  avatarUrl?: string;
  supervisorId?: string;
  managerId?: string;
  password?: string; // Optional because existing users don't have it
  status?: 'active' | 'pending_approval' | 'suspended'; // User status
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  // Additional fields for hierarchical relationships
  supervisor?: User; // Populated supervisor object
  manager?: User; // Populated manager object
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  createdBy?: string; // Track who created the task
  assignedDate: string;
  targetDate: string;
  status: TaskStatus;
  priority?: TaskPriority | string; // Task priority
  tags?: string[]; // Array of tags for categorization
  remarks?: string; // NEW: Remarks field
  lastUpdated: string;
  completedDate?: string; // Optional field for when a task is completed
  createdAt?: string;
  updatedAt?: string;
  // Populated fields from backend
  assignee?: User; // Populated assignee object
  creator?: User; // Populated creator object
  // Comments for task collaboration
  comments?: TaskComment[];
}

export interface TaskComment {
  id?: string;
  text: string;
  author: string | User; // Can be user ID or populated user object
  createdAt: string;
  updatedAt?: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  generatedAt: string;
  taskIds: string[];
  // Enhanced report fields
  createdBy?: string;
  description?: string;
  filters?: ReportFilters;
  summary?: ReportSummary;
}

export interface ReportFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignees?: string[];
  tags?: string[];
}

export interface ReportSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  averageCompletionTime?: number; // in days
  productivityScore?: number; // 0-100
}

export interface StatusCount {
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  total?: number;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  token?: string;
  user: User;
  message: string;
}

// Permission interfaces
export interface TaskPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReassign: boolean;
  canUpdateStatus: boolean;
  canComment: boolean;
}

export interface UserPermissions {
  canCreateTasks: boolean;
  canManageTeam: boolean;
  canApproveUsers: boolean;
  canViewReports: boolean;
  canDeleteTasks: boolean;
  canManageSettings: boolean;
}

export interface TaskFieldPermissions {
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditAssignee: boolean;
  canEditTargetDate: boolean;
  canEditStatus: boolean;
  canEditRemarks: boolean;
  canEditPriority: boolean;
  canEditTags: boolean;
}

// Form interfaces
export interface TaskFormData {
  title: string;
  description: string;
  assigneeId: string;
  targetDate: string;
  priority: TaskPriority;
  tags: string[];
  status?: TaskStatus;
}

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole | string;
  supervisorId?: string;
  managerId?: string;
  password?: string;
}

// Filter and search interfaces
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignees?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search?: string;
}

export interface UserFilters {
  roles?: UserRole[];
  status?: string[];
  managers?: string[];
  supervisors?: string[];
  search?: string;
}

// Notification interfaces
export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'user_approved' | 'comment_added';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string; // Task ID, User ID, etc.
  actionUrl?: string;
}

// Dashboard interfaces
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  teamMembers: number;
  recentTasks: Task[];
  upcomingDeadlines: Task[];
  completionRate: number; // percentage
  productivityTrend: 'up' | 'down' | 'stable';
}

// Team hierarchy interfaces
export interface TeamHierarchy {
  manager: User;
  supervisors: Array<{
    supervisor: User;
    members: User[];
  }>;
  directMembers: User[]; // Members directly under manager
}

// Chart data interfaces
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

// Export type unions for convenience
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type UserRoleType = UserRole;

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}
