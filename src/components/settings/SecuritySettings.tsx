import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, Key, Smartphone, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/dataService";

export const SecuritySettings = () => {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const currentUser = getCurrentUser();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate passwords match
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("New passwords don't match");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }

      // API call to backend to change password
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://taskberry-backend.onrender.com';
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      console.log('Password change response:', data); // Add this for debugging

      if (response.ok) {
        toast.success("Password changed successfully");
        setIsChangePasswordOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error("Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSetup = () => {
    // For now, show a toast indicating it's coming soon
    toast.info("Two-factor authentication setup coming soon!");
    
    // TODO: Implement 2FA setup
    // This would typically involve:
    // 1. Generate QR code for authenticator app
    // 2. Verify setup with a code
    // 3. Store 2FA secret in backend
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    toast.success("Logged out successfully");
  };

  return (
    <Card className="animate-slide-up animation-delay-600">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Account Security
          </div>
        </CardTitle>
        <CardDescription>Manage your account security settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Change Password */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-muted-foreground">Change your account password</p>
            </div>
          </div>
          
          <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Change Password</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new password.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleTwoFactorSetup}>
            Setup 2FA
          </Button>
        </div>

        {/* Log Out */}
        <div className="pt-4 border-t">
          <Button 
            variant="destructive" 
            onClick={handleLogOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
