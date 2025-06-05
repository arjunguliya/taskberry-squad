import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import { Task, TaskStatus, User } from "@/lib/types";
import { formatDate, getInitials, getRelativeTime } from "@/lib/utils";
import { CalendarIcon, CheckCircle, Clock, Edit, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getUserById, getUserByIdAsync, updateTaskStatus } from "@/lib/dataService.ts";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  refetch?: () => void;
}

export function TaskCard({ task, onEdit, refetch }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [assignee, setAssignee] = useState<User | undefined>(undefined);
  const [loadingAssignee, setLoadingAssignee] = useState(true);

  // Load assignee information
  useEffect(() => {
    const loadAssignee = async () => {
      try {
        setLoadingAssignee(true);
        
        // FIXED: Handle cases where assigneeId might be an object or string
        let assigneeId: string;
        let assigneeUser: User | undefined;

        if (typeof task.assigneeId === 'object' && task.assigneeId !== null) {
          // If assigneeId is already a user object, use it directly
          console.log('TaskCard: AssigneeId is an object:', task.assigneeId);
          assigneeUser = {
            id: task.assigneeId.id || task.assigneeId._id,
            name: task.assigneeId.name,
            email: task.assigneeId.email,
            role: task.assigneeId.role || 'member',
            avatarUrl: task.assigneeId.avatarUrl || ''
          };
          assigneeId = assigneeUser.id;
        } else if (typeof task.assigneeId === 'string') {
          // If assigneeId is a string, proceed with normal lookup
          assigneeId = task.assigneeId;
          console.log('TaskCard: AssigneeId is a string:', assigneeId);
        } else {
          console.error('TaskCard: Invalid assigneeId type:', typeof task.assigneeId, task.assigneeId);
          setAssignee(undefined);
          setLoadingAssignee(false);
          return;
        }

        // If we already have the user object, use it
        if (assigneeUser) {
          console.log('TaskCard: Using pre-populated assignee:', assigneeUser);
          setAssignee(assigneeUser);
          setLoadingAssignee(false);
          return;
        }

        // Otherwise, fetch the user by ID
        console.log('TaskCard: Fetching user by ID:', assigneeId);
        
        // First try the synchronous version (might have cached data)
        let user = getUserById(assigneeId);
        console.log('TaskCard: Initial user lookup:', user);
        
        // If we got a loading/fallback user, try to fetch the real data
        if (!user || user.name === 'Loading...' || user.name === 'Unknown User' || user.name.startsWith('User ')) {
          console.log('TaskCard: Fetching real user data for:', assigneeId);
          const realUser = await getUserByIdAsync(assigneeId);
          if (realUser) {
            console.log('TaskCard: Real user fetched:', realUser);
            user = realUser;
          } else {
            console.log('TaskCard: Could not fetch real user, using fallback');
            // Create a better fallback with the task assignee ID
            user = {
              id: assigneeId,
              name: `User (${assigneeId.slice(-4)})`,
              email: `user-${assigneeId}@example.com`,
              role: 'member',
              avatarUrl: ''
            };
          }
        }
        
        console.log('TaskCard: Final assignee set:', user);
        setAssignee(user);
      } catch (error) {
        console.error('TaskCard: Error loading assignee:', error);
        // Use fallback
        const fallbackId = typeof task.assigneeId === 'string' ? task.assigneeId : 'unknown';
        setAssignee({
          id: fallbackId,
          name: `User (${fallbackId.toString().slice(-4)})`,
          email: `user-${fallbackId}@example.com`,
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
      setAssignee(undefined);
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
      className="overflow-hidden transition-all duration-300 hover:shadow-card-hover border 
                 hover:border-primary/20 h-full flex flex-col animate-fade-in"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <StatusBadge task={task} />
          <div className="flex items-center gap-2">
            {loadingAssignee ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Avatar className="h-8 w-8">
                        {assignee?.avatarUrl ? (
                          <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                        ) : (
                          <AvatarFallback>
                            {assignee ? getInitials(assignee.name) : <UserIcon className="h-4 w-4" />}
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
        <h3 className="font-medium text-lg mt-2 line-clamp-1 text-left">{task.title}</h3>
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-2 text-left mb-3">
          {task.description || "No description provided"}
        </p>
        
        {/* Assignee Information */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <UserIcon className="h-3 w-3" />
          {loadingAssignee ? (
            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          ) : (
            <span>
              {assignee?.name || 'No assignee'}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t flex-col items-start gap-2">
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Assigned: {formatDate(task.assignedDate)}</span>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            <Clock className="h-3 w-3" />
            <span>Due: {getRelativeTime(task.targetDate)}</span>
          </div>
        </div>
        
        <div className="w-full flex justify-between items-center mt-2">
          <div className="text-xs text-muted-foreground">
            {task.status === TaskStatus.COMPLETED && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
            {task.status === TaskStatus.IN_PROGRESS && (
              <span className="text-blue-600 font-medium">⏳ In Progress</span>
            )}
            {task.status === TaskStatus.NOT_STARTED && (
              <span className="text-gray-600 font-medium">⭕ Not Started</span>
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
