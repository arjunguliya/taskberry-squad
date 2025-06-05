import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import { Task, TaskStatus, User } from "@/lib/types";
import { formatDate, getInitials, getRelativeTime } from "@/lib/utils";
import { CalendarIcon, CheckCircle, Clock, Edit, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentUser, updateTaskStatus } from "@/lib/dataService.ts";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  refetch?: () => void;
}

export function TaskCard({ task, onEdit, refetch }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [assignee, setAssignee] = useState<User | undefined>(undefined);
  const [loadingAssignee, setLoadingAssignee] = useState(true);

  // Load assignee information with improved logic and better fallback
  useEffect(() => {
    const loadAssignee = async () => {
      try {
        setLoadingAssignee(true);
        console.log('TaskCard: Loading assignee for task:', task.id, 'assigneeId:', task.assigneeId);
        
        let user: User | undefined = undefined;
        const currentUser = getCurrentUser();
        
        // Strategy 1: Check if assignee is current user
        if (currentUser && (currentUser.id === task.assigneeId || currentUser._id === task.assigneeId)) {
          console.log('TaskCard: Assignee is current user');
          user = currentUser;
        }
        
        // Strategy 2: Try to fetch from backend API directly
        if (!user) {
          try {
            console.log('TaskCard: Fetching user from API...');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com';
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/api/users/${task.assigneeId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('TaskCard: User data from API:', userData);
              
              // Handle both MongoDB _id and regular id
              user = {
                id: userData.id || userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                avatarUrl: userData.avatarUrl,
                supervisorId: userData.supervisorId,
                managerId: userData.managerId
              };
              console.log('TaskCard: Processed user:', user);
            } else {
              console.log('TaskCard: API response not ok:', response.status);
            }
          } catch (error) {
            console.log('TaskCard: API fetch failed:', error);
          }
        }
        
        // Strategy 3: Try to get from active users list
        if (!user) {
          try {
            console.log('TaskCard: Trying to get from active users...');
            const { getActiveUsers } = await import('@/lib/dataService');
            const activeUsers = await getActiveUsers();
            console.log('TaskCard: Active users count:', activeUsers.length);
            console.log('TaskCard: Looking for user with ID:', task.assigneeId);
            
            user = activeUsers.find(u => {
              const matches = u.id === task.assigneeId || u._id === task.assigneeId;
              if (matches) {
                console.log('TaskCard: Found matching user:', u.name);
              }
              return matches;
            });
            
            if (user) {
              console.log('TaskCard: Found user in active users:', user.name);
            } else {
              console.log('TaskCard: User not found in active users. Available users:', 
                activeUsers.map(u => ({ id: u.id, _id: u._id, name: u.name })));
            }
          } catch (error) {
            console.log('TaskCard: Failed to get active users:', error);
          }
        }
        
        // Strategy 4: Create a meaningful fallback based on assigneeId
        if (!user) {
          console.log('TaskCard: Creating fallback user for assigneeId:', task.assigneeId);
          
          // Try to extract meaningful info from the assigneeId
          let fallbackName = 'Unknown User';
          
          // If assigneeId looks like a MongoDB ObjectId, use last 4 characters
          if (task.assigneeId && task.assigneeId.length === 24) {
            fallbackName = `User-${task.assigneeId.slice(-4)}`;
          } else if (task.assigneeId && task.assigneeId.length > 4) {
            fallbackName = `User-${task.assigneeId.slice(-4)}`;
          }
          
          user = {
            id: task.assigneeId,
            name: fallbackName,
            email: `${task.assigneeId}@example.com`,
            role: 'member',
            avatarUrl: ''
          };
        }
        
        console.log('TaskCard: Final assignee:', user?.name);
        setAssignee(user);
        
      } catch (error) {
        console.error('TaskCard: Error loading assignee:', error);
        // Final fallback
        setAssignee({
          id: task.assigneeId || 'unknown',
          name: 'Unknown User',
          email: 'unknown@example.com',
          role: 'member',
          avatarUrl: ''
        });
      } finally {
        setLoadingAssignee(false);
      }
    };

    if (task.assigneeId) {
      loadAssignee();
    } else {
      console.log('TaskCard: No assigneeId found for task');
      setAssignee({
        id: 'unassigned',
        name: 'Unassigned',
        email: 'unassigned@example.com',
        role: 'member',
        avatarUrl: ''
      });
      setLoadingAssignee(false);
    }
  }, [task.assigneeId]);

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      if (refetch) {
        refetch();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = () => {
    const targetDate = new Date(task.targetDate);
    const today = new Date();
    
    if (task.status === TaskStatus.COMPLETED) {
      return "text-green-600";
    } else if (targetDate < today) {
      return "text-red-600"; // Overdue
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      return "text-blue-600";
    } else {
      return "text-gray-600";
    }
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-md border 
                 hover:border-primary/20 h-full flex flex-col animate-fade-in"
    >
      {/* Header with better spacing */}
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-start mb-3">
          <StatusBadge task={task} />
          <div className="flex items-center gap-2">
            {loadingAssignee ? (
              <div className="h-7 w-7 rounded-full bg-muted animate-pulse"></div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Avatar className="h-7 w-7">
                        {assignee?.avatarUrl ? (
                          <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {assignee ? getInitials(assignee.name) : <UserIcon className="h-3 w-3" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assigned to: {assignee?.name || 'Unknown User'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <h3 className="font-medium text-base leading-tight line-clamp-2 text-left">{task.title}</h3>
      </CardHeader>
      
      {/* Content with proper spacing */}
      <CardContent className="pb-3 flex-grow">
        {/* Description */}
        {task.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 text-left mb-3">
            {task.description}
          </p>
        )}
        
        {/* Assignee Information */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserIcon className="h-3 w-3 flex-shrink-0" />
          {loadingAssignee ? (
            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          ) : (
            <span className="truncate">
              {assignee?.name || 'Unknown User'}
            </span>
          )}
        </div>
      </CardContent>
      
      {/* Footer with proper spacing */}
      <CardFooter className="pt-3 pb-4 border-t">
        {/* Dates row */}
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Assigned: {formatDate(task.assignedDate)}</span>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            <Clock className="h-3 w-3" />
            <span>Due: {getRelativeTime(task.targetDate)}</span>
          </div>
        </div>
        
        {/* Action Buttons row */}
        <div className="w-full flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {task.status === TaskStatus.COMPLETED && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
            {task.status === TaskStatus.IN_PROGRESS && (
              <span className="text-blue-600 font-medium">⏳ Active</span>
            )}
            {task.status === TaskStatus.NOT_STARTED && (
              <span className="text-gray-600 font-medium">⭕ Pending</span>
            )}
          </div>
          
          <div className="flex gap-1">
            {onEdit && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => onEdit(task)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {task.status !== TaskStatus.COMPLETED ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {isUpdating ? "..." : "Complete"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark as Complete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => handleStatusUpdate(TaskStatus.IN_PROGRESS)}
                      disabled={isUpdating}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {isUpdating ? "..." : "Reopen"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark as In Progress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
