
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getUserByEmail } from "@/lib/dataService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setTokenValid(false);
      toast.error("Missing reset token");
      return;
    }

    try {
      // In a real app, you would validate this token against a database
      // Here we're just checking if it's a base64 encoded string that starts with "reset-"
      const decodedToken = atob(token);
      if (decodedToken.startsWith("reset-")) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast.error("Invalid reset token");
      }
    } catch (e) {
      console.error("Error validating token:", e);
      setTokenValid(false);
      toast.error("Invalid reset token format");
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // In a real app, we would update the user's password in a database
    setTimeout(() => {
      try {
        // Extract email from token (in a real app, you'd validate this against a database)
        const decodedToken = atob(token!);
        const email = decodedToken.split('-')[1];
        
        // Check if user exists
        const user = getUserByEmail(email);
        if (!user) {
          toast.error("User not found");
          setLoading(false);
          return;
        }
        
        // In a real app, you would update the password in the database
        console.log(`Password reset for ${email} - New password: ${password}`);
        
        toast.success("Password reset successfully!");
        setTimeout(() => navigate("/login"), 1000);
      } catch (error) {
        console.error("Error resetting password:", error);
        toast.error("Failed to reset password. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
          <CardHeader className="space-y-1">
            <div className="flex justify-center text-yellow-500 mb-2">
              <AlertTriangle size={48} />
            </div>
            <CardTitle className="text-2xl font-semibold text-center">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please request a new password reset link.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/forgot-password")}
              className="mr-2"
            >
              Request New Link
            </Button>
            <Button onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/Chatzy.png" 
              alt="Chatzy Logo" 
              className="h-16 w-16"
              onError={(e) => {
                console.error("ResetPassword logo failed to load", e);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Chatzy TaskMaster</h1>
          <p className="text-muted-foreground">
            Set your new password
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || tokenValid !== true}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
