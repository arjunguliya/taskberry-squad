
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Notification preferences saved");
  };

  return (
    <Card className="animate-slide-up animation-delay-200">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Settings
          </div>
        </CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your tasks
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications directly in the app
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit">Save Preferences</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
