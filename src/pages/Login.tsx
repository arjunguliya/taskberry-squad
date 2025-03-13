
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">TaskMaster</h1>
          <p className="text-muted-foreground">
            Team management and task tracking made simple
          </p>
        </div>
        <LoginForm />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Demo credentials (for testing)</p>
          <p className="mt-1">Email: sam@example.com | Password: password</p>
        </div>
      </div>
    </div>
  );
}
