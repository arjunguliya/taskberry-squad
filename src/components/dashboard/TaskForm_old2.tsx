import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Task, TaskStatus, User, UserRole } from "@/lib/types";
import { addTask, updateTask, getCurrentUser, getAssignableUsers } from "@/lib/dataService.ts";
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
  
  const currentUser = getCurrentUser();
  const isEditing = !!task;
  
  useEffect(() => {
    if (open) {
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
      
      // Load assignable users based on current user role
      loadAssignableUsers();
    }
  }, [open, task]);

  const loadAssignableUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('TaskForm: Loading assignable users...');
      
      const users = await getAssignableUsers(currentUser.id);
      console.log('TaskForm: Assignable users loaded:', users.length);
      
      setAssignableUsers(users);
      
      // If creating a new task and user can assign to themselves, pre-select themselves
      if (!task && users.length > 0) {
        const selfUser = users.find(user => user.id === currentUser.id);
        if (selfUser) {
          setAssigneeId(selfUser.id);
        }
      }
      
    } catch (error) {
      console.error('TaskForm: Error loading assignable users:', error);
      toast.error('Failed to load assignable users');
      
      // Fallback: at minimum, user should be able to assign to themselves
      setAssignableUsers([{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl
      }]);
      setAssigneeId(currentUser.id);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assigneeId || !targetDate) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && task) {
        console.log('TaskForm: Updating task:', task.id);
        await updateTask({
          ...task,
          title,
          description,
          assigneeId,
          targetDate: targetDate.toISOString(),
          status
        });
        toast.success('Task updated successfully');
      } else {
        console.log('TaskForm: Creating new task');
        await addTask({
          title,
          description,
          assigneeId,
          assignedDate: new Date().toISOString(),
          targetDate: targetDate.toISOString(),
          status
        });
        toast.success('Task created successfully');
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("TaskForm: Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'super_admin': 'Super Admin',
      'manager': 'Manager',
      'supervisor': 'Supervisor',
      'member': 'Member'
    };
    return roleMap[role] || role;
  };

  const getFormDescription = (): string => {
    if (isEditing) {
      return "Make changes to the existing task.";
    }

    switch (currentUser.role) {
      case 'super_admin':
        return "As a Super Admin, you can assign tasks to anyone in the organization.";
      case 'manager':
        return "As a Manager, you can assign tasks to supervisors and team members.";
      case 'supervisor':
        return "As a Supervisor, you can assign tasks to team members and yourself.";
      case 'member':
        return "As a Team Member, you can create tasks for yourself.";
      default:
        return "Create a new task.";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {getFormDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title*</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              placeholder="Enter a descriptive title for the task"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what needs to be done..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignee">Assigned To*</Label>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-3 border rounded-md">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-muted-foreground">Loading users...</span>
              </div>
            ) : (
              <Select 
                value={assigneeId} 
                onValueChange={setAssigneeId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({getRoleDisplayName(user.role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {assignableUsers.length === 0 && !loadingUsers && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ No users available for assignment. Check your permissions or contact an administrator.
              </p>
            )}
          </div>
          
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
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.NOT_STARTED}>Not Started</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter>
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
              disabled={isSubmitting || loadingUsers || assignableUsers.length === 0}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
