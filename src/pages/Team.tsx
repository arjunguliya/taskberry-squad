import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Mail, Phone, MapPin, Eye } from "lucide-react";
import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { getActiveUsers } from "@/lib/dataService.ts";

// Context type for user data from AppLayout
interface AppLayoutContext {
  currentUser: User;
}

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state for viewing member details
  const [viewDetailsDialog, setViewDetailsDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null
  });
  
  // Get user from AppLayout context
  const { currentUser } = useOutletContext<AppLayoutContext>();

  // Load team data safely
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        console.log('Team: Loading team data for user:', currentUser?.name, 'Role:', currentUser?.role);
        
        if (!currentUser?.id) {
          console.error('Team: No current user ID available');
          setError('No user data available');
          setLoading(false);
          return;
        }

        // Get all active users
        const activeMembers = await getActiveUsers();
        console.log('Team: All active users:', activeMembers);
        
        // Filter team members based on current user's role
        let filteredMembers: User[] = [];
        
        if (currentUser.role === 'super_admin') {
          // Super admin sees all active users
          filteredMembers = activeMembers;
        } else if (currentUser.role === 'manager') {
          // Manager sees users assigned to them (direct reports + supervisors under them)
          filteredMembers = activeMembers.filter(user => {
            const userId = user.id || user._id;
            const currentUserId = currentUser.id || currentUser._id;
            
            // Include users who have this manager as their managerId
            return user.managerId === currentUserId || 
                   (typeof user.managerId === 'object' && user.managerId?.id === currentUserId) ||
                   (typeof user.managerId === 'object' && user.managerId?._id === currentUserId);
          });
        } else if (currentUser.role === 'supervisor') {
          // Supervisor sees members assigned to them
          filteredMembers = activeMembers.filter(user => {
            const currentUserId = currentUser.id || currentUser._id;
            
            // Include users who have this supervisor as their supervisorId
            return user.supervisorId === currentUserId || 
                   (typeof user.supervisorId === 'object' && user.supervisorId?.id === currentUserId) ||
                   (typeof user.supervisorId === 'object' && user.supervisorId?._id === currentUserId);
          });
        } else {
          // Members don't see any team members
          filteredMembers = [];
        }
        
        console.log('Team: Filtered members for', currentUser.role, ':', filteredMembers);
        setTeamMembers(filteredMembers);
        setError(null);
        
      } catch (error) {
        console.error('Team: Error loading team data:', error);
        setError('Failed to load team data');
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadTeamData();
    }
  }, [currentUser]);

  // Helper function to format role
  const formatRole = (role: string): string => {
    if (!role) return 'Member';
    
    // Handle specific role mappings
    const roleMap: { [key: string]: string } = {
      'member': 'Member',
      'team_member': 'Member',
      'supervisor': 'Supervisor', 
      'manager': 'Manager',
      'super_admin': 'Super Admin'
    };
    
    // Return mapped role or format the role string
    return roleMap[role] || role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to get initials
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Helper function to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper functions for hierarchical info
  const getManagerInfo = (managerData: any): string => {
    if (!managerData) return 'No manager assigned';
    
    if (typeof managerData === 'object' && managerData.name) {
      return `${managerData.name} (${managerData.email})`;
    }
    
    if (typeof managerData === 'string') {
      const manager = teamMembers.find(member => 
        (member.id || member._id) === managerData
      );
      
      if (manager) {
        return `${manager.name} (${manager.email})`;
      }
      
      return `Manager ID: ${managerData}`;
    }
    
    return 'No manager assigned';
  };

  const getSupervisorInfo = (supervisorData: any): string => {
    if (!supervisorData) return 'No supervisor assigned';
    
    if (typeof supervisorData === 'object' && supervisorData.name) {
      return `${supervisorData.name} (${supervisorData.email})`;
    }
    
    if (typeof supervisorData === 'string') {
      const supervisor = teamMembers.find(member => 
        (member.id || member._id) === supervisorData
      );
      
      if (supervisor) {
        return `${supervisor.name} (${supervisor.email})`;
      }
      
      return `Supervisor ID: ${supervisorData}`;
    }
    
    return 'No supervisor assigned';
  };

  // Handle view details
  const handleViewDetails = (member: User) => {
    setViewDetailsDialog({
      open: true,
      user: member
    });
  };

  // Calculate team statistics based on user role
  const getTeamStats = () => {
    const members = teamMembers.filter(user => user.role === 'member' || user.role === 'team_member');
    const supervisors = teamMembers.filter(user => user.role === 'supervisor');
    const managers = teamMembers.filter(user => user.role === 'manager');
    const totalMembers = members.length + supervisors.length + managers.length;

    return {
      totalMembers,
      members: members.length,
      supervisors: supervisors.length,
      managers: managers.length
    };
  };

  const stats = getTeamStats();

  // Render team stats cards based on user role
  const renderTeamStats = () => {
    if (currentUser.role === 'super_admin') {
      // Admin sees 4 cards: Total, Members, Supervisors, Managers
      return (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                All team members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.members}</div>
              <p className="text-xs text-muted-foreground">
                Team members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.supervisors}</div>
              <p className="text-xs text-muted-foreground">
                Team supervisors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.managers}</div>
              <p className="text-xs text-muted-foreground">
                Team managers
              </p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentUser.role === 'manager') {
      // Manager sees 3 cards: Total, Members, Supervisors
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.members + stats.supervisors}</div>
              <p className="text-xs text-muted-foreground">
                Members + supervisors under you
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.members}</div>
              <p className="text-xs text-muted-foreground">
                Direct team members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.supervisors}</div>
              <p className="text-xs text-muted-foreground">
                Supervisors under you
              </p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentUser.role === 'supervisor') {
      // Supervisor sees 1 card: Total team members
      return (
        <div className="grid gap-4 md:grid-cols-1 max-w-md">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.members}</div>
              <p className="text-xs text-muted-foreground">
                Members under your supervision
              </p>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Members see no cards
      return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load user data</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
      </div>

      {/* Team Stats - Role-based cards */}
      {renderTeamStats()}

      {/* Team Members List - Only show if user has team members to view */}
      {(currentUser.role === 'super_admin' || currentUser.role === 'manager' || currentUser.role === 'supervisor') && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {currentUser.role === 'super_admin' && 'All active team members and their current roles'}
              {currentUser.role === 'manager' && 'Team members and supervisors under your management'}
              {currentUser.role === 'supervisor' && 'Team members under your supervision'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            )}
            
            {!error && teamMembers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No team members found</h3>
                <p className="text-muted-foreground mb-4">
                  {currentUser.role === 'super_admin' && 'No active team members in the system.'}
                  {currentUser.role === 'manager' && 'No team members assigned to you yet.'}
                  {currentUser.role === 'supervisor' && 'No team members assigned to your supervision yet.'}
                </p>
                {currentUser.role === 'super_admin' && (
                  <p className="text-sm text-muted-foreground">
                    Use the "Manage Team Members" section to add and approve team members.
                  </p>
                )}
              </div>
            )}

            {!error && teamMembers.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member) => (
                  <Card key={member.id || member._id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{member.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {formatRole(member.role)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(member)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Message for members who can't see team data */}
      {currentUser.role === 'member' && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Team Overview</h3>
            <p className="text-muted-foreground">
              As a team member, you focus on your assigned tasks. 
              Team management features are available to supervisors and managers.
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog.open} onOpenChange={(open) => !open && setViewDetailsDialog({ open: false, user: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Team Member Details: {viewDetailsDialog.user?.name}
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
              </div>
              
              {/* Reporting Structure */}
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
                      ⚠️ No manager assigned.
                    </p>
                  )}
                  
                  {(viewDetailsDialog.user.role === 'member' || viewDetailsDialog.user.role === 'team_member') && 
                   !viewDetailsDialog.user.supervisorId && (
                    <p className="text-sm text-amber-600">
                      ⚠️ No supervisor assigned.
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
