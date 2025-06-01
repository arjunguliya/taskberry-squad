import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Shield, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Edit,
  Eye,
  Trash2,
  Settings
} from "lucide-react";
import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getPendingUsers, approveUser, rejectUser, getAllUsers } from "@/lib/dataService";

// Context type for user data from AppLayout
interface AppLayoutContext {
  currentUser: User;
}

interface PendingUser extends User {
  createdAt?: string;
}

export default function TeamMembersManager() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    user: PendingUser | null;
    selectedRole: string;
    supervisorId?: string;
    managerId?: string;
  }>({
    open: false,
    user: null,
    selectedRole: ''
  });

  // Rejection dialog state
  const [rejectionDialog, setRejectionDialog] = useState<{
    open: boolean;
    user: PendingUser | null;
    reason: string;
  }>({
    open: false,
    user: null,
    reason: ''
  });

  // Edit role dialog state
  const [editRoleDialog, setEditRoleDialog] = useState<{
    open: boolean;
    user: User | null;
    selectedRole: string;
  }>({
    open: false,
    user: null,
    selectedRole: ''
  });

  // View details dialog state
  const [viewDetailsDialog, setViewDetailsDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null
  });

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null
  });
  
  // Get user from AppLayout context
  const { currentUser } = useOutletContext<AppLayoutContext>();

  // Load users data
  useEffect(() => {
    loadUsersData();
  }, []);

  const loadUsersData = async () => {
    try {
      setLoading(true);
      console.log('Loading pending and active users...');
      
      // Load pending users
      const pending = await getPendingUsers();
      console.log('Pending users:', pending);
      setPendingUsers(Array.isArray(pending) ? pending : []);
      
      // Load all active users
      const all = await getAllUsers();
      const active = Array.isArray(all) ? all.filter(user => user.status === 'active') : [];
      console.log('Active users:', active);
      setActiveUsers(active);
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setPendingUsers([]);
      setActiveUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (user: PendingUser) => {
    setApprovalDialog({
      open: true,
      user,
      selectedRole: 'member', // Default role
      supervisorId: '',
      managerId: ''
    });
  };

  const handleRejectClick = (user: PendingUser) => {
    setRejectionDialog({
      open: true,
      user,
      reason: ''
    });
  };

  const handleEditRoleClick = (user: User) => {
    setEditRoleDialog({
      open: true,
      user,
      selectedRole: user.role
    });
  };

  const handleViewDetailsClick = (user: User) => {
    setViewDetailsDialog({
      open: true,
      user
    });
  };

  const handleDeleteClick = (user: User) => {
    setDeleteDialog({
      open: true,
      user
    });
  };

  const handleApproveUser = async () => {
    if (!approvalDialog.user || !approvalDialog.selectedRole) {
      toast.error('Please select a role for the user');
      return;
    }

    try {
      // Use _id if id is not available (MongoDB default)
      const userId = approvalDialog.user.id || approvalDialog.user._id;
      
      if (!userId) {
        console.error('No user ID found:', approvalDialog.user);
        toast.error('User ID not found');
        return;
      }

      setActionLoading(`approve-${userId}`);
      console.log('Approving user:', {
        userId: userId,
        role: approvalDialog.selectedRole,
        supervisorId: approvalDialog.supervisorId,
        managerId: approvalDialog.managerId,
        fullUser: approvalDialog.user
      });
      
      const success = await approveUser(
        userId,
        approvalDialog.selectedRole,
        approvalDialog.supervisorId,
        approvalDialog.managerId
      );

      if (success) {
        toast.success(`User ${approvalDialog.user.name} approved successfully`);
        setApprovalDialog({ open: false, user: null, selectedRole: '' });
        loadUsersData(); // Refresh the lists
      } else {
        console.error('Approval failed - success was false');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(`Failed to approve user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async () => {
    if (!rejectionDialog.user) return;

    try {
      // Use _id if id is not available (MongoDB default)
      const userId = rejectionDialog.user.id || rejectionDialog.user._id;
      
      if (!userId) {
        console.error('No user ID found:', rejectionDialog.user);
        toast.error('User ID not found');
        return;
      }

      setActionLoading(`reject-${userId}`);
      
      const success = await rejectUser(userId, rejectionDialog.reason);

      if (success) {
        toast.success(`User ${rejectionDialog.user.name} rejected and removed`);
        setRejectionDialog({ open: false, user: null, reason: '' });
        loadUsersData(); // Refresh the lists
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditRole = async () => {
    if (!editRoleDialog.user || !editRoleDialog.selectedRole) {
      toast.error('Please select a role');
      return;
    }

    try {
      const userId = editRoleDialog.user.id || editRoleDialog.user._id;
      
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      setActionLoading(`edit-role-${userId}`);

      // Call API to update user role
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com'}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: editRoleDialog.selectedRole })
      });

      if (response.ok) {
        toast.success(`Role updated successfully`);
        setEditRoleDialog({ open: false, user: null, selectedRole: '' });
        loadUsersData(); // Refresh the lists
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      const userId = deleteDialog.user.id || deleteDialog.user._id;
      
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      setActionLoading(`delete-${userId}`);

      // Call API to delete user
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com'}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success(`User ${deleteDialog.user.name} deleted successfully`);
        setDeleteDialog({ open: false, user: null });
        loadUsersData(); // Refresh the lists
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const formatRole = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Helper functions for resolving user information
  const getApproverInfo = (approvedById: string): string => {
    // First check if it's the current user
    const currentUserId = currentUser.id || currentUser._id;
    if (approvedById === currentUserId) {
      return `${currentUser.name} (${currentUser.email})`;
    }
    
    // Look for the approver in the active users list
    const approver = activeUsers.find(user => 
      (user.id || user._id) === approvedById
    );
    
    if (approver) {
      return `${approver.name} (${approver.email})`;
    }
    
    // If not found, it might be a super admin not in the active list
    // Return a generic message
    return 'Super Administrator';
  };

  const getManagerInfo = (managerId: string): string => {
    const manager = activeUsers.find(user => 
      (user.id || user._id) === managerId
    );
    
    if (manager) {
      return `${manager.name} (${manager.email})`;
    }
    
    return 'Manager not found';
  };

  const getSupervisorInfo = (supervisorId: string): string => {
    const supervisor = activeUsers.find(user => 
      (user.id || user._id) === supervisorId
    );
    
    if (supervisor) {
      return `${supervisor.name} (${supervisor.email})`;
    }
    
    return 'Supervisor not found';
  };

  // Check if user is super admin
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only Super Administrators can manage team members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeUsers.filter(user => user.role === 'manager').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Team managers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {activeUsers.filter(user => user.role === 'supervisor').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Team supervisors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Pending and Active Users */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Members ({activeUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Users Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Approval ({pendingUsers.length})
              </CardTitle>
              <CardDescription>
                New users waiting for approval to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending approvals</h3>
                  <p className="text-muted-foreground">
                    All users have been processed. New registrations will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => {
                    const userId = user.id || user._id;
                    return (
                      <div key={userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{user.name}</h4>
                              <Badge variant="outline" className="text-amber-600 border-amber-200">
                                Pending
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Registered: {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveClick(user)}
                            disabled={actionLoading === `approve-${userId}`}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            {actionLoading === `approve-${userId}` ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(user)}
                            disabled={actionLoading === `reject-${userId}`}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            {actionLoading === `reject-${userId}` ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Users Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Active Team Members ({activeUsers.length})
              </CardTitle>
              <CardDescription>
                Currently active team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active members</h3>
                  <p className="text-muted-foreground">
                    Approved users will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeUsers.map((user) => {
                    const userId = user.id || user._id;
                    const isCurrentUser = userId === (currentUser.id || currentUser._id);
                    
                    return (
                      <div key={userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{user.name}</h4>
                              <Badge variant="secondary">
                                {formatRole(user.role)}
                              </Badge>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-blue-600">You</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isCurrentUser && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditRoleClick(user)}
                                disabled={actionLoading === `edit-role-${userId}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {actionLoading === `edit-role-${userId}` ? 'Updating...' : 'Edit Role'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewDetailsClick(user)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteClick(user)}
                                disabled={actionLoading === `delete-${userId}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {actionLoading === `delete-${userId}` ? 'Deleting...' : 'Delete'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => 
        setApprovalDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              Approve User: {approvalDialog.user?.name}
            </DialogTitle>
            <DialogDescription>
              Select a role for this user and approve their access to the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select 
                value={approvalDialog.selectedRole} 
                onValueChange={(value) => 
                  setApprovalDialog(prev => ({ ...prev, selectedRole: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApprovalDialog({ open: false, user: null, selectedRole: '' })}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApproveUser}
              disabled={!approvalDialog.selectedRole || actionLoading !== null}
            >
              {actionLoading ? 'Approving...' : 'Approve User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog.open} onOpenChange={(open) => 
        setRejectionDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject User: {rejectionDialog.user?.name}
            </DialogTitle>
            <DialogDescription>
              This user will be permanently removed from the system. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The user will be completely removed from the database and will need to register again.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectionDialog({ open: false, user: null, reason: '' })}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectUser}
              disabled={actionLoading !== null}
            >
              {actionLoading ? 'Rejecting...' : 'Reject & Remove User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog.open} onOpenChange={(open) => 
        setEditRoleDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Edit Role: {editRoleDialog.user?.name}
            </DialogTitle>
            <DialogDescription>
              Change the role for this user. This will affect their permissions in the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Role: {editRoleDialog.user ? formatRole(editRoleDialog.user.role) : ''}</label>
            </div>
            <div>
              <label className="text-sm font-medium">New Role</label>
              <Select 
                value={editRoleDialog.selectedRole} 
                onValueChange={(value) => 
                  setEditRoleDialog(prev => ({ ...prev, selectedRole: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditRoleDialog({ open: false, user: null, selectedRole: '' })}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditRole}
              disabled={!editRoleDialog.selectedRole || editRoleDialog.selectedRole === editRoleDialog.user?.role || actionLoading !== null}
            >
              {actionLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog.open} onOpenChange={(open) => 
        setViewDetailsDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              User Details: {viewDetailsDialog.user?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewDetailsDialog.user && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewDetailsDialog.user.avatarUrl} alt={viewDetailsDialog.user.name} />
                  <AvatarFallback className="text-lg">{getInitials(viewDetailsDialog.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{viewDetailsDialog.user.name}</h3>
                  <p className="text-muted-foreground">{viewDetailsDialog.user.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {formatRole(viewDetailsDialog.user.role)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm text-muted-foreground">{viewDetailsDialog.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground capitalize">{viewDetailsDialog.user.status || 'active'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(viewDetailsDialog.user.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(viewDetailsDialog.user.updatedAt)}</p>
                </div>
                {viewDetailsDialog.user.approvedBy && (
                  <div>
                    <Label className="text-sm font-medium">Approved By</Label>
                    <p className="text-sm text-muted-foreground">
                      {getApproverInfo(viewDetailsDialog.user.approvedBy)}
                    </p>
                  </div>
                )}
                {viewDetailsDialog.user.approvedAt && (
                  <div>
                    <Label className="text-sm font-medium">Approved On</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(viewDetailsDialog.user.approvedAt)}</p>
                  </div>
                )}
              </div>
              
              {(viewDetailsDialog.user.supervisorId || viewDetailsDialog.user.managerId) && (
                <div>
                  <Label className="text-sm font-medium">Reporting Structure</Label>
                  <div className="mt-2 space-y-2">
                    {viewDetailsDialog.user.managerId && (
                      <p className="text-sm text-muted-foreground">Manager: {getManagerInfo(viewDetailsDialog.user.managerId)}</p>
                    )}
                    {viewDetailsDialog.user.supervisorId && (
                      <p className="text-sm text-muted-foreground">Supervisor: {getSupervisorInfo(viewDetailsDialog.user.supervisorId)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setViewDetailsDialog({ open: false, user: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete User: {deleteDialog.user?.name}
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting this user will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove all their tasks and assignments</li>
                <li>Remove them from any teams they manage or supervise</li>
                <li>Delete their account permanently</li>
              </ul>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, user: null })}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading !== null}
            >
              {actionLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
