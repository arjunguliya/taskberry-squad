import { User, UserRole, Task, TaskStatus, Report } from './types';

// Sample users with hierarchy
export const users: User[] = [
  {
    id: 'manager1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    role: UserRole.MANAGER,
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 'super1',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    role: UserRole.SUPERVISOR,
    managerId: 'manager1',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 'super2',
    name: 'Jamie Rivera',
    email: 'jamie@example.com',
    role: UserRole.SUPERVISOR,
    managerId: 'manager1',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 'mem1',
    name: 'Taylor Chen',
    email: 'taylor@example.com',
    role: UserRole.MEMBER,
    supervisorId: 'super1',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: 'mem2',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    role: UserRole.MEMBER,
    supervisorId: 'super1',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'mem3',
    name: 'Casey Johnson',
    email: 'casey@example.com',
    role: UserRole.MEMBER,
    supervisorId: 'super2',
    avatarUrl: 'https://i.pravatar.cc/150?img=6',
  },
  {
    id: 'mem4',
    name: 'Avery Williams',
    email: 'avery@example.com',
    role: UserRole.MEMBER,
    supervisorId: 'super2',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
  },
  {
    id: 'mem5',
    name: 'Robin Lee',
    email: 'robin@example.com',
    role: UserRole.MEMBER,
    managerId: 'manager1',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
  },
];

// Sample tasks
export const tasks: Task[] = [
  {
    id: 'task1',
    title: 'Design new dashboard layout',
    description: 'Create wireframes and mockups for the new dashboard layout',
    assigneeId: 'mem1',
    assignedDate: '2023-08-01',
    targetDate: '2023-08-15',
    status: TaskStatus.COMPLETED,
    lastUpdated: '2023-08-14',
  },
  {
    id: 'task2',
    title: 'Implement user authentication',
    description: 'Set up authentication system with JWT',
    assigneeId: 'mem2',
    assignedDate: '2023-08-02',
    targetDate: '2023-08-10',
    status: TaskStatus.COMPLETED,
    lastUpdated: '2023-08-09',
  },
  {
    id: 'task3',
    title: 'Create API documentation',
    description: 'Document all API endpoints and their usage',
    assigneeId: 'mem3',
    assignedDate: '2023-08-05',
    targetDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate() + 2).padStart(2, '0')}`,
    status: TaskStatus.IN_PROGRESS,
    lastUpdated: '2023-08-12',
  },
  {
    id: 'task4',
    title: 'Fix navigation bug in mobile view',
    description: 'The side menu does not close properly on mobile devices',
    assigneeId: 'mem4',
    assignedDate: '2023-08-08',
    targetDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate() - 5).padStart(2, '0')}`,
    status: TaskStatus.IN_PROGRESS,
    lastUpdated: '2023-08-13',
  },
  {
    id: 'task5',
    title: 'Optimize database queries',
    description: 'Improve performance of the main dashboard queries',
    assigneeId: 'mem1',
    assignedDate: '2023-08-03',
    targetDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate() - 10).padStart(2, '0')}`,
    status: TaskStatus.NOT_STARTED,
    lastUpdated: '2023-08-03',
  },
];

// Sample reports
export const reports: Report[] = [
  {
    id: 'report1',
    title: 'Daily Progress Report - Aug 14, 2023',
    type: 'daily',
    generatedAt: '2023-08-14',
    taskIds: ['task1', 'task2', 'task3', 'task4'],
  },
  {
    id: 'report2',
    title: 'Weekly Summary - Week 32, 2023',
    type: 'weekly',
    generatedAt: '2023-08-13',
    taskIds: ['task1', 'task2', 'task3', 'task4', 'task5'],
  },
  {
    id: 'report3',
    title: 'Monthly Overview - July 2023',
    type: 'monthly',
    generatedAt: '2023-08-01',
    taskIds: ['task1', 'task2'],
  },
];

// Current User (for demo purposes)
export const currentUser = users[1]; // Default to first supervisor

// Helper functions to get data
export const getUserById = (id: string) => users.find(user => user.id === id);

export const getTaskById = (id: string) => tasks.find(task => task.id === id);

export const getTasksByAssignee = (assigneeId: string) => {
  return tasks.filter(task => task.assigneeId === assigneeId);
};

export const getTeamMembers = (supervisorId: string) => {
  return users.filter(user => user.supervisorId === supervisorId);
};

export const getTasksForTeam = (supervisorId: string) => {
  const teamMemberIds = getTeamMembers(supervisorId).map(member => member.id);
  return tasks.filter(task => teamMemberIds.includes(task.assigneeId));
};
