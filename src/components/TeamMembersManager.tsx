import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Calendar
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

  const handleApproveUser = async () => {
    if (!approvalDialog.user || !approvalDialog.selectedRole) {
      toast.error('Please select a role for the user');
      return;
    }

    try {
      setActionLoading(`approve-${approvalDialog.user.id}`);
      
      const success = await approveUser(
        approvalDialog.user.id,
        approvalDialog.selectedRole,
        approvalDialog.supervisorId,
        approvalDialog.managerId
      );

      if (success) {
        toast.success(`User ${approvalDialog.user.name} approved successfully`);
        setApprovalDialog({ open: false, user: null, selectedRole: '' });
        loadUsersData(); // Refresh the lists
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async () => {
    if (!rejectionDialog.user) return;

    try {
      setActionLoading(`reject-${rejectionDialog.user.id}`);
      
      const success = await rejectUser(
        rejectionDialog.user.id,
        rejectionDialog.reason
      );

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
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                          disabled={actionLoading === `approve-${user.id}`}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          {actionLoading === `approve-${user.id}` ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(user)}
                          disabled={actionLoading === `reject-${user.id}`}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          {actionLoading === `reject-${user.id}` ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  ))}
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
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                            {user.id === currentUser.id && (
                              <Badge variant="outline" className="text-blue-600">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.id !== currentUser.id && (
                          <>
                            <Button size="sm" variant="outline">
                              Edit Role
                            </Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
