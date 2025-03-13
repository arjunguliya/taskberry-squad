import { Task, TaskStatus, User, Report, UserRole } from '@/lib/types';
import { users, tasks, reports, currentUser as initialCurrentUser } from '@/lib/data';
import { toast } from 'sonner';

const loadData = <T>(key: string, initialData: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initialData;
};

const saveData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

let storedUsers = loadData<User[]>('users', users);
let storedTasks = loadData<Task[]>('tasks', tasks);
let storedReports = loadData<Report[]>('reports', reports);
let storedCurrentUser = loadData<User>('currentUser', initialCurrentUser);

export const getCurrentUser = (): User => storedCurrentUser;

export const setCurrentUser = (user: User): void => {
  storedCurrentUser = user;
  saveData('currentUser', user);
};

export const getAllUsers = (): User[] => storedUsers;

export const getUserById = (id: string): User | undefined => 
  storedUsers.find(user => user.id === id);

export const getTaskById = (id: string): Task | undefined => 
  storedTasks.find(task => task.id === id);

export const getTeamMembers = (userId: string): User[] => {
  const user = getUserById(userId);
  if (!user) return [];
  
  if (user.role === UserRole.MANAGER) {
    const supervisors = storedUsers.filter(u => u.managerId === userId && u.role === UserRole.SUPERVISOR);
    const directTeamMembers = storedUsers.filter(u => u.managerId === userId && u.role === UserRole.MEMBER);
    const indirectTeamMembers = storedUsers.filter(u => 
      u.role === UserRole.MEMBER && 
      supervisors.some(s => s.id === u.supervisorId)
    );
    return [...supervisors, ...directTeamMembers, ...indirectTeamMembers];
  } else if (user.role === UserRole.SUPERVISOR) {
    return storedUsers.filter(u => u.supervisorId === userId);
  }
  
  return [];
};

export const getDirectReports = (userId: string): User[] => {
  const user = getUserById(userId);
  if (!user) return [];
  
  if (user.role === UserRole.MANAGER) {
    return storedUsers.filter(u => u.managerId === userId);
  } else if (user.role === UserRole.SUPERVISOR) {
    return storedUsers.filter(u => u.supervisorId === userId);
  }
  
  return [];
};

export const getTasksForTeam = (userId: string): Task[] => {
  const user = getUserById(userId);
  if (!user) return [];
  
  if (user.role === UserRole.MANAGER) {
    const teamMemberIds = getTeamMembers(userId).map(member => member.id);
    return storedTasks.filter(task => teamMemberIds.includes(task.assigneeId));
  } else if (user.role === UserRole.SUPERVISOR) {
    const teamMemberIds = getDirectReports(userId).map(member => member.id);
    return storedTasks.filter(task => teamMemberIds.includes(task.assigneeId) || task.assigneeId === userId);
  }
  
  return [];
};

export const getTasksForUser = (userId: string): Task[] => 
  storedTasks.filter(task => task.assigneeId === userId);

export const getAssignableUsers = (assignerId: string): User[] => {
  const assigner = getUserById(assignerId);
  if (!assigner) return [];
  
  if (assigner.role === UserRole.MANAGER) {
    const supervisors = storedUsers.filter(u => 
      u.role === UserRole.SUPERVISOR && 
      u.managerId === assignerId
    );
    
    const directReportingMembers = storedUsers.filter(u => 
      u.role === UserRole.MEMBER && 
      u.managerId === assignerId
    );
    
    return [...supervisors, ...directReportingMembers];
  } else if (assigner.role === UserRole.SUPERVISOR) {
    const directReports = storedUsers.filter(u => 
      u.role === UserRole.MEMBER && 
      u.supervisorId === assignerId
    );
    
    const manager = assigner.managerId;
    const otherSupervisors = manager 
      ? storedUsers.filter(u => 
          u.role === UserRole.SUPERVISOR && 
          u.managerId === manager &&
          u.id !== assignerId
        )
      : [];
    
    return [...directReports, ...otherSupervisors];
  }
  
  return [];
};

export const addTask = (task: Omit<Task, 'id' | 'lastUpdated'>): Task => {
  const newTask: Task = {
    ...task,
    id: `task${Date.now()}`,
    lastUpdated: new Date().toISOString()
  };
  
  storedTasks = [...storedTasks, newTask];
  saveData('tasks', storedTasks);
  toast.success('Task created successfully');
  return newTask;
};

export const updateTask = (task: Task): Task => {
  storedTasks = storedTasks.map(t => t.id === task.id ? 
    { ...task, lastUpdated: new Date().toISOString() } : t);
  saveData('tasks', storedTasks);
  toast.success('Task updated successfully');
  return task;
};

export const updateTaskStatus = (taskId: string, status: TaskStatus): Task | undefined => {
  const task = getTaskById(taskId);
  if (!task) return undefined;
  
  const updatedTask = { 
    ...task, 
    status, 
    lastUpdated: new Date().toISOString() 
  };
  
  storedTasks = storedTasks.map(t => t.id === taskId ? updatedTask : t);
  saveData('tasks', storedTasks);
  
  const statusMessage = status === TaskStatus.COMPLETED ? 
    'Task marked as complete' : 
    `Task status changed to ${status}`;
    
  toast.success(statusMessage);
  return updatedTask;
};

export const addTeamMember = (member: Omit<User, 'id'>): User => {
  const newMember: User = {
    ...member,
    id: `mem${Date.now()}`
  };
  
  storedUsers = [...storedUsers, newMember];
  saveData('users', storedUsers);
  toast.success('Team member added successfully');
  return newMember;
};

export const generateReport = (title: string, type: 'daily' | 'weekly' | 'monthly'): Report => {
  const taskIds = storedTasks
    .filter(task => {
      const taskDate = new Date(task.lastUpdated);
      const now = new Date();
      
      if (type === 'daily') {
        return taskDate.toDateString() === now.toDateString();
      } else if (type === 'weekly') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return taskDate >= weekStart;
      } else {
        return taskDate.getMonth() === now.getMonth() && 
               taskDate.getFullYear() === now.getFullYear();
      }
    })
    .map(task => task.id);
  
  const newReport: Report = {
    id: `report${Date.now()}`,
    title,
    type,
    generatedAt: new Date().toISOString(),
    taskIds
  };
  
  storedReports = [...storedReports, newReport];
  saveData('reports', storedReports);
  toast.success('Report generated successfully');
  return newReport;
};

export const getReports = (): Report[] => storedReports;

export const authenticate = (email: string, password: string): User | null => {
  const user = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user && password === "password") {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const logout = (): void => {
  toast.info('Logged out successfully');
};

if (!localStorage.getItem('initialized')) {
  saveData('users', users);
  saveData('tasks', tasks);
  saveData('reports', reports);
  saveData('currentUser', initialCurrentUser);
  localStorage.setItem('initialized', 'true');
}
