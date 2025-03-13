
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Task } from "@/lib/types";
import { formatDate, getInitials, getRelativeTime } from "@/lib/utils";
import { CalendarIcon, CheckCircle, Clock } from "lucide-react";
import { getUserById } from "@/lib/data";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const assignee = getUserById(task.assigneeId);

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-card-hover border 
                 hover:border-primary/20 h-full flex flex-col animate-fade-in"
      onClick={onClick}
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              // Mark as complete functionality would go here
            }}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Mark Complete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
