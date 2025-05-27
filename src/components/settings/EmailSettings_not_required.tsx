
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { configureEmailService } from "@/lib/emailService";
import { UserRole } from "@/lib/types";
import { getCurrentUser } from "@/lib/dataService";

export const EmailSettings = () => {
  const currentUser = getCurrentUser();

  if (currentUser.role !== UserRole.SUPER_ADMIN) {
    return null;
  }

  const handleEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    configureEmailService({
      service: formData.get('service') as 'sendgrid' | 'mailgun' | 'smtp' | 'mock',
      apiKey: formData.get('apiKey') as string,
      from: formData.get('from') as string
    });
    toast.success("Email settings saved");
  };

  return (
    <Card className="animate-slide-up animation-delay-400">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Email Configuration
          </div>
        </CardTitle>
        <CardDescription>Configure email service settings for notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailConfig} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Email Service</Label>
            <Select name="service" defaultValue="mock">
              <SelectTrigger>
                <SelectValue placeholder="Select email service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="mock">Mock (Development)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select your preferred email service provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" name="apiKey" type="password" placeholder="Enter your API key" />
            <p className="text-sm text-muted-foreground">
              Your email service API key or SMTP password
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from">From Email</Label>
            <Input 
              id="from" 
              name="from" 
              type="email" 
              placeholder="noreply@yourdomain.com" 
              defaultValue="noreply@chatzy-taskmaster.com"
            />
            <p className="text-sm text-muted-foreground">
              The email address that will appear as the sender
            </p>
          </div>

          <div className="pt-2">
            <Button type="submit">Save Email Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
