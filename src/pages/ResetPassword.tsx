import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Real Authentication Service for Password Reset
class AuthService {
  private static getApiBaseUrl(): string {
    return process.env.REACT_APP_API_URL || 
           process.env.VITE_API_URL || 
           'https://taskberry-backend.onrender.com/api';
  }

  static async resetPassword(token: string, newPassword: string) {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during password reset');
    }
  }

  static async validateResetToken(token: string) {
    try {
      // For now, we'll validate on the frontend
      // In a more secure implementation, you'd validate this with the backend
      if (!token || token.length < 10) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setTokenValid(false);
      toast.error("Missing reset token");
      return;
    }

    const validateToken = async () => {
      try {
        const isValid = await AuthService.validateResetToken(token);
        setTokenValid(isValid);
        
        if (!isValid) {
          toast.error("Invalid or expired reset token");
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
        toast.error("Invalid reset token");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
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

    try {
      // Call the real backend API
      await AuthService.resetPassword(token!, password);
      
      toast.success("Password reset successfully!");
      setResetComplete(true);
      
      // Redirect to login after showing success
      setTimeout(() => navigate("/login"), 3000);
      
    } catch (error: any) {
      console.error("Error resetting password:", error);
      
      if (error.message.includes('Invalid or expired token')) {
        toast.error("Reset link has expired. Please request a new one.");
        setTokenValid(false);
      } else if (error.message.includes('Network')) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error(error.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (resetComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold">Password Reset Complete</CardTitle>
            <CardDescription>
              Your password has been successfully updated
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You can now sign in with your new password.
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting to login page in a few seconds...
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/login")} className="w-full">
              Continue to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Invalid token screen
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
            <p className="text-sm text-muted-foreground">
              Reset links expire after 1 hour for security reasons.
              Please request a new password reset link.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full"
            >
              Request New Reset Link
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main reset password form
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
                    placeholder="Enter new password"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
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
                    placeholder="Confirm new password"
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
                  Back to Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
