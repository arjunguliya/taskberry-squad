
import { useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import { getUserById, updateTaskStatus } from "@/lib/dataService";
import { formatDate, getRelativeTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Calendar, CheckCircle, Clock, Edit, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TaskDetailsListProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  emptyMessage: string;
  refetch?: () => void;
}

export function TaskDetailsList({ tasks, onEdit, emptyMessage, refetch }: TaskDetailsListProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  
  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const handleMarkComplete = async (taskId: string) => {
    setUpdatingTaskId(taskId);
    try {
      await updateTaskStatus(taskId, TaskStatus.COMPLETED);
      if (refetch) refetch();
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="overflow-auto max-h-[60vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const assignee = getUserById(task.assigneeId);
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium">
                  <div className="max-w-[180px] truncate" title={task.title}>
                    {task.title}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-1 mt-1 text-xs">
                        View Details
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs mt-1 text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2 mt-3 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {formatDate(task.targetDate)}</span>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {assignee?.avatarUrl ? (
                        <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {assignee ? getInitials(assignee.name) : <User className="h-3 w-3" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-xs">{assignee?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge task={task} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{getRelativeTime(task.targetDate)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => onEdit(task)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {task.status !== "completed" ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleMarkComplete(task.id)}
                        disabled={updatingTaskId === task.id}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span className="sr-only">Complete</span>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
