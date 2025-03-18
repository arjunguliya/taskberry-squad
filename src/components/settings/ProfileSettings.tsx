
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/dataService";
import { getInitials } from "@/lib/utils";

export const ProfileSettings = () => {
  const currentUser = getCurrentUser();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile settings saved");
  };

  return (
    <Card className="animate-slide-up animation-delay-100">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <UserCog className="mr-2 h-5 w-5" />
            Profile Settings
          </div>
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              {currentUser.avatarUrl ? (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              ) : (
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  <span>{getInitials(currentUser.name)}</span>
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={currentUser.name} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={currentUser.email} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue={currentUser.role} disabled />
          </div>
          
          <div className="pt-2">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
