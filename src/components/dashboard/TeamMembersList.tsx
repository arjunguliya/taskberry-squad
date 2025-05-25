
import { User, UserRole } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, ListTodo, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/dataService";
import { deleteUser } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

interface TeamMembersListProps {
  members: User[];
  onMemberDeleted?: () => void;
}

export function TeamMembersList({ members, onMemberDeleted }: TeamMembersListProps) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const handleViewTasks = (memberId: string) => {
    navigate(`/tasks?memberId=${memberId}`);
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(memberId);
    try {
      await deleteUser(memberId);
      toast.success(`${memberName} has been removed from the team`);
      if (onMemberDeleted) {
        onMemberDeleted();
      }
    } catch (error) {
      toast.error("Failed to delete team member");
      console.error("Error deleting team member:", error);
    } finally {
      setDeletingUserId(null);
    }
  };

  const canDeleteMember = (member: User) => {
    // Only super admin can delete members
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      return false;
    }
    // Super admin cannot delete themselves
    return member.id !== currentUser.id;
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
                <div className="flex items-center gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewTasks(member.id)}
                  >
                    <ListTodo className="h-3.5 w-3.5 mr-1" />
                    View Tasks
                  </Button>
                  {canDeleteMember(member) && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      disabled={deletingUserId === member.id}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {deletingUserId === member.id ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
