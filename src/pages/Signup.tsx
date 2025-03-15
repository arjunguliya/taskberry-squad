
import { SignupForm } from "@/components/auth/SignupForm";

export default function Signup() {
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
                console.error("Signup logo failed to load", e);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Chatzy TaskMaster</h1>
          <p className="text-muted-foreground">
            Team management and task tracking made simple
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
