
import { Task, TaskStatus, User, Report } from '@/lib/types';
import { users, tasks, reports, currentUser as initialCurrentUser } from '@/lib/data';
import { toast } from 'sonner';

// Load data from localStorage or use initial data
const loadData = <T>(key: string, initialData: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initialData;
};

// Save data to localStorage
const saveData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize data
let storedUsers = loadData<User[]>('users', users);
let storedTasks = loadData<Task[]>('tasks', tasks);
let storedReports = loadData<Report[]>('reports', reports);
let storedCurrentUser = loadData<User>('currentUser', initialCurrentUser);

// Data service functions
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

export const getTeamMembers = (supervisorId: string): User[] => 
  storedUsers.filter(user => user.supervisorId === supervisorId);

export const getTasksForTeam = (supervisorId: string): Task[] => {
  const teamMemberIds = getTeamMembers(supervisorId).map(member => member.id);
  return storedTasks.filter(task => teamMemberIds.includes(task.assigneeId));
};

export const getTasksForUser = (userId: string): Task[] => 
  storedTasks.filter(task => task.assigneeId === userId);

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
        // Tasks updated today
        return taskDate.toDateString() === now.toDateString();
      } else if (type === 'weekly') {
        // Tasks updated this week
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return taskDate >= weekStart;
      } else {
        // Tasks updated this month
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
  // For demo purposes, any user can log in with password "password"
  const user = storedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user && password === "password") {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const logout = (): void => {
  // We don't actually remove the current user from localStorage
  // to make demo easier, but in a real app we would
  toast.info('Logged out successfully');
};

// For demo purposes: check if it's the first load and save initial data
if (!localStorage.getItem('initialized')) {
  saveData('users', users);
  saveData('tasks', tasks);
  saveData('reports', reports);
  saveData('currentUser', initialCurrentUser);
  localStorage.setItem('initialized', 'true');
}
