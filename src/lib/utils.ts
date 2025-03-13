
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isAfter, isBefore, isToday, parseISO, addDays } from "date-fns"
import { Task, TaskStatus } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date in human-readable format
export function formatDate(dateString: string): string {
  const date = parseISO(dateString)
  return format(date, 'MMM d, yyyy')
}

// Get relative time (e.g., "2 days ago", "in 3 days")
export function getRelativeTime(dateString: string): string {
  const date = parseISO(dateString)
  const today = new Date()
  
  if (isToday(date)) {
    return "Today"
  }
  
  if (isBefore(date, today)) {
    const diffInDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  } else {
    const diffInDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return `in ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`
  }
}

// Determine task status color
export function getTaskStatusColor(task: Task): string {
  const targetDate = parseISO(task.targetDate)
  const today = new Date()
  const nearDeadline = isBefore(today, targetDate) && 
                        isAfter(today, addDays(targetDate, -3))
  
  if (task.status === TaskStatus.COMPLETED) {
    return "completed" // Green
  } else if (isBefore(targetDate, today)) {
    return "overdue" // Red
  } else if (nearDeadline) {
    return "pending" // Amber
  } else {
    return "default" // Default color
  }
}

// Format status for display
export function formatStatus(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.COMPLETED:
      return "Completed"
    case TaskStatus.IN_PROGRESS:
      return "In Progress"
    case TaskStatus.NOT_STARTED:
      return "Not Started"
    default:
      return status
  }
}

// Calculate task status counts
export function calculateStatusCounts(tasks: Task[]) {
  const today = new Date()
  
  return tasks.reduce((counts, task) => {
    const targetDate = parseISO(task.targetDate)
    
    if (task.status === TaskStatus.COMPLETED) {
      counts.completed++
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      counts.inProgress++
    } else if (task.status === TaskStatus.NOT_STARTED) {
      counts.notStarted++
    }
    
    if (task.status !== TaskStatus.COMPLETED && isBefore(targetDate, today)) {
      counts.overdue++
    }
    
    return counts
  }, { completed: 0, inProgress: 0, notStarted: 0, overdue: 0 })
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
}
