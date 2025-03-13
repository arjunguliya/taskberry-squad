
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { User } from "@/lib/types";

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ users, max = 4, size = "md" }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user) => (
        <Avatar 
          key={user.id} 
          className={`${sizeClasses[size]} border-2 border-background transition-transform hover:-translate-y-1 hover:scale-110`}
        >
          <AvatarImage 
            src={user.avatarUrl} 
            alt={user.name} 
            className="object-cover"
          />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remaining > 0 && (
        <div 
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-muted text-muted-foreground border-2 border-background`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
