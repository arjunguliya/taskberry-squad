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
  // FIXED: Using 'member' instead of 'team_member'
  const [role, setRole] = useState<string>("member");
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const [reportingTo, setReportingTo] = useState<"manager" | "supervisor">("supervisor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentUser = getCurrentUser();
  const allUsers = getAllUsers();
  const supervisors = allUsers.filter(user => user.role === 'supervisor');
  const managers = allUsers.filter(user => user.role === 'manager');
  
  useEffect(() => {
    if (open) {
      // Reset form when opened
      setName("");
      setEmail("");
      setSupervisorId("");
      setManagerId("");
      setReportingTo("supervisor");
      
      // Default role based on current user's role - FIXED: using correct role names
      if (currentUser.role === 'super_admin') {
        setRole('manager'); // Super admin can create managers by default
      } else if (currentUser.role === 'manager') {
        setRole('supervisor');
        setManagerId(currentUser.id);
      } else if (currentUser.role === 'supervisor') {
        setRole('member');
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
    
    // Validation based on role - FIXED: using 'member' instead of 'team_member'
    if (role === 'supervisor' && !managerId) {
      toast.error("Supervisor must be assigned to a manager");
      return;
    }
    
    if (role === 'member') {
      if (reportingTo === "supervisor" && !supervisorId) {
        toast.error("Member must be assigned to a supervisor");
        return;
      }
      if (reportingTo === "manager" && !managerId) {
        toast.error("Member must be assigned to a manager");
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      addTeamMember({
        name,
        email,
        role,
        supervisorId: role === 'member' && reportingTo === "supervisor" ? supervisorId : undefined,
        managerId: role === 'supervisor' || (role === 'member' && reportingTo === "manager") ? managerId : undefined,
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
      case 'super_admin':
        return "As a super admin, you can add managers, supervisors, or members.";
      case 'manager':
        return "As a manager, you can add supervisors or members.";
      case 'supervisor':
        return "As a supervisor, you can add members.";
      default:
        return "Add a new member to your team.";
    }
  };

  const getAvailableRoles = () => {
    switch (currentUser.role) {
      case 'super_admin':
        return [
          { value: 'manager', label: "Manager" },
          { value: 'supervisor', label: "Supervisor" },
          { value: 'member', label: "Member" }
        ];
      case 'manager':
        return [
          { value: 'supervisor', label: "Supervisor" },
          { value: 'member', label: "Member" }
        ];
      case 'supervisor':
        return [
          { value: 'member', label: "Member" }
        ];
      default:
        return [
          { value: 'member', label: "Member" }
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
              onValueChange={(value) => setRole(value)}
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
          
          {role === 'member' && (currentUser.role === 'manager' || currentUser.role === 'super_admin') && (
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
          
          {role === 'member' && (reportingTo === "supervisor" || currentUser.role === 'supervisor') && (
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
          
          {(role === 'supervisor' || (role === 'member' && reportingTo === "manager")) && (
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
