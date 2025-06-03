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
import { getActiveUsers } from "@/lib/dataService.ts"; // Import the new function

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
        console.log('Team: Loading team data for user:', currentUser?.name);
        
        if (!currentUser?.id) {
          console.error('Team: No current user ID available');
          setError('No user data available');
          setLoading(false);
          return;
        }

        // Use new function to get only active users
        const activeMembers = await getActiveUsers();
        
        // Ensure we always have an array
        const safeMembers = Array.isArray(activeMembers) ? activeMembers : [];
        
        console.log('Team: Loaded active team members:', safeMembers);
        setTeamMembers(safeMembers);
        setError(null);
        
      } catch (error) {
        console.error('Team: Error loading team data:', error);
        setError('Failed to load team data');
        // Set empty array as fallback
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
    
    return role
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
      {/* Header - Removed Add Member button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(member => member.role === 'supervisor').length}
            </div>
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
            <div className="text-2xl font-bold">
              {teamMembers.filter(member => member.role === 'manager').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Team managers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All active team members and their current roles
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
              <h3 className="text-lg font-medium mb-2">No active team members found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first team member.
              </p>
              <p className="text-sm text-muted-foreground">
                Use the "Manage Team Members" section to add and manage team members.
              </p>
            </div>
          )}

          {!error && teamMembers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <Card key={member.id} className="p-4">
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
                      {/* Added onClick handler to View button */}
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
