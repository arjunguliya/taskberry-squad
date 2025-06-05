import { useState, useEffect } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TaskForm } from "@/components/dashboard/TaskForm";
import { Task, TaskStatus, User } from "@/lib/types";
import { Plus, Search } from "lucide-react";
import { getAllTasks, getTasksForUser, getTasksForTeam } from "@/lib/dataService.ts";

// Context type for user data from AppLayout
interface AppLayoutContext {
  currentUser: User;
}

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get user from AppLayout context
  const { currentUser } = useOutletContext<AppLayoutContext>();
  const memberIdFromUrl = searchParams.get('memberId');

  // Load tasks based on user role and URL parameters
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser?.id) {
          console.error('Tasks: No current user ID available');
          setError('No user data available');
          setLoading(false);
          return;
        }

        let loadedTasks: Task[] = [];

        if (memberIdFromUrl) {
          // Loading tasks for a specific member
          console.log('Tasks: Loading tasks for member:', memberIdFromUrl);
          loadedTasks = await getTasksForUser(memberIdFromUrl);
        } else {
          // Loading tasks based on user role
          console.log('Tasks: Loading tasks for user role:', currentUser.role);
          
          switch (currentUser.role) {
            case 'super_admin':
            case 'manager':
              // Admin and managers can see all tasks or team tasks
              try {
                loadedTasks = await getAllTasks();
              } catch (error) {
                console.log('All tasks not available, falling back to team tasks');
                loadedTasks = await getTasksForTeam(currentUser.id);
              }
              break;
              
            case 'supervisor':
              // Supervisors see their team's tasks
              loadedTasks = await getTasksForTeam(currentUser.id);
              break;
              
            case 'member':
            default:
              // Members see only their own tasks
              loadedTasks = await getTasksForUser(currentUser.id);
              break;
          }
        }

        console.log('Tasks: Loaded tasks:', loadedTasks.length);
        setTasks(Array.isArray(loadedTasks) ? loadedTasks : []);
        
      } catch (error) {
        console.error('Tasks: Error loading tasks:', error);
        setError('Failed to load tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadTasks();
    }
  }, [currentUser, memberIdFromUrl, refreshKey]);
  
  // Filter tasks based on search and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                        (statusFilter === "completed" && task.status === TaskStatus.COMPLETED) ||
                        (statusFilter === "in-progress" && task.status === TaskStatus.IN_PROGRESS) ||
                        (statusFilter === "not-started" && task.status === TaskStatus.NOT_STARTED) ||
                        (statusFilter === "overdue" && new Date(task.targetDate) < new Date() && 
                          task.status !== TaskStatus.COMPLETED);
    
    return matchesSearch && matchesStatus;
  });

  const handleAddTask = () => {
    setEditingTask(undefined);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleTaskSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tasks...</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            {memberIdFromUrl ? 
              "Tasks for selected team member" : 
              `Manage and track ${currentUser.role === 'member' ? 'your' : 'team'} tasks`
            }
          </p>
        </div>
        <Button onClick={handleAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Task
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              defaultValue="all"
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => setRefreshKey(prev => prev + 1)} 
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      )}

      {!error && filteredTasks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <TaskCard 
              key={`${task.id}-${refreshKey}`} 
              task={task}
              onEdit={handleEditTask}
              refetch={handleTaskSuccess}
            />
          ))}
        </div>
      ) : !error && !loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchQuery || statusFilter !== "all" ? 
              "Try a different search term or filter" : 
              "Create a new task to get started"
            }
          </p>
          <Button variant="outline" onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>
      ) : null}

      <TaskForm 
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={editingTask}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}
