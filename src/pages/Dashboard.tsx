
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { TaskForm } from "@/components/dashboard/TaskForm";
import { TaskStatus } from "@/lib/types";
import { calculateStatusCounts, getInitials } from "@/lib/utils";
import { BarChart, CalendarClock, CheckCircle, Clock, ListTodo, Plus, Users } from "lucide-react";
import { getCurrentUser, getTasksForTeam, getTeamMembers } from "@/lib/dataService";

export default function Dashboard() {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get data based on user role
  const currentUser = getCurrentUser();
  const teamMembers = getTeamMembers(currentUser.id);
  const teamTasks = getTasksForTeam(currentUser.id);
  const statusCounts = calculateStatusCounts(teamTasks);
  
  // Recent tasks (limited to 5)
  const recentTasks = [...teamTasks].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  ).slice(0, 5);

  const handleTaskSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

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
          <Button size="sm" onClick={() => setIsTaskFormOpen(true)}>
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
        <Card className="animate-slide-up animation-delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <div className="mt-2">
              <AvatarGroup users={teamMembers} />
            </div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up animation-delay-200">
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
        <Card className="animate-slide-up animation-delay-300">
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
        <Card className="animate-slide-up animation-delay-400">
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
            <TabsTrigger value="team">Team Tasks</TabsTrigger>
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
                onEdit={() => setIsTaskFormOpen(true)} 
                refetch={handleTaskSuccess}
              />
            ))}
            {recentTasks.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <p className="text-muted-foreground">No recent tasks found. Create a new task to get started.</p>
                <Button className="mt-4" onClick={() => setIsTaskFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamTasks.slice(0, 6).map(task => (
              <TaskCard 
                key={`${task.id}-${refreshKey}`} 
                task={task} 
                onEdit={() => setIsTaskFormOpen(true)} 
                refetch={handleTaskSuccess}
              />
            ))}
            {teamTasks.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <p className="text-muted-foreground">No team tasks found. Create a new task to get started.</p>
                <Button className="mt-4" onClick={() => setIsTaskFormOpen(true)}>
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
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}
