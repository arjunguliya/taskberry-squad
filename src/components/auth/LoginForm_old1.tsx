import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authenticate, resetDataToDefaults } from "@/lib/dataService";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (!email || !password) {
      toast.error("Please enter both email and password");
      setLoading(false);
      return;
    }

    console.log(`Attempting login with ${email} / ${password}`);

    // Use our authentication service
    setTimeout(() => {
      const user = authenticate(email, password);
      
      if (user) {
        // Generate a proper mock JWT token for development
        const mockPayload = {
          userId: user.id,
          user: {
            id: user.id,
            role: user.role
          }
        };
        
        // Create a simple mock JWT (for development only)
        const mockToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(mockPayload))}.mock-signature`;
        
        // Save token and user data to localStorage
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('Saved to localStorage:', {
          token: mockToken,
          user: user
        });
        
        toast.success(`Welcome back, ${user.name}!`);
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials. Try again.");
      }
      
      setLoading(false);
    }, 1000);
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
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Reset data
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
