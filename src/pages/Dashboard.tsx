import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TaskForm } from "@/components/dashboard/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Task, TaskStatus, User } from "@/lib/types";
import { calculateStatusCounts, getInitials } from "@/lib/utils";
import { BarChart, CalendarClock, CheckCircle, Clock, ListTodo, Plus, Users, X } from "lucide-react";
import { getAllTasks, getTeamMembers } from "@/lib/dataService.ts";
import { TaskDetailsList } from "@/components/dashboard/TaskDetailsList";
import { TeamMembersList } from "@/components/dashboard/TeamMembersList";
import { useIsMobile } from "@/hooks/use-mobile";

// Context type for user data from AppLayout
interface AppLayoutContext {
  currentUser: User;
}

export default function Dashboard() {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Dialog states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [completedTasksDialogOpen, setCompletedTasksDialogOpen] = useState(false);
  const [inProgressTasksDialogOpen, setInProgressTasksDialogOpen] = useState(false);
  const [overdueTasksDialogOpen, setOverdueTasksDialogOpen] = useState(false);
  
  // Get user from AppLayout context (safer than calling getCurrentUser directly)
  const { currentUser } = useOutletContext<AppLayoutContext>();

  // Load data safely
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('Dashboard: Loading data for user:', currentUser?.name);
        setLoading(true);
        setError(null);
        
        if (!currentUser?.id) {
          console.error('Dashboard: No current user ID available');
          setError('No user data available');
          setLoading(false);
          return;
        }

        // Load tasks
        try {
          console.log('Loading tasks...');
          const tasks = await getAllTasks();
          console.log('Dashboard: Loaded tasks:', tasks);
          
          // Ensure we have an array
          if (Array.isArray(tasks)) {
            setAllTasks(tasks);
          } else {
            console.error('getAllTasks did not return an array:', tasks);
            setAllTasks([]);
          }
        } catch (taskError) {
          console.error('Error loading tasks:', taskError);
          setAllTasks([]);
        }

        // Load team members
        try {
          console.log('Loading team members...');
          const members = await getTeamMembers(currentUser.id);
          console.log('Dashboard: Loaded team members:', members);
          
          // Ensure we have an array
          if (Array.isArray(members)) {
            setTeamMembers(members);
          } else {
            console.error('getTeamMembers did not return an array:', members);
            setTeamMembers([]);
          }
        } catch (teamError) {
          console.error('Error loading team members:', teamError);
          setTeamMembers([]);
        }
        
        console.log('Dashboard: Data loaded successfully');
      } catch (error) {
        console.error('Dashboard: Error loading data:', error);
        setError('Failed to load dashboard data');
        // Set empty arrays as fallback
        setTeamMembers([]);
        setAllTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, refreshKey]);

  // Calculate stats safely
  const statusCounts = Array.isArray(allTasks) && allTasks.length > 0 ? calculateStatusCounts(allTasks) : {
    completed: 0,
    inProgress: 0,
    overdue: 0,
    notStarted: 0
  };
  
  // Filter tasks by status safely
  const completedTasks = Array.isArray(allTasks) ? allTasks.filter(task => 
    task && task.status === TaskStatus.COMPLETED
  ) : [];
  
  const inProgressTasks = Array.isArray(allTasks) ? allTasks.filter(task => 
    task && task.status === TaskStatus.IN_PROGRESS
  ) : [];
  
  const overdueTasks = Array.isArray(allTasks) ? allTasks.filter(task => {
    if (!task || !task.targetDate) return false;
    const today = new Date();
    const dueDate = new Date(task.targetDate);
    return dueDate < today && task.status !== TaskStatus.COMPLETED;
  }) : [];
  
  // Recent tasks (limited to 5)
  const recentTasks = Array.isArray(allTasks) ? [...allTasks]
    .sort((a, b) => {
      if (!a.lastUpdated || !b.lastUpdated) return 0;
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    })
    .slice(0, 5) : [];

  const handleTaskSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedTask(undefined);
  };
  
  const handleNewTask = () => {
    setSelectedTask(undefined);
    setIsTaskFormOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  // Create component based on screen size
  const DialogComponent = isMobile ? Drawer : Dialog;
  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogHeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load user data</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-red-600">{error}</p>
          </div>
          <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser.name}!
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href = "/reports"}>
            <BarChart className="h-4 w-4 mr-1" />
            Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="animate-slide-up animation-delay-100 cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => setTeamDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(teamMembers) ? teamMembers.length : 0}</div>
            <div className="mt-2">
              <AvatarGroup users={teamMembers} />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="animate-slide-up animation-delay-200 cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => setCompletedTasksDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tasks
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
            <p className="text-xs text-muted-foreground">
              Total completed tasks
            </p>
          </CardContent>
        </Card>
        <Card 
          className="animate-slide-up animation-delay-300 cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => setInProgressTasksDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.inProgress} active tasks
            </p>
          </CardContent>
        </Card>
        <Card 
          className="animate-slide-up animation-delay-400 cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => setOverdueTasksDialogOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Tasks
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Overview */}
      <Tabs defaultValue="recent" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="recent">Recent Tasks</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/tasks"}>
            View all
            <ListTodo className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentTasks.map(task => (
              <TaskCard 
                key={`${task.id}-${refreshKey}`} 
                task={task} 
                onEdit={handleEditTask} 
                refetch={handleTaskSuccess}
              />
            ))}
            {recentTasks.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <p className="text-muted-foreground">No recent tasks found. Create a new task to get started.</p>
                <Button className="mt-4" onClick={handleNewTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allTasks.slice(0, 6).map(task => (
              <TaskCard 
                key={`${task.id}-${refreshKey}`} 
                task={task} 
                onEdit={handleEditTask} 
                refetch={handleTaskSuccess}
              />
            ))}
            {allTasks.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <p className="text-muted-foreground">No tasks found. Create a new task to get started.</p>
                <Button className="mt-4" onClick={handleNewTask}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Task Form Dialog */}
      <TaskForm 
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={selectedTask}
        onSuccess={handleTaskSuccess}
      />

      {/* Team Members Dialog */}
      <DialogComponent open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContentComponent className="sm:max-w-[600px]">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({Array.isArray(teamMembers) ? teamMembers.length : 0})
            </DialogTitleComponent>
          </DialogHeaderComponent>
          <TeamMembersList members={teamMembers} />
        </DialogContentComponent>
      </DialogComponent>

      {/* Completed Tasks Dialog */}
      <DialogComponent open={completedTasksDialogOpen} onOpenChange={setCompletedTasksDialogOpen}>
        <DialogContentComponent className="sm:max-w-[600px]">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Tasks ({completedTasks.length})
            </DialogTitleComponent>
          </DialogHeaderComponent>
          <TaskDetailsList 
            tasks={completedTasks} 
            onEdit={handleEditTask} 
            emptyMessage="No completed tasks found."
            refetch={handleTaskSuccess}
          />
        </DialogContentComponent>
      </DialogComponent>

      {/* In Progress Tasks Dialog */}
      <DialogComponent open={inProgressTasksDialogOpen} onOpenChange={setInProgressTasksDialogOpen}>
        <DialogContentComponent className="sm:max-w-[600px]">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              In Progress Tasks ({inProgressTasks.length})
            </DialogTitleComponent>
          </DialogHeaderComponent>
          <TaskDetailsList 
            tasks={inProgressTasks} 
            onEdit={handleEditTask} 
            emptyMessage="No in-progress tasks found."
            refetch={handleTaskSuccess}
          />
        </DialogContentComponent>
      </DialogComponent>

      {/* Overdue Tasks Dialog */}
      <DialogComponent open={overdueTasksDialogOpen} onOpenChange={setOverdueTasksDialogOpen}>
        <DialogContentComponent className="sm:max-w-[600px]">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Overdue Tasks ({overdueTasks.length})
            </DialogTitleComponent>
          </DialogHeaderComponent>
          <TaskDetailsList 
            tasks={overdueTasks} 
            onEdit={handleEditTask} 
            emptyMessage="No overdue tasks found."
            refetch={handleTaskSuccess}
          />
        </DialogContentComponent>
      </DialogComponent>
    </div>
  );
}
