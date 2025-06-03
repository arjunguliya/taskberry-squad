import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { Check, X, Users, UserCheck, AlertCircle } from "lucide-react";
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load available users for supervisor/manager assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        console.log('Loading users for hierarchy assignment...');
        const users = await getActiveUsers();
        setAvailableUsers(users);
        console.log('Loaded users for hierarchy assignment:', users);
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
    setValidationErrors([]);
  }, [selectedRole]);

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedRole) {
      errors.push('Please select a role');
    }

    // Validation based on role hierarchy - FIXED: using 'member' instead of 'team_member'
    if (selectedRole === 'member') {
      if (!selectedSupervisor) {
        errors.push('Members must have a supervisor assigned');
      }
      if (!selectedManager) {
        errors.push('Members must have a manager assigned');
      }
    } else if (selectedRole === 'supervisor') {
      if (!selectedManager) {
        errors.push('Supervisors must have a manager assigned');
      }
    }

    // Check if selected users exist
    if (selectedSupervisor && !availableSupervisors.find(s => (s.id || s._id) === selectedSupervisor)) {
      errors.push('Selected supervisor is not available');
    }

    if (selectedManager && !availableManagers.find(m => (m.id || m._id) === selectedManager)) {
      errors.push('Selected manager is not available');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleApprove = async () => {
    console.log('=== APPROVAL ATTEMPT ===');
    console.log('Pending user:', pendingUser);
    console.log('Selected role:', selectedRole);
    console.log('Selected supervisor:', selectedSupervisor);
    console.log('Selected manager:', selectedManager);

    // Validate form
    if (!validateForm()) {
      console.log('Validation failed:', validationErrors);
      return;
    }

    try {
      setLoading(true);
      
      // Get user ID - handle both id and _id
      const userId = pendingUser.id || pendingUser._id;
      
      if (!userId) {
        console.error('User ID not found in pending user:', pendingUser);
        toast.error('User ID not found');
        return;
      }

      console.log('Calling approveUser with:', {
        userId,
        role: selectedRole,
        supervisorId: selectedSupervisor || undefined,
        managerId: selectedManager || undefined
      });

      // Call the approval API
      const success = await approveUser(
        userId,
        selectedRole, 
        selectedSupervisor || undefined, 
        selectedManager || undefined
      );

      if (success) {
        console.log('User approved successfully');
        toast.success(`User approved as ${selectedRole.replace('_', ' ')}`);
        onApprove();
      } else {
        console.error('Approval failed - API returned false');
        toast.error('Failed to approve user');
      }
    } catch (error) {
      console.error('Error during approval:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm(`Are you sure you want to reject ${pendingUser.name}?`)) return;

    try {
      setLoading(true);
      const userId = pendingUser.id || pendingUser._id;
      
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      const success = await rejectUser(userId, 'Application rejected by admin');
      
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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Approve User: {pendingUser.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a role for this user and assign their reporting structure.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900">Please fix the following errors:</h4>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

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

        {/* Role Selection - FIXED: Using 'member' instead of 'team_member' */}
        <div className="space-y-3">
          <Label htmlFor="role-select" className="text-sm font-medium">
            Assign Role <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
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

            {/* Supervisor Assignment for Members - FIXED: checking for 'member' */}
            {selectedRole === 'member' && (
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
                      availableSupervisors.map((supervisor) => {
                        const supervisorId = supervisor.id || supervisor._id;
                        if (!supervisorId) return null;
                        return (
                          <SelectItem key={supervisorId} value={supervisorId}>
                            {supervisor.name} ({supervisor.email})
                          </SelectItem>
                        );
                      }).filter(Boolean)
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

            {/* Manager Assignment for Members and Supervisors - FIXED: checking for 'member' */}
            {(selectedRole === 'member' || selectedRole === 'supervisor') && (
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
                      availableManagers.map((manager) => {
                        const managerId = manager.id || manager._id;
                        if (!managerId) return null;
                        return (
                          <SelectItem key={managerId} value={managerId}>
                            {manager.name} ({manager.email})
                          </SelectItem>
                        );
                      }).filter(Boolean)
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

            {/* Hierarchy Display - FIXED: using 'member' */}
            {selectedRole && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs font-medium text-blue-900 mb-2">
                  Reporting Structure:
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  {selectedRole === 'member' && (
                    <>
                      <div>👤 {pendingUser.name} (Member)</div>
                      <div className="ml-4">↗️ Reports to: {selectedSupervisor ? availableSupervisors.find(s => (s.id || s._id) === selectedSupervisor)?.name : 'Select Supervisor'}</div>
                      <div className="ml-8">↗️ Reports to: {selectedManager ? availableManagers.find(m => (m.id || m._id) === selectedManager)?.name : 'Select Manager'}</div>
                    </>
                  )}
                  {selectedRole === 'supervisor' && (
                    <>
                      <div>👤 {pendingUser.name} (Supervisor)</div>
                      <div className="ml-4">↗️ Reports to: {selectedManager ? availableManagers.find(m => (m.id || m._id) === selectedManager)?.name : 'Select Manager'}</div>
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
            disabled={loading || !selectedRole || validationErrors.length > 0}
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

        {/* Validation Messages - FIXED: using 'member' */}
        {selectedRole && (
          <div className="text-xs text-muted-foreground">
            {selectedRole === 'member' && 'Members require both supervisor and manager assignments'}
            {selectedRole === 'supervisor' && 'Supervisors require manager assignment'}
            {selectedRole === 'manager' && 'Managers report directly to admin'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
