import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Lock } from "lucide-react";
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

interface FieldPermissions {
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditAssignee: boolean;
  canEditTargetDate: boolean;
  canEditStatus: boolean;
  canEditRemarks: boolean;
}

export function TaskForm({ open, onOpenChange, task, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [targetDate, setTargetDate] = useState<Date>();
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED);
  const [remarks, setRemarks] = useState("");
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [permissions, setPermissions] = useState<FieldPermissions>({
    canEditTitle: false,
    canEditDescription: false,
    canEditAssignee: false,
    canEditTargetDate: false,
    canEditStatus: false,
    canEditRemarks: false
  });
  
  const currentUser = getCurrentUser();
  const isEditing = !!task;
  
  // Calculate field permissions based on user role and task details
  const calculatePermissions = (currentUser: User, task?: Task): FieldPermissions => {
    if (!task) {
      // Creating new task - user can edit all fields
      return {
        canEditTitle: true,
        canEditDescription: true,
        canEditAssignee: true,
        canEditTargetDate: true,
        canEditStatus: true,
        canEditRemarks: true
      };
    }

    const isCreator = task.createdBy === currentUser.id;
    const isAssignee = task.assigneeId === currentUser.id;
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === 'super_admin';
    const isManager = currentUser.role === UserRole.MANAGER || currentUser.role === 'manager';
    const isSupervisor = currentUser.role === UserRole.SUPERVISOR || currentUser.role === 'supervisor';

    // For editing existing tasks
    return {
      // Title: Only creator or super admin can edit
      canEditTitle: isCreator || isSuperAdmin,
      
      // Description: Only creator or super admin can edit
      canEditDescription: isCreator || isSuperAdmin,
      
      // Assignee: Based on role hierarchy
      canEditAssignee: (() => {
        if (isSuperAdmin) return true;
        if (isCreator) return true;
        if (currentUser.role === UserRole.MEMBER || currentUser.role === 'member') return false;
        
        // Supervisor can edit if task is assigned to them or their team members
        if (isSupervisor) {
          return isAssignee; // Can reassign their own tasks
        }
        
        // Manager can edit if task is in their team
        if (isManager) {
          return true; // Managers can generally reassign within their team
        }
        
        return false;
      })(),
      
      // Target Date: Only creator or super admin can edit
      canEditTargetDate: isCreator || isSuperAdmin,
      
      // Status: Assignee or their supervisor/manager can edit
      canEditStatus: (() => {
        if (isSuperAdmin) return true;
        if (isAssignee) return true;
        
        // Check if current user is supervisor/manager of the assignee
        // For now, we'll allow supervisors and managers to edit status
        if (isSupervisor || isManager) return true;
        
        return false;
      })(),
      
      // Remarks: Assignee or their supervisor/manager can edit
      canEditRemarks: (() => {
        if (isSuperAdmin) return true;
        if (isAssignee) return true;
        
        // Check if current user is supervisor/manager of the assignee
        if (isSupervisor || isManager) return true;
        
        return false;
      })()
    };
  };

  // Load assignable users
  const loadAssignableUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('Loading assignable users...');
      const users = await getAssignableUsers(currentUser.id);
      
      // Ensure we always have an array
      if (Array.isArray(users)) {
        console.log('Assignable users loaded:', users.length);
        setAssignableUsers(users);
      } else {
        console.warn('getAssignableUsers did not return an array:', users);
        setAssignableUsers([]);
      }
    } catch (error) {
      console.error('Error loading assignable users:', error);
      setAssignableUsers([]);
      toast.error('Failed to load assignable users');
    } finally {
      setLoadingUsers(false);
    }
  };
  
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode - populate form with task data
        setTitle(task.title);
        setDescription(task.description);
        setAssigneeId(task.assigneeId);
        setTargetDate(new Date(task.targetDate));
        setStatus(task.status);
        setRemarks(task.remarks || "");
        
        // Calculate permissions for existing task
        const perms = calculatePermissions(currentUser, task);
        setPermissions(perms);
      } else {
        // Create mode - reset form
        setTitle("");
        setDescription("");
        setAssigneeId("");
        setTargetDate(undefined);
        setStatus(TaskStatus.NOT_STARTED);
        setRemarks("");
        
        // For new tasks, user can edit all fields
        setPermissions(calculatePermissions(currentUser));
      }
      
      // Load assignable users
      loadAssignableUsers();
    }
  }, [open, task, currentUser.id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assigneeId || !targetDate) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const taskData = {
        title,
        description,
        assigneeId,
        targetDate: targetDate.toISOString(),
        status,
        remarks
      };

      if (isEditing && task) {
        // For editing, only include fields that user can edit
        const updateData: any = { ...task };
        
        if (permissions.canEditTitle) updateData.title = title;
        if (permissions.canEditDescription) updateData.description = description;
        if (permissions.canEditAssignee) updateData.assigneeId = assigneeId;
        if (permissions.canEditTargetDate) updateData.targetDate = targetDate.toISOString();
        if (permissions.canEditStatus) updateData.status = status;
        if (permissions.canEditRemarks) updateData.remarks = remarks;
        
        updateData.lastUpdated = new Date().toISOString();
        
        await updateTask(updateData);
      } else {
        await addTask({
          ...taskData,
          assignedDate: new Date().toISOString()
        });
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const LockedField = ({ children, locked, reason }: { 
    children: React.ReactNode; 
    locked: boolean; 
    reason?: string;
  }) => (
    <div className="relative">
      {children}
      {locked && (
        <div className="absolute inset-0 bg-muted/50 rounded-md flex items-center justify-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            <Lock className="h-3 w-3" />
            {reason || "Read only"}
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Make changes to the existing task." 
              : `As a ${currentUser.role.replace('_', ' ')}, you can assign tasks to team members.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              Task Title*
              {isEditing && !permissions.canEditTitle && (
                <span className="text-xs text-muted-foreground">(Creator only)</span>
              )}
            </Label>
            <LockedField 
              locked={isEditing && !permissions.canEditTitle}
              reason="Only creator can edit title"
            >
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                disabled={isEditing && !permissions.canEditTitle}
                required
                className={cn(
                  isEditing && !permissions.canEditTitle && "bg-muted cursor-not-allowed"
                )}
              />
            </LockedField>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              Description
              {isEditing && !permissions.canEditDescription && (
                <span className="text-xs text-muted-foreground">(Creator only)</span>
              )}
            </Label>
            <LockedField 
              locked={isEditing && !permissions.canEditDescription}
              reason="Only creator can edit description"
            >
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                disabled={isEditing && !permissions.canEditDescription}
                rows={3}
                className={cn(
                  isEditing && !permissions.canEditDescription && "bg-muted cursor-not-allowed"
                )}
              />
            </LockedField>
          </div>
          
          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignee" className="flex items-center gap-2">
              Assigned To*
              {isEditing && !permissions.canEditAssignee && (
                <span className="text-xs text-muted-foreground">(Limited access)</span>
              )}
            </Label>
            <LockedField 
              locked={isEditing && !permissions.canEditAssignee}
              reason="Cannot reassign this task"
            >
              {loadingUsers ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                </div>
              ) : (
                <Select 
                  value={assigneeId} 
                  onValueChange={setAssigneeId}
                  disabled={isEditing && !permissions.canEditAssignee}
                  required
                >
                  <SelectTrigger className={cn(
                    isEditing && !permissions.canEditAssignee && "bg-muted cursor-not-allowed"
                  )}>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(assignableUsers) && assignableUsers.length > 0 ? (
                      assignableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>
                        No users available for assignment
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </LockedField>
            {!loadingUsers && (!Array.isArray(assignableUsers) || assignableUsers.length === 0) && (
              <p className="text-xs text-muted-foreground mt-1">
                No users available for assignment
              </p>
            )}
          </div>
          
          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate" className="flex items-center gap-2">
              Target Date*
              {isEditing && !permissions.canEditTargetDate && (
                <span className="text-xs text-muted-foreground">(Creator only)</span>
              )}
            </Label>
            <LockedField 
              locked={isEditing && !permissions.canEditTargetDate}
              reason="Only creator can edit target date"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isEditing && !permissions.canEditTargetDate}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground",
                      isEditing && !permissions.canEditTargetDate && "bg-muted cursor-not-allowed"
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
                  />
                </PopoverContent>
              </Popover>
            </LockedField>
          </div>
          
          {/* Status */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                Status
                {!permissions.canEditStatus && (
                  <span className="text-xs text-muted-foreground">(Assignee/Supervisor only)</span>
                )}
              </Label>
              <LockedField 
                locked={!permissions.canEditStatus}
                reason="Only assignee or supervisor can edit status"
              >
                <Select 
                  value={status} 
                  onValueChange={(value) => setStatus(value as TaskStatus)}
                  disabled={!permissions.canEditStatus}
                >
                  <SelectTrigger className={cn(
                    !permissions.canEditStatus && "bg-muted cursor-not-allowed"
                  )}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.NOT_STARTED}>Not Started</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </LockedField>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="flex items-center gap-2">
              Remarks
              {isEditing && !permissions.canEditRemarks && (
                <span className="text-xs text-muted-foreground">(Assignee/Supervisor only)</span>
              )}
            </Label>
            <LockedField 
              locked={isEditing && !permissions.canEditRemarks}
              reason="Only assignee or supervisor can edit remarks"
            >
              <Textarea 
                id="remarks" 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isEditing && !permissions.canEditRemarks}
                rows={2}
                placeholder="Add any remarks or notes about this task..."
                className={cn(
                  isEditing && !permissions.canEditRemarks && "bg-muted cursor-not-allowed"
                )}
              />
            </LockedField>
          </div>
          
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
              disabled={isSubmitting || loadingUsers || (!Array.isArray(assignableUsers) || assignableUsers.length === 0)}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
