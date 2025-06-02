import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { resetDataToDefaults } from "@/lib/dataService.ts";

// Real Authentication Service
class AuthService {
  private static getApiBaseUrl(): string {
    return process.env.REACT_APP_API_URL || 
           process.env.VITE_API_URL || 
           'https://taskberry-backend.onrender.com/api';
  }

  static async login(email: string, password: string) {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during login');
    }
  }

  static storeAuthData(token: string, user: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (!email || !password) {
      toast.error("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      // Use real API authentication
      const response = await AuthService.login(email, password);
      
      // Store authentication data
      AuthService.storeAuthData(response.token, response.user);
      
      toast.success(`Welcome back, ${response.user.name}!`);
      navigate("/dashboard");
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide helpful error messages
      if (error.message.includes('Network')) {
        toast.error("Cannot connect to server. Please check your connection.");
      } else if (error.message.includes('Invalid credentials')) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Clear localStorage when resetting
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    resetDataToDefaults();
    toast.success("Application data has been reset to defaults");
    setEmail("");
    setPassword("");
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
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
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          
          </CardFooter>
      </form>
    </Card>
  );
}
