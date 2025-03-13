
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TaskForm } from "@/components/dashboard/TaskForm";
import { Task, TaskStatus } from "@/lib/types";
import { Plus, Search } from "lucide-react";
import { getCurrentUser, getTasksForTeam } from "@/lib/dataService";

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get tasks based on user role
  const currentUser = getCurrentUser();
  const teamTasks = getTasksForTeam(currentUser.id);
  
  // Filter tasks based on search and status
  const filteredTasks = teamTasks.filter(task => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track team tasks
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

      {filteredTasks.length > 0 ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchQuery ? "Try a different search term or filter" : "Create a new task to get started"}
          </p>
          <Button variant="outline" onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskForm 
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={editingTask}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}
