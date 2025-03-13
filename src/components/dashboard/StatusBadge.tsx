
import { cn } from "@/lib/utils";
import { Task } from "@/lib/types";
import { getTaskStatusColor, formatStatus } from "@/lib/utils";

interface StatusBadgeProps {
  task: Task;
  className?: string;
}

export function StatusBadge({ task, className }: StatusBadgeProps) {
  const statusColor = getTaskStatusColor(task);
  
  const colorClasses = {
    completed: "bg-status-completed/10 text-status-completed border-status-completed/30",
    pending: "bg-status-pending/10 text-status-pending border-status-pending/30",
    overdue: "bg-status-overdue/10 text-status-overdue border-status-overdue/30",
    default: "bg-muted text-muted-foreground border-muted/50",
  };
  
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        colorClasses[statusColor as keyof typeof colorClasses],
        className
      )}
    >
      <span 
        className={cn(
          "mr-1 h-1.5 w-1.5 rounded-full",
          {
            "bg-status-completed": statusColor === "completed",
            "bg-status-pending": statusColor === "pending",
            "bg-status-overdue": statusColor === "overdue",
            "bg-muted-foreground": statusColor === "default",
          }
        )} 
      />
      {formatStatus(task.status)}
    </div>
  );
}
