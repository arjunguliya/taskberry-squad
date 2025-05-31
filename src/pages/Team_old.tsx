
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamMemberForm } from "@/components/team/TeamMemberForm";
import { getInitials } from "@/lib/utils";
import { Plus, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { User, UserRole } from "@/lib/types";
import { getCurrentUser, getAllUsers, getTeamMembers } from "@/lib/dataService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Team() {
  const [isTeamMemberFormOpen, setIsTeamMemberFormOpen] = useState(false);
  const [expandedSupervisors, setExpandedSupervisors] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get current user and all users
  const currentUser = getCurrentUser();
  const allUsers = getAllUsers();
  
  // Filter users by role
  const managers = allUsers.filter(user => user.role === UserRole.MANAGER);
  const supervisors = allUsers.filter(user => user.role === UserRole.SUPERVISOR);
  
  // Get supervisors specific to a manager
  const getManagerSupervisors = (managerId: string) => {
    return supervisors.filter(supervisor => supervisor.managerId === managerId);
  };
  
  // Get team members specific to a supervisor
  const getSupervisorMembers = (supervisorId: string) => {
    return allUsers.filter(member => 
      member.role === UserRole.MEMBER && member.supervisorId === supervisorId
    );
  };
  
  const handleTeamMemberSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleMemberDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const toggleSupervisor = (supervisorId: string) => {
    setExpandedSupervisors(prev => ({
      ...prev,
      [supervisorId]: !prev[supervisorId]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team hierarchy and members
          </p>
        </div>
        <Button onClick={() => setIsTeamMemberFormOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add {currentUser.role === UserRole.MANAGER ? "Supervisor" : "Team Member"}
        </Button>
      </div>

      {/* Manager Section - visible to everyone */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Management</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {managers.map((manager, index) => (
            <Card key={`${manager.id}-${refreshKey}`} className="animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Manager</CardTitle>
                <CardDescription>Team lead and resource allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={manager.avatarUrl} alt={manager.name} />
                    <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{manager.name}</p>
                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                    <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                      {manager.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Supervisor Section with Collapsible Team Members */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Supervisors & Team Members</h2>
        
        {managers.map(manager => {
          const managerSupervisors = getManagerSupervisors(manager.id);
          return (
            <div key={`manager-${manager.id}-${refreshKey}`} className="space-y-4">
              {managerSupervisors.length > 0 && (
                <h3 className="text-md font-medium text-muted-foreground">
                  Reporting to {manager.name}
                </h3>
              )}
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {managerSupervisors.map((supervisor, index) => {
                  const supervisorMembers = getSupervisorMembers(supervisor.id);
                  const isExpanded = !!expandedSupervisors[supervisor.id];
                  
                  return (
                    <Collapsible 
                      key={`${supervisor.id}-${refreshKey}`}
                      open={isExpanded}
                      onOpenChange={() => toggleSupervisor(supervisor.id)}
                      className="border rounded-lg overflow-hidden"
                    >
                      <Card className="border-0 rounded-none">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-md">Supervisor</CardTitle>
                              <CardDescription>Reports to {manager.name}</CardDescription>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">Toggle team members</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={supervisor.avatarUrl} alt={supervisor.name} />
                              <AvatarFallback>{getInitials(supervisor.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{supervisor.name}</p>
                              <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                              <Badge className="mt-2 bg-accent text-accent-foreground hover:bg-accent/80 border-accent/20">
                                {supervisor.role}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {supervisorMembers.length} team member{supervisorMembers.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <CollapsibleContent>
                        <div className="p-4 bg-muted/30">
                          <h4 className="text-sm font-medium mb-3">Team Members</h4>
                          <div className="space-y-3">
                            {supervisorMembers.map(member => (
                              <div 
                                key={`member-${member.id}-${refreshKey}`}
                                className="flex items-center space-x-3 p-2 bg-background rounded border"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                            ))}
                            
                            {supervisorMembers.length === 0 && (
                              <p className="text-sm text-muted-foreground italic">
                                No team members yet
                              </p>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Add New Member Card */}
        <Card 
          className="flex flex-col items-center justify-center border-dashed h-full min-h-[180px] animate-slide-up cursor-pointer hover:bg-accent/5"
          onClick={() => setIsTeamMemberFormOpen(true)}
        >
          <div className="flex flex-col items-center text-center p-6">
            <div className="rounded-full bg-muted flex items-center justify-center h-12 w-12 mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">
              Add {currentUser.role === UserRole.MANAGER ? "Supervisor" : "Team Member"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {currentUser.role === UserRole.MANAGER 
                ? "Add a new supervisor to your team" 
                : "Add a new member to your team"}
            </p>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add {currentUser.role === UserRole.MANAGER ? "Supervisor" : "Member"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Team Member Form Dialog */}
      <TeamMemberForm
        open={isTeamMemberFormOpen}
        onOpenChange={setIsTeamMemberFormOpen}
        onSuccess={handleTeamMemberSuccess}
      />
    </div>
  );
}
