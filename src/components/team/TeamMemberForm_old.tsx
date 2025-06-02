
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserRole } from "@/lib/types";
import { addTeamMember, getCurrentUser, getAllUsers } from "@/lib/dataService.ts";
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
  const [reportingTo, setReportingTo] = useState<"manager" | "supervisor">("supervisor");
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
      setSupervisorId("");
      setManagerId("");
      setReportingTo("supervisor");
      
      // Default role based on current user's role
      if (currentUser.role === UserRole.SUPER_ADMIN) {
        setRole(UserRole.MANAGER); // Super admin can create managers by default
      } else if (currentUser.role === UserRole.MANAGER) {
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
    
    // Validation based on role
    if (role === UserRole.SUPERVISOR && !managerId) {
      toast.error("Supervisor must be assigned to a manager");
      return;
    }
    
    if (role === UserRole.MEMBER) {
      if (reportingTo === "supervisor" && !supervisorId) {
        toast.error("Team member must be assigned to a supervisor");
        return;
      }
      if (reportingTo === "manager" && !managerId) {
        toast.error("Team member must be assigned to a manager");
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      addTeamMember({
        name,
        email,
        role,
        supervisorId: role === UserRole.MEMBER && reportingTo === "supervisor" ? supervisorId : undefined,
        managerId: role === UserRole.SUPERVISOR || (role === UserRole.MEMBER && reportingTo === "manager") ? managerId : undefined,
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

  const getDialogDescription = () => {
    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return "As a super admin, you can add managers, supervisors, or team members.";
      case UserRole.MANAGER:
        return "As a manager, you can add supervisors or team members.";
      case UserRole.SUPERVISOR:
        return "As a supervisor, you can add team members.";
      default:
        return "Add a new member to your team.";
    }
  };

  const getAvailableRoles = () => {
    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return [
          { value: UserRole.MANAGER, label: "Manager" },
          { value: UserRole.SUPERVISOR, label: "Supervisor" },
          { value: UserRole.MEMBER, label: "Team Member" }
        ];
      case UserRole.MANAGER:
        return [
          { value: UserRole.SUPERVISOR, label: "Supervisor" },
          { value: UserRole.MEMBER, label: "Team Member" }
        ];
      case UserRole.SUPERVISOR:
        return [
          { value: UserRole.MEMBER, label: "Team Member" }
        ];
      default:
        return [
          { value: UserRole.MEMBER, label: "Team Member" }
        ];
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
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
                {getAvailableRoles().map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {role === UserRole.MEMBER && (currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.SUPER_ADMIN) && (
            <div className="space-y-2">
              <Label htmlFor="reportingTo">Reports To</Label>
              <Select 
                value={reportingTo} 
                onValueChange={(value) => setReportingTo(value as "manager" | "supervisor")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reporting manager/supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager (Direct Report)</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {role === UserRole.MEMBER && (reportingTo === "supervisor" || currentUser.role === UserRole.SUPERVISOR) && (
            <div className="space-y-2">
              <Label htmlFor="supervisor">Assign to Supervisor*</Label>
              <Select 
                value={supervisorId} 
                onValueChange={setSupervisorId}
                required={reportingTo === "supervisor"}
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
          
          {(role === UserRole.SUPERVISOR || (role === UserRole.MEMBER && reportingTo === "manager")) && (
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
