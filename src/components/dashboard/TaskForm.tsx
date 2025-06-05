import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Task, TaskStatus, User } from "@/lib/types";
import { 
  addTask, 
  updateTask, 
  getCurrentUser, 
  getAssignableUsers, 
  getReassignableUsers,
  canEditTask,
  canReassignTask 
} from "@/lib/dataService.ts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSuccess?: () => void;
}

export function TaskForm({ open, onOpenChange, task, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [targetDate, setTargetDate] = useState<Date>();
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [canReassign, setCanReassign] = useState(true);
  const [formError, setFormError] = useState<string>("");
  
  const currentUser = getCurrentUser();
  const isEditing = !!task;
  
  // Load form data when dialog opens
  useEffect(() => {
    if (open) {
      setFormError(""); // Clear any previous errors
      
      if (task) {
        // Edit mode - populate form with task data
        setTitle(task.title);
        setDescription(task.description);
        setAssigneeId(task.assigneeId);
        setTargetDate(new Date(task.targetDate));
        setStatus(task.status);
      } else {
        // Create mode - reset form
        setTitle("");
        setDescription("");
        setAssigneeId("");
        setTargetDate(undefined);
        setStatus(TaskStatus.NOT_STARTED);
      }
      
      // Load users and permissions
      loadUsersAndPermissions();
    }
  }, [open, task, currentUser.id]);

  const loadUsersAndPermissions = async () => {
    try {
      setLoadingUsers(true);
      setFormError("");
      
      // Check permissions for editing (only if editing an existing task)
      if (task) {
        const editPermission = await canEditTask(task.id, currentUser.id);
        const reassignPermission = await canReassignTask(task.id, currentUser.id);
        setCanEdit(editPermission);
        setCanReassign(reassignPermission);
        
        if (!editPermission) {
          setFormError("You don't have permission to edit this task");
          setLoadingUsers(false);
          return;
        }
      } else {
        // For new tasks, user can always edit and reassign
        setCanEdit(true);
        setCanReassign(true);
      }
      
      // Load assignable users
      let users: User[] = [];
      console.log('Loading assignable users...');
      
      try {
        if (isEditing && task && canReassign) {
          // For editing, get reassignable users if user can reassign
          users = await getReassignableUsers(task.id, currentUser.id);
        } else if (isEditing && task && !canReassign) {
          // If can't reassign, just show current assignee
          // We'll need to fetch the current assignee's details
          users = []; // Will be populated below
        } else {
          // For new tasks, get assignable users
          users = await getAssignableUsers(currentUser.id);
        }
        
        console.log('Loaded assignable users:', users);
      } catch (error) {
        console.error('Error loading assignable users:', error);
        // Create fallback user list
        users = [{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          avatarUrl: currentUser.avatarUrl
        }];
        console.log('Using fallback user list:', users);
      }
      
      setAssignableUsers(users);
      
      // Auto-select assignee based on context
      if (!isEditing && users.length > 0) {
        // For new tasks, auto-select based on role
        if (currentUser.role === 'member') {
          // Members can only assign to themselves
          const selfUser = users.find(u => u.id === currentUser.id);
          if (selfUser) {
            setAssigneeId(selfUser.id);
          }
        } else if (users.length === 1) {
          // If only one option, auto-select it
          setAssigneeId(users[0].id);
        }
      }
      
      // If editing and can't reassign, ensure current assignee is selected
      if (isEditing && task && !canReassign) {
        setAssigneeId(task.assigneeId);
      }
      
    } catch (error) {
      console.error('Error loading users and permissions:', error);
      setFormError('Failed to load assignment options. Please try again.');
      
      // Emergency fallback - at least show current user
      setAssignableUsers([{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl
      }]);
      
      if (!isEditing) {
        setAssigneeId(currentUser.id);
      }
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Validation
    if (!title.trim()) {
      setFormError("Task title is required");
      return;
    }
    
    if (!assigneeId) {
      setFormError("Please select an assignee");
      return;
    }
    
    if (!targetDate) {
      setFormError("Please select a target date");
      return;
    }
    
    // Check if target date is in the past (only for new tasks)
    if (!isEditing && targetDate < new Date()) {
      setFormError("Target date cannot be in the past");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && task) {
        // Check permissions before updating
        if (!canEdit) {
          setFormError("You don't have permission to edit this task");
          return;
        }
        
        if (assigneeId !== task.assigneeId && !canReassign) {
          setFormError("You don't have permission to reassign this task");
          return;
        }
        
        const updatedTask: Task = {
          ...task,
          title: title.trim(),
          description: description.trim(),
          assigneeId,
          targetDate: targetDate.toISOString(),
          status
        };
        
        await updateTask(updatedTask);
      } else {
        const newTaskData = {
          title: title.trim(),
          description: description.trim(),
          assigneeId,
          assignedDate: new Date().toISOString(),
          targetDate: targetDate.toISOString(),
          status
        };
        
        await addTask(newTaskData);
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving task:", error);
      setFormError(error.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRole = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFormDescription = () => {
    if (isEditing) {
      if (!canEdit) {
        return "You can view this task but cannot edit it.";
      }
      if (!canReassign) {
        return "You can edit task details but cannot reassign it to another user.";
      }
      return "Edit the task details below.";
    }

    // Create mode descriptions
    switch (currentUser.role) {
      case 'super_admin':
        return "As a super admin, you can assign tasks to anyone in the system.";
      case 'manager':
        return "As a manager, you can assign tasks to supervisors and members in your team.";
      case 'supervisor':
        return "As a supervisor, you can assign tasks to members in your team or yourself.";
      case 'member':
        return "As a member, you can create tasks for yourself.";
      default:
        return "Create a new task.";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'text-green-600';
      case TaskStatus.IN_PROGRESS: return 'text-blue-600';
      case TaskStatus.NOT_STARTED: return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Edit Task" : "Create New Task"}
            {isEditing && task && (
              <span className={cn("text-sm px-2 py-1 rounded-full", getStatusColor(task.status))}>
                {task.status}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {getFormDescription()}
          </DialogDescription>
        </DialogHeader>
        
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title*</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              disabled={!canEdit || isSubmitting}
              placeholder="Enter task title"
              required
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit || isSubmitting}
              placeholder="Enter task description (optional)"
              rows={3} 
            />
          </div>
          
          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignee">
              Assigned To* 
              {isEditing && !canReassign && (
                <span className="text-sm text-muted-foreground">(Cannot be changed)</span>
              )}
            </Label>
            <Select 
              value={assigneeId} 
              onValueChange={setAssigneeId}
              disabled={loadingUsers || (isEditing && !canReassign) || isSubmitting}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingUsers 
                    ? "Loading users..." 
                    : assignableUsers.length === 0 
                      ? "No users available" 
                      : "Select assignee"
                } />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatRole(user.role)})
                      </span>
                      {user.id === currentUser.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">You</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingUsers && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading available users...
              </div>
            )}
            {!loadingUsers && assignableUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {isEditing && !canReassign 
                  ? "You cannot reassign this task" 
                  : "No users available for assignment"
                }
              </p>
            )}
          </div>
          
          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                  disabled={!canEdit || isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={setTargetDate}
                  initialFocus
                  disabled={(date) => 
                    !isEditing && date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Status - Only for editing */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value) => setStatus(value as TaskStatus)}
                disabled={!canEdit || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.NOT_STARTED}>
                    <span className={getStatusColor(TaskStatus.NOT_STARTED)}>Not Started</span>
                  </SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>
                    <span className={getStatusColor(TaskStatus.IN_PROGRESS)}>In Progress</span>
                  </SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>
                    <span className={getStatusColor(TaskStatus.COMPLETED)}>Completed</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                !canEdit || 
                loadingUsers || 
                (assignableUsers.length === 0 && !isEditing)
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting 
                ? (isEditing ? "Updating..." : "Creating...") 
                : (isEditing ? "Update Task" : "Create Task")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
