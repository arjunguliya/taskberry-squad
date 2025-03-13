
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import { Task, TaskStatus } from "@/lib/types";
import { formatDate, getInitials, getRelativeTime } from "@/lib/utils";
import { CalendarIcon, CheckCircle, Clock, Edit } from "lucide-react";
import { useState } from "react";
import { getUserById, updateTaskStatus } from "@/lib/dataService";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  refetch?: () => void;
}

export function TaskCard({ task, onEdit, refetch }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const assignee = getUserById(task.assigneeId);

  const handleStatusUpdate = (newStatus: TaskStatus) => {
    setIsUpdating(true);
    try {
      updateTaskStatus(task.id, newStatus);
      if (refetch) {
        refetch();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setIsUpdating(false);
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
          <Avatar className="h-8 w-8">
            {assignee?.avatarUrl ? (
              <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
            ) : (
              <AvatarFallback>{assignee ? getInitials(assignee.name) : "?"}</AvatarFallback>
            )}
          </Avatar>
        </div>
        <h3 className="font-medium text-lg mt-2 line-clamp-1">{task.title}</h3>
      </CardHeader>
      <CardContent className="pb-4 flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-2">
          {task.description}
        </p>
      </CardContent>
      <CardFooter className="pt-2 border-t flex-col items-start gap-2">
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Assigned: {formatDate(task.assignedDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Due: {getRelativeTime(task.targetDate)}</span>
          </div>
        </div>
        <div className="w-full flex justify-between items-center mt-2">
          {assignee && (
            <span className="text-xs text-muted-foreground">
              Assigned to {assignee.name}
            </span>
          )}
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
                disabled={isUpdating}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                {isUpdating ? "Updating..." : "Mark Complete"}
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={() => handleStatusUpdate(TaskStatus.IN_PROGRESS)}
                disabled={isUpdating}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                {isUpdating ? "Updating..." : "Mark Incomplete"}
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
