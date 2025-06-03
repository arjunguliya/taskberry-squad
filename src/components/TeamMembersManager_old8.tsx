import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit3,
  Trash2,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Types
interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  avatarUrl?: string;
  managerId?: any;
  supervisorId?: any;
  manager?: any;
  supervisor?: any;
}

export default function TeamMembersManager() {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dialog states
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    user: User | null;
    selectedRole: string;
    supervisorId: string;
    managerId: string;
  }>({
    open: false,
    user: null,
    selectedRole: '',
    supervisorId: '',
    managerId: ''
  });

  const [viewDetailsDialog, setViewDetailsDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null
  });

  const [editRoleDialog, setEditRoleDialog] = useState<{
    open: boolean;
    user: User | null;
    newRole: string;
    newSupervisorId: string;
    newManagerId: string;
  }>({
    open: false,
    user: null,
    newRole: '',
    newSupervisorId: '',
    newManagerId: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com';

  const toast = {
    success: (message: string) => console.log('Success:', message),
    error: (message: string) => console.error('Error:', message)
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch pending users
      const pendingResponse = await fetch(`${API_BASE_URL}/api/users/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingUsers(pendingData);
      }

      // Fetch active users
      const activeResponse = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        // Map any legacy role names
        const mappedUsers = activeData.map((user: User) => ({
          ...user,
          role: user.role === 'team_member' ? 'member' : user.role
        }));
        setActiveUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'member': 'Member',
      'team_member': 'Member',
      'supervisor': 'Supervisor',
      'manager': 'Manager',
      'super_admin': 'Super Admin'
    };
    
    return roleMap[role] || role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getApproverInfo = (approverId: string): string => {
    if (!approverId) return 'N/A';
    
    try {
      const approver = activeUsers.find(user => (user.id || user._id) === approverId);
      if (approver) {
        return `${approver.name} (${approver.email})`;
      }
      
      // Check if it's the current user
      const currentUserId = currentUser?.id || currentUser?._id;
      if (approverId === currentUserId && currentUser) {
        return `${currentUser.name} (${currentUser.email})`;
      }
      
      return `User ID: ${approverId}`;
    } catch (error) {
      console.error('Error getting approver info:', error);
      return `Approver ID: ${approverId}`;
    }
  };

  const getManagerInfo = (managerData: any): string => {
    if (!managerData) return 'No manager assigned';
    
    if (typeof managerData === 'object' && managerData.name) {
      return `${managerData.name} (${managerData.email})`;
    }
    
    if (typeof managerData === 'string') {
      const manager = activeUsers.find(user => 
        (user.id || user._id) === managerData
      );
      
      if (manager) {
        return `${manager.name} (${manager.email})`;
      }
      
      const currentUserId = currentUser?.id || currentUser?._id;
      if (managerData === currentUserId) {
        return `${currentUser.name} (${currentUser.email})`;
      }
      
      return `Manager ID: ${managerData} (User not in active list)`;
    }
    
    return 'No manager assigned';
  };

  const getSupervisorInfo = (supervisorData: any): string => {
    if (!supervisorData) return 'No supervisor assigned';
    
    if (typeof supervisorData === 'object' && supervisorData.name) {
      return `${supervisorData.name} (${supervisorData.email})`;
    }
    
    if (typeof supervisorData === 'string') {
      const supervisor = activeUsers.find(user => 
        (user.id || user._id) === supervisorData
      );
      
      if (supervisor) {
        return `${supervisor.name} (${supervisor.email})`;
      }
      
      const currentUserId = currentUser?.id || currentUser?._id;
      if (supervisorData === currentUserId) {
        return `${currentUser.name} (${currentUser.email})`;
      }
      
      return `Supervisor ID: ${supervisorData} (User not in active list)`;
    }
    
    return 'No supervisor assigned';
  };

  // Event handlers
  const handleApprove = (user: User) => {
    setApprovalDialog({
      open: true,
      user,
      selectedRole: '',
      supervisorId: '',
      managerId: ''
    });
  };

  const handleEditRole = (user: User) => {
    setEditRoleDialog({
      open: true,
      user,
      newRole: user.role,
      newSupervisorId: '',
      newManagerId: ''
    });
  };

  const handleViewDetails = (user: User) => {
    setViewDetailsDialog({
      open: true,
      user
    });
  };

  const handleReject = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id || user._id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('User rejected successfully');
        loadUsers();
      } else {
        toast.error('Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Failed to reject user');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id || user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        loadUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const approveUser = async () => {
    if (!approvalDialog.user || !approvalDialog.selectedRole) {
      toast.error('Please select a role');
      return;
    }

    if (approvalDialog.selectedRole === 'member') {
      if (!approvalDialog.supervisorId || !approvalDialog.managerId) {
        toast.error('Members must have both a supervisor and manager assigned');
        return;
      }
    }

    if (approvalDialog.selectedRole === 'supervisor') {
      if (!approvalDialog.managerId) {
        toast.error('Supervisors must have a manager assigned');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${approvalDialog.user.id || approvalDialog.user._id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: approvalDialog.selectedRole,
          supervisorId: approvalDialog.selectedRole === 'member' ? approvalDialog.supervisorId : null,
          managerId: (approvalDialog.selectedRole === 'member' || approvalDialog.selectedRole === 'supervisor') ? approvalDialog.managerId : null
        })
      });

      if (response.ok) {
        toast.success('User approved successfully');
        setApprovalDialog({ open: false, user: null, selectedRole: '', supervisorId: '', managerId: '' });
        loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const saveRoleChange = async () => {
    if (!editRoleDialog.user || !editRoleDialog.newRole) {
      toast.error('Please select a valid role');
      return;
    }

    // Always validate hierarchical assignments for member and supervisor roles
    if (editRoleDialog.newRole === 'member') {
      if (!editRoleDialog.newSupervisorId || !editRoleDialog.newManagerId) {
        toast.error('Members must have both a supervisor and manager assigned');
        return;
      }
    }

    if (editRoleDialog.newRole === 'supervisor') {
      if (!editRoleDialog.newManagerId) {
        toast.error('Supervisors must have a manager assigned');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${editRoleDialog.user.id || editRoleDialog.user._id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: editRoleDialog.newRole,
          supervisorId: editRoleDialog.newRole === 'member' ? editRoleDialog.newSupervisorId : null,
          managerId: (editRoleDialog.newRole === 'member' || editRoleDialog.newRole === 'supervisor') ? editRoleDialog.newManagerId : null
        })
      });

      if (response.ok) {
        toast.success('Role and hierarchical assignments updated successfully');
        setEditRoleDialog({ open: false, user: null, newRole: '', newSupervisorId: '', newManagerId: '' });
        loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Team Members Management</h1>
        <p className="text-muted-foreground">Manage your team members and their roles</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">{pendingUsers.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers.filter(u => u.role === 'member').length}</p>
                <p className="text-xs text-muted-foreground">Active team members</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-blue-600">{activeUsers.filter(u => u.role === 'manager').length}</p>
                <p className="text-xs text-muted-foreground">Team managers</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supervisors</p>
                <p className="text-2xl font-bold text-purple-600">{activeUsers.filter(u => u.role === 'supervisor').length}</p>
                <p className="text-xs text-muted-foreground">Team supervisors</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="active">Active Members ({activeUsers.length})</TabsTrigger>
        </TabsList>

        {/* Pending Approval Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending User Approvals ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id || user._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(user)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(user)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Members Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Team Members ({activeUsers.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Currently active team members and their roles
              </p>
            </CardHeader>
            <CardContent>
              {activeUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active team members</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeUsers.map((user) => (
                    <div key={user.id || user._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <Badge variant="secondary" className="text-xs">
                            {formatRole(user.role)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRole(user)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      <Dialog open={approvalDialog.open} onOpenChange={(open) => !open && setApprovalDialog({ open: false, user: null, selectedRole: '', supervisorId: '', managerId: '' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve User: {approvalDialog.user?.name}
            </DialogTitle>
            <DialogDescription>
              Select a role and assign hierarchical structure for this user.
            </DialogDescription>
          </DialogHeader>
          
          {approvalDialog.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={approvalDialog.user.avatarUrl} alt={approvalDialog.user.name} />
                  <AvatarFallback>{getInitials(approvalDialog.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{approvalDialog.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{approvalDialog.user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role-select">Assign Role</Label>
                <Select 
                  value={approvalDialog.selectedRole} 
                  onValueChange={(value) => 
                    setApprovalDialog(prev => ({ 
                      ...prev, 
                      selectedRole: value,
                      supervisorId: '',
                      managerId: ''
                    }))
                  }
                >
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hierarchical Assignments */}
              {approvalDialog.selectedRole && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Label className="text-sm font-medium">Hierarchical Assignments</Label>
                  </div>

                  {/* Supervisor Assignment for Members */}
                  {approvalDialog.selectedRole === 'member' && (
                    <div className="space-y-2">
                      <Label htmlFor="supervisor-select" className="text-sm">
                        Assign Supervisor <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={approvalDialog.supervisorId} 
                        onValueChange={(value) => {
                          if (value && value !== 'no-supervisors') {
                            setApprovalDialog(prev => ({ ...prev, supervisorId: value }))
                          }
                        }}
                      >
                        <SelectTrigger id="supervisor-select">
                          <SelectValue placeholder="Select a supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const supervisors = activeUsers.filter(user => user.role === 'supervisor');
                            if (supervisors.length === 0) {
                              return (
                                <SelectItem value="no-supervisors" disabled>
                                  No supervisors available
                                </SelectItem>
                              );
                            }
                            return supervisors.map((supervisor) => {
                              const supervisorId = supervisor.id || supervisor._id;
                              if (!supervisorId) {
                                console.warn('Supervisor missing ID:', supervisor);
                                return null;
                              }
                              return (
                                <SelectItem key={supervisorId} value={supervisorId}>
                                  {supervisor.name} ({supervisor.email})
                                </SelectItem>
                              );
                            }).filter(Boolean);
                          })()}
                        </SelectContent>
                      </Select>
                      {activeUsers.filter(user => user.role === 'supervisor').length === 0 && (
                        <div className="text-xs text-amber-600">
                          ⚠️ No supervisors found. Consider creating supervisor accounts first.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manager Assignment for Members and Supervisors */}
                  {(approvalDialog.selectedRole === 'member' || approvalDialog.selectedRole === 'supervisor') && (
                    <div className="space-y-2">
                      <Label htmlFor="manager-select" className="text-sm">
                        Assign Manager <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={approvalDialog.managerId} 
                        onValueChange={(value) => {
                          if (value && value !== 'no-managers') {
                            setApprovalDialog(prev => ({ ...prev, managerId: value }))
                          }
                        }}
                      >
                        <SelectTrigger id="manager-select">
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const managers = activeUsers.filter(user => user.role === 'manager');
                            if (managers.length === 0) {
                              return (
                                <SelectItem value="no-managers" disabled>
                                  No managers available
                                </SelectItem>
                              );
                            }
                            return managers.map((manager) => {
                              const managerId = manager.id || manager._id;
                              if (!managerId) {
                                console.warn('Manager missing ID:', manager);
                                return null;
                              }
                              return (
                                <SelectItem key={managerId} value={managerId}>
                                  {manager.name} ({manager.email})
                                </SelectItem>
                              );
                            }).filter(Boolean);
                          })()}
                        </SelectContent>
                      </Select>
                      {activeUsers.filter(user => user.role === 'manager').length === 0 && (
                        <div className="text-xs text-amber-600">
                          ⚠️ No managers found. Consider creating manager accounts first.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApprovalDialog({ open: false, user: null, selectedRole: '', supervisorId: '', managerId: '' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={approveUser}
              disabled={!approvalDialog.selectedRole || 
                (approvalDialog.selectedRole === 'member' && (!approvalDialog.supervisorId || !approvalDialog.managerId)) ||
                (approvalDialog.selectedRole === 'supervisor' && !approvalDialog.managerId)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Approve User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog.open} onOpenChange={(open) => !open && setEditRoleDialog({ open: false, user: null, newRole: '', newSupervisorId: '', newManagerId: '' })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit Role: {editRoleDialog.user?.name}
            </DialogTitle>
            <DialogDescription>
              Change the role for this user. This will affect their permissions in the system.
            </DialogDescription>
          </DialogHeader>
          
          {editRoleDialog.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={editRoleDialog.user.avatarUrl} alt={editRoleDialog.user.name} />
                  <AvatarFallback>{getInitials(editRoleDialog.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{editRoleDialog.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{editRoleDialog.user.email}</p>
                  <Badge variant="outline" className="text-xs">
                    Current: {formatRole(editRoleDialog.user.role)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role-select">New Role</Label>
                <Select 
                  value={editRoleDialog.newRole} 
                  onValueChange={(value) => 
                    setEditRoleDialog(prev => ({ 
                      ...prev, 
                      newRole: value,
                      newSupervisorId: '',
                      newManagerId: ''
                    }))
                  }
                >
                  <SelectTrigger id="edit-role-select">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hierarchical Assignments for Role Change */}
              {editRoleDialog.newRole && (editRoleDialog.newRole !== editRoleDialog.user.role || editRoleDialog.newRole === 'member' || editRoleDialog.newRole === 'supervisor') && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Label className="text-sm font-medium">
                      {editRoleDialog.newRole === editRoleDialog.user.role ? 'Update Hierarchical Assignments' : 'Assign Hierarchical Structure'}
                    </Label>
                  </div>

                  {/* Supervisor Assignment for Members */}
                  {editRoleDialog.newRole === 'member' && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-supervisor-select" className="text-sm">
                        Assign Supervisor <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={editRoleDialog.newSupervisorId} 
                        onValueChange={(value) => {
                          if (value && value !== 'no-supervisors') {
                            setEditRoleDialog(prev => ({ ...prev, newSupervisorId: value }))
                          }
                        }}
                      >
                        <SelectTrigger id="edit-supervisor-select">
                          <SelectValue placeholder="Select a supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const supervisors = activeUsers.filter(user => 
                              user.role === 'supervisor' && 
                              (user.id || user._id) !== (editRoleDialog.user.id || editRoleDialog.user._id)
                            );
                            if (supervisors.length === 0) {
                              return (
                                <SelectItem value="no-supervisors" disabled>
                                  No supervisors available
                                </SelectItem>
                              );
                            }
                            return supervisors.map((supervisor) => {
                              const supervisorId = supervisor.id || supervisor._id;
                              if (!supervisorId) {
                                console.warn('Supervisor missing ID:', supervisor);
                                return null;
                              }
                              return (
                                <SelectItem key={supervisorId} value={supervisorId}>
                                  {supervisor.name} ({supervisor.email})
                                </SelectItem>
                              );
                            }).filter(Boolean);
                          })()}
                        </SelectContent>
                      </Select>
                      {activeUsers.filter(user => 
                        user.role === 'supervisor' && 
                        (user.id || user._id) !== (editRoleDialog.user.id || editRoleDialog.user._id)
                      ).length === 0 && (
                        <div className="text-xs text-amber-600">
                          ⚠️ No supervisors found. Consider creating supervisor accounts first.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manager Assignment for Members and Supervisors */}
                  {(editRoleDialog.newRole === 'member' || editRoleDialog.newRole === 'supervisor') && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-manager-select" className="text-sm">
                        Assign Manager <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={editRoleDialog.newManagerId} 
                        onValueChange={(value) => {
                          if (value && value !== 'no-managers') {
                            setEditRoleDialog(prev => ({ ...prev, newManagerId: value }))
                          }
                        }}
                      >
                        <SelectTrigger id="edit-manager-select">
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const managers = activeUsers.filter(user => 
                              user.role === 'manager' && 
                              (user.id || user._id) !== (editRoleDialog.user.id || editRoleDialog.user._id)
                            );
                            if (managers.length === 0) {
                              return (
                                <SelectItem value="no-managers" disabled>
                                  No managers available
                                </SelectItem>
                              );
                            }
                            return managers.map((manager) => {
                              const managerId = manager.id || manager._id;
                              if (!managerId) {
                                console.warn('Manager missing ID:', manager);
                                return null;
                              }
                              return (
                                <SelectItem key={managerId} value={managerId}>
                                  {manager.name} ({manager.email})
                                </SelectItem>
                              );
                            }).filter(Boolean);
                          })()}
                        </SelectContent>
                      </Select>
                      {activeUsers.filter(user => 
                        user.role === 'manager' && 
                        (user.id || user._id) !== (editRoleDialog.user.id || editRoleDialog.user._id)
                      ).length === 0 && (
                        <div className="text-xs text-amber-600">
                          ⚠️ No managers found. Consider creating manager accounts first.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current Assignments Display */}
                  {(editRoleDialog.user.managerId || editRoleDialog.user.supervisorId) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-xs font-medium text-gray-600">Current Assignments:</Label>
                      <div className="mt-1 space-y-1">
                        {editRoleDialog.user.managerId && (
                          <p className="text-xs text-gray-600">
                            Manager: {getManagerInfo(editRoleDialog.user.managerId)}
                          </p>
                        )}
                        {editRoleDialog.user.supervisorId && (
                          <p className="text-xs text-gray-600">
                            Supervisor: {getSupervisorInfo(editRoleDialog.user.supervisorId)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show message only when role doesn't change AND it's not member/supervisor */}
              {editRoleDialog.newRole === editRoleDialog.user.role && editRoleDialog.newRole && editRoleDialog.newRole === 'manager' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ℹ️ No role change detected. Managers don't require hierarchical assignments.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditRoleDialog({ open: false, user: null, newRole: '', newSupervisorId: '', newManagerId: '' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveRoleChange}
              disabled={!editRoleDialog.newRole || 
                (editRoleDialog.newRole === 'member' && (!editRoleDialog.newSupervisorId || !editRoleDialog.newManagerId)) ||
                (editRoleDialog.newRole === 'supervisor' && !editRoleDialog.newManagerId) ||
                (editRoleDialog.newRole === editRoleDialog.user?.role && editRoleDialog.newRole === 'manager')
              }
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog - Restored from working version */}
      <Dialog open={viewDetailsDialog.open} onOpenChange={(open) => !open && setViewDetailsDialog({ open: false, user: null })}>
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
                  <Label className="text-sm font-medium">User ID</Label>
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
              
              {/* Always show reporting structure section */}
              <div>
                <Label className="text-sm font-medium">Reporting Structure</Label>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Manager: {getManagerInfo(viewDetailsDialog.user.managerId)}
                  </p>
                  
                  {(viewDetailsDialog.user.role === 'member' || viewDetailsDialog.user.role === 'team_member') && (
                    <p className="text-sm text-muted-foreground">
                      Supervisor: {getSupervisorInfo(viewDetailsDialog.user.supervisorId)}
                    </p>
                  )}
                  
                  {(viewDetailsDialog.user.role === 'member' || viewDetailsDialog.user.role === 'team_member') && 
                   !viewDetailsDialog.user.managerId && (
                    <p className="text-sm text-amber-600">
                      ⚠️ No manager assigned. Consider updating this member's assignments.
                    </p>
                  )}
                  
                  {(viewDetailsDialog.user.role === 'member' || viewDetailsDialog.user.role === 'team_member') && 
                   !viewDetailsDialog.user.supervisorId && (
                    <p className="text-sm text-amber-600">
                      ⚠️ No supervisor assigned. Consider updating this member's assignments.
                    </p>
                  )}
                </div>
              </div>
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
    </div>
  );
}
