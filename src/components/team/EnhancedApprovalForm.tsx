import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { Check, X, Users, UserCheck } from "lucide-react";
import { approveUser, rejectUser, getActiveUsers } from "@/lib/dataService.ts";

interface EnhancedApprovalFormProps {
  pendingUser: User;
  onApprove: () => void;
  onReject: () => void;
}

export default function EnhancedApprovalForm({ 
  pendingUser, 
  onApprove, 
  onReject 
}: EnhancedApprovalFormProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load available users for supervisor/manager assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await getActiveUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users for assignment');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Get available supervisors (users with supervisor role)
  const availableSupervisors = availableUsers.filter(user => user.role === 'supervisor');
  
  // Get available managers (users with manager role)
  const availableManagers = availableUsers.filter(user => user.role === 'manager');

  // Reset assignments when role changes
  useEffect(() => {
    setSelectedSupervisor("");
    setSelectedManager("");
  }, [selectedRole]);

  const handleApprove = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    // Validation based on role hierarchy
    if (selectedRole === 'team_member') {
      if (!selectedSupervisor || !selectedManager) {
        toast.error('Team members must have both a supervisor and manager assigned');
        return;
      }
    } else if (selectedRole === 'supervisor') {
      if (!selectedManager) {
        toast.error('Supervisors must have a manager assigned');
        return;
      }
    }

    try {
      setLoading(true);
      const success = await approveUser(
        pendingUser.id, 
        selectedRole, 
        selectedSupervisor || undefined, 
        selectedManager || undefined
      );

      if (success) {
        toast.success(`User approved as ${selectedRole.replace('_', ' ')}`);
        onApprove();
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const success = await rejectUser(pendingUser.id, 'Application rejected by admin');
      
      if (success) {
        toast.success('User application rejected');
        onReject();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string): string => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loadingUsers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading user data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Approve User Application
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Applicant</Label>
            <Badge variant="outline">Pending Approval</Badge>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">{pendingUser.name}</div>
            <div className="text-sm text-muted-foreground">{pendingUser.email}</div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <Label htmlFor="role-select" className="text-sm font-medium">
            Assign Role <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team_member">Team Member</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
          {selectedRole && (
            <div className="text-xs text-muted-foreground">
              Selected: <Badge variant="secondary">{formatRole(selectedRole)}</Badge>
            </div>
          )}
        </div>

        {/* Hierarchical Assignments */}
        {selectedRole && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="text-sm font-medium">Hierarchical Assignments</Label>
            </div>

            {/* Supervisor Assignment for Team Members */}
            {selectedRole === 'team_member' && (
              <div className="space-y-2">
                <Label htmlFor="supervisor-select" className="text-sm">
                  Assign Supervisor <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                  <SelectTrigger id="supervisor-select">
                    <SelectValue placeholder="Select a supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSupervisors.length > 0 ? (
                      availableSupervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} ({supervisor.email})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No supervisors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableSupervisors.length === 0 && (
                  <div className="text-xs text-amber-600">
                    ⚠️ No supervisors found. Consider creating supervisor accounts first.
                  </div>
                )}
              </div>
            )}

            {/* Manager Assignment for Team Members and Supervisors */}
            {(selectedRole === 'team_member' || selectedRole === 'supervisor') && (
              <div className="space-y-2">
                <Label htmlFor="manager-select" className="text-sm">
                  Assign Manager <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger id="manager-select">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableManagers.length > 0 ? (
                      availableManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} ({manager.email})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No managers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableManagers.length === 0 && (
                  <div className="text-xs text-amber-600">
                    ⚠️ No managers found. Consider creating manager accounts first.
                  </div>
                )}
              </div>
            )}

            {/* Hierarchy Display */}
            {selectedRole && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs font-medium text-blue-900 mb-2">
                  Reporting Structure:
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  {selectedRole === 'team_member' && (
                    <>
                      <div>👤 {pendingUser.name} (Team Member)</div>
                      <div className="ml-4">↗️ Reports to: {selectedSupervisor ? availableSupervisors.find(s => s.id === selectedSupervisor)?.name : 'Select Supervisor'}</div>
                      <div className="ml-8">↗️ Reports to: {selectedManager ? availableManagers.find(m => m.id === selectedManager)?.name : 'Select Manager'}</div>
                    </>
                  )}
                  {selectedRole === 'supervisor' && (
                    <>
                      <div>👤 {pendingUser.name} (Supervisor)</div>
                      <div className="ml-4">↗️ Reports to: {selectedManager ? availableManagers.find(m => m.id === selectedManager)?.name : 'Select Manager'}</div>
                    </>
                  )}
                  {selectedRole === 'manager' && (
                    <>
                      <div>👤 {pendingUser.name} (Manager)</div>
                      <div className="ml-4">↗️ Reports to: Admin</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleApprove} 
            disabled={loading || !selectedRole}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            {loading ? 'Approving...' : 'Approve User'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {loading ? 'Rejecting...' : 'Reject User'}
          </Button>
        </div>

        {/* Validation Messages */}
        {selectedRole && (
          <div className="text-xs text-muted-foreground">
            {selectedRole === 'team_member' && 'Team members require both supervisor and manager assignments'}
            {selectedRole === 'supervisor' && 'Supervisors require manager assignment'}
            {selectedRole === 'manager' && 'Managers report directly to admin'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
