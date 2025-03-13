export enum UserRole {
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  MEMBER = 'member',
}

export enum TaskStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress', 
  NOT_STARTED = 'not-started',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  supervisorId?: string;
  managerId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assignedDate: string;
  targetDate: string;
  status: TaskStatus;
  lastUpdated: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  generatedAt: string;
  taskIds: string[];
}

export interface StatusCount {
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}
