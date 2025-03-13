
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserRole } from "@/lib/types";
import { addTeamMember, getCurrentUser, getAllUsers } from "@/lib/dataService";
import { toast } from "sonner";

interface TeamMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TeamMemberForm({ open, onOpenChange, onSuccess }: TeamMemberFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentUser = getCurrentUser();
  const allUsers = getAllUsers();
  const supervisors = allUsers.filter(user => user.role === UserRole.SUPERVISOR);
  const managers = allUsers.filter(user => user.role === UserRole.MANAGER);
  
  useEffect(() => {
    if (open) {
      // Reset form when opened
      setName("");
      setEmail("");
      
      // Default role based on current user's role
      if (currentUser.role === UserRole.MANAGER) {
        setRole(UserRole.SUPERVISOR);
        setManagerId(currentUser.id);
      } else if (currentUser.role === UserRole.SUPERVISOR) {
        setRole(UserRole.MEMBER);
        setSupervisorId(currentUser.id);
        // Find the manager for this supervisor
        const supervisor = allUsers.find(u => u.id === currentUser.id);
        if (supervisor?.managerId) {
          setManagerId(supervisor.managerId);
        }
      }
    }
  }, [open, currentUser, allUsers]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    
    if (role === UserRole.SUPERVISOR && !managerId) {
      toast.error("Supervisor must be assigned to a manager");
      return;
    }
    
    if (role === UserRole.MEMBER && !supervisorId) {
      toast.error("Team member must be assigned to a supervisor");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addTeamMember({
        name,
        email,
        role,
        supervisorId: role === UserRole.MEMBER ? supervisorId : undefined,
        managerId: role === UserRole.SUPERVISOR ? managerId : undefined,
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Failed to add team member");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to your team. {currentUser.role === UserRole.MANAGER 
              ? "As a manager, you can add supervisors." 
              : "As a supervisor, you can add team members."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name*</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={role} 
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {currentUser.role === UserRole.MANAGER && (
                  <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
                )}
                {currentUser.role === UserRole.SUPERVISOR && (
                  <SelectItem value={UserRole.MEMBER}>Team Member</SelectItem>
                )}
                {currentUser.role === UserRole.MANAGER && (
                  <SelectItem value={UserRole.MEMBER}>Team Member</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {role === UserRole.MEMBER && (
            <div className="space-y-2">
              <Label htmlFor="supervisor">Assign to Supervisor*</Label>
              <Select 
                value={supervisorId} 
                onValueChange={setSupervisorId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {role === UserRole.SUPERVISOR && (
            <div className="space-y-2">
              <Label htmlFor="manager">Assign to Manager*</Label>
              <Select 
                value={managerId} 
                onValueChange={setManagerId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
