import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Authentication Service for Password Reset
class AuthService {
  private static getApiBaseUrl(): string {
    return process.env.REACT_APP_API_URL || 
           process.env.VITE_API_URL || 
           'https://taskberry-backend.onrender.com/api';
  }

  static async forgotPassword(email: string) {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset request failed');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during password reset request');
    }
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (!email) {
      toast.error("Please enter your email address");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      await AuthService.forgotPassword(email);
      
      // Show success state
      setEmailSent(true);
      toast.success("Password reset instructions sent!");
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Provide helpful error messages
      if (error.message.includes('User not found')) {
        toast.error("No account found with this email address");
      } else if (error.message.includes('Network')) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else {
        toast.error(error.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
          <CardDescription>
            We've sent password reset instructions to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. 
              If you don't see it, check your spam folder.
            </p>
            <p className="text-xs text-muted-foreground">
              The link will expire in 1 hour for security.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            onClick={() => {
              setEmailSent(false);
              setEmail("");
            }}
            className="text-sm"
          >
            Try a different email address
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Reset your password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
