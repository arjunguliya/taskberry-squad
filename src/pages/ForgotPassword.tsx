
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "@/lib/emailService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (!email) {
      toast.error("Please enter your email");
      setLoading(false);
      return;
    }

    try {
      // Call our email service to send the reset instructions
      const success = await sendPasswordResetEmail(email);
      
      if (success) {
        setSubmitted(true);
        toast.success("If an account exists with this email, reset instructions have been sent.");
      } else {
        toast.error("Failed to send reset instructions. Please try again later.");
      }
    } catch (error) {
      console.error("Error in password reset process:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
                console.error("ForgotPassword logo failed to load", e);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Chatzy TaskMaster</h1>
          <p className="text-muted-foreground">
            Reset your password
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto shadow-card animate-slide-up">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Forgot Password</CardTitle>
            <CardDescription>
              {!submitted 
                ? "Enter your email and we'll send you reset instructions" 
                : "Check your email for reset instructions"}
            </CardDescription>
          </CardHeader>
          
          {!submitted ? (
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
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4 text-center">
              <p>
                We've sent password reset instructions to your email if an account exists with that address.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and spam folder.
              </p>
            </CardContent>
          )}
          
          <CardFooter className="flex justify-center pt-2">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
