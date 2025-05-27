
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const SecuritySettings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.info("Logged out successfully");
    navigate("/login");
  };

  return (
    <Card className="animate-slide-up animation-delay-300">
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
        <Button variant="outline" className="w-full">
          Change Password
        </Button>
        
        <Button variant="outline" className="w-full">
          Two-Factor Authentication
        </Button>
        
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </CardContent>
    </Card>
  );
};
