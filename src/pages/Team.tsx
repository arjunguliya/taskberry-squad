
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { Plus, UserPlus } from "lucide-react";
import { UserRole } from "@/lib/types";
import { currentUser, getTeamMembers, users } from "@/lib/data";

export default function Team() {
  // Get team members based on the user's role
  const teamMembers = getTeamMembers(currentUser.id);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Team Lead Card */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Team Lead</CardTitle>
            <CardDescription>Supervisor overseeing this team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {currentUser.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        {teamMembers.map((member, index) => (
          <Card key={member.id} className={`animate-slide-up animation-delay-${(index + 1) * 100}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-md">Team Member</CardTitle>
                  <CardDescription>Reports to {currentUser.name}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Options</span>
                  <span className="h-1 w-1 rounded-full bg-foreground"></span>
                  <span className="h-1 w-1 rounded-full bg-foreground mx-0.5"></span>
                  <span className="h-1 w-1 rounded-full bg-foreground"></span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <Badge className="mt-2 bg-accent text-accent-foreground hover:bg-accent/80 border-accent/20">
                    {member.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Member Card */}
        <Card className="flex flex-col items-center justify-center border-dashed h-full min-h-[180px] animate-slide-up animation-delay-500">
          <div className="flex flex-col items-center text-center p-6">
            <div className="rounded-full bg-muted flex items-center justify-center h-12 w-12 mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Add Team Member</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Invite a new person to your team
            </p>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
