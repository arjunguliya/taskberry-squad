import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import { Task, TaskStatus, User } from "@/lib/types";
import { formatDate, getInitials, getRelativeTime } from "@/lib/utils";
import { CalendarIcon, CheckCircle, Clock, Edit, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getUserById, getUserByIdAsync, updateTaskStatus, getActiveUsers } from "@/lib/dataService.ts";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  refetch?: () => void;
}

export function TaskCard({ task, onEdit, refetch }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [assignee, setAssignee] = useState<User | undefined>(undefined);
  const [loadingAssignee, setLoadingAssignee] = useState(true);

  // Load assignee information with better logic
  useEffect(() => {
    const loadAssignee = async () => {
      try {
        setLoadingAssignee(true);
        console.log('TaskCard: Loading assignee for task:', task.id, 'assigneeId:', task.assigneeId);
        
        let user: User | undefined = undefined;
        
        // Strategy 1: Try to get from active users list (most reliable)
        try {
          const activeUsers = await getActiveUsers();
          console.log('TaskCard: Active users loaded:', activeUsers.length);
          user = activeUsers.find(u => u.id === task.assigneeId || u._id === task.assigneeId);
          console.log('TaskCard: Found user in active users:', user?.name);
        } catch (error) {
          console.log('TaskCard: Failed to get active users, trying individual fetch');
        }
        
        // Strategy 2: If not found, try individual fetch
        if (!user) {
          try {
            user = await getUserByIdAsync(task.assigneeId);
            console.log('TaskCard: User from async fetch:', user?.name);
          } catch (error) {
            console.log('TaskCard: Async fetch failed, trying sync');
          }
        }
        
        // Strategy 3: Fallback to sync version
        if (!user) {
          user = getUserById(task.assigneeId);
          console.log('TaskCard: User from sync fetch:', user?.name);
        }
        
        // Only show "Unknown User" if all strategies failed
        if (!user) {
          console.warn('TaskCard: No user found for assigneeId:', task.assigneeId);
          user = {
            id: task.assigneeId,
            name: 'Unknown User',
            email: 'unknown@example.com',
            role: 'member',
            avatarUrl: ''
          };
        } else {
          console.log('TaskCard: Successfully loaded assignee:', user.name);
        }
        
        setAssignee(user);
      } catch (error) {
        console.error('TaskCard: Error loading assignee:', error);
        // Final fallback
        setAssignee({
          id: task.assigneeId,
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
      {/* Compact Header */}
      <CardHeader className="pb-3 pt-3">
        <div className="flex justify-between items-start mb-2">
          <StatusBadge task={task} />
          <div className="flex items-center gap-2">
            {loadingAssignee ? (
              <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Avatar className="h-6 w-6">
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
        <h3 className="font-medium text-base leading-tight line-clamp-1 text-left">{task.title}</h3>
      </CardHeader>
      
      {/* Compact Content */}
      <CardContent className="pb-2 flex-grow">
        {/* Description - only show if exists and keep it short */}
        {task.description && (
          <p className="text-muted-foreground text-xs line-clamp-1 text-left mb-2">
            {task.description}
          </p>
        )}
        
        {/* Assignee Information - Compact */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <UserIcon className="h-3 w-3 flex-shrink-0" />
          {loadingAssignee ? (
            <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
          ) : (
            <span className="truncate">
              {assignee?.name || 'Unknown User'}
            </span>
          )}
        </div>
      </CardContent>
      
      {/* Compact Footer */}
      <CardFooter className="pt-2 pb-3 border-t">
        {/* Dates - Compact single row */}
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span className="truncate">{formatDate(task.assignedDate)}</span>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            <Clock className="h-3 w-3" />
            <span className="truncate">{getRelativeTime(task.targetDate)}</span>
          </div>
        </div>
        
        {/* Action Buttons - Compact */}
        <div className="w-full flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {task.status === TaskStatus.COMPLETED && (
              <span className="text-green-600 font-medium">✓ Done</span>
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
                      className="h-6 w-6 p-0"
                      onClick={() => onEdit(task)}
                    >
                      <Edit className="h-3 w-3" />
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
                      className="h-6 px-2 text-xs hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {isUpdating ? "..." : "Done"}
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
                      className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => handleStatusUpdate(TaskStatus.IN_PROGRESS)}
                      disabled={isUpdating}
                    >
                      <Clock className="h-3 w-3 mr-1" />
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
