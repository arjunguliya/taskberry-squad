
import { User, UserRole } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, User as UserIcon } from "lucide-react";

interface TeamMembersListProps {
  members: User[];
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No team members found.</p>
      </div>
    );
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.MANAGER:
        return <Badge variant="default">Manager</Badge>;
      case UserRole.SUPERVISOR:
        return <Badge variant="outline">Supervisor</Badge>;
      case UserRole.MEMBER:
        return <Badge variant="secondary">Member</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-auto max-h-[60vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : (
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>{member.name}</span>
                </div>
              </TableCell>
              <TableCell>{getRoleBadge(member.role)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="text-xs">{member.email}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/team"}
                >
                  <UserIcon className="h-3.5 w-3.5 mr-1" />
                  View Profile
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
