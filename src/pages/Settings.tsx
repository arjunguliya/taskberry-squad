
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { EmailSettings } from "@/components/settings/EmailSettings";

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileSettings />
        <div className="space-y-6">
          <NotificationSettings />
          <SecuritySettings />
        </div>
        <EmailSettings />
      </div>
    </div>
  );
}
