import { useEffect, useState, useCallback } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { User } from "@/lib/types";

export function AppLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Stable user loading function
  const loadCurrentUser = useCallback(() => {
    try {
      console.log('AppLayout: Loading current user...');
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('AppLayout: No token found');
        setError('No authentication token');
        setLoading(false);
        return;
      }

      // Get user data directly from localStorage
      const rawUserData = localStorage.getItem('user');
      console.log('AppLayout: Raw user data:', rawUserData);
      
      if (!rawUserData) {
        console.log('AppLayout: No user data in localStorage');
        setError('No user data found');
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(rawUserData);
        console.log('AppLayout: Parsed user:', user);
        
        // Validate user structure
        if (user && user.id && user.name && user.email && user.role) {
          // Create a completely safe user object
          const safeUser: User = {
            id: String(user.id),
            name: String(user.name),
            email: String(user.email),
            role: String(user.role),
            avatarUrl: user.avatarUrl ? String(user.avatarUrl) : '',
            supervisorId: user.supervisorId ? String(user.supervisorId) : undefined,
            managerId: user.managerId ? String(user.managerId) : undefined,
            status: user.status ? String(user.status) : 'active'
          };
          
          console.log('AppLayout: Setting safe user:', safeUser);
          
          // Use functional update to ensure the state is set properly
          setCurrentUser(prevUser => {
            console.log('AppLayout: State update - previous user:', prevUser);
            console.log('AppLayout: State update - new user:', safeUser);
            return safeUser;
          });
          
          setError(null);
        } else {
          console.error('AppLayout: Invalid user structure:', user);
          setError('Invalid user data structure');
        }
      } catch (parseError) {
        console.error('AppLayout: Parse error:', parseError);
        setError('Failed to parse user data');
      }
      
    } catch (error) {
      console.error('AppLayout: Error loading user:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Debug logging with more detail
  useEffect(() => {
    console.log('=== AppLayout State Update ===');
    console.log('Current User State:', currentUser);
    console.log('User Role:', currentUser?.role);
    console.log('User Status:', currentUser?.status);
    console.log('User Name:', currentUser?.name);
    console.log('User Name Type:', typeof currentUser?.name);
    console.log('Loading:', loading);
    console.log('Error:', error);
    console.log('=== End State Update ===');
  }, [currentUser, loading, error]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state or no token - redirect to login
  if (error || !localStorage.getItem('token')) {
    console.log('AppLayout: Redirecting to login due to error or missing token');
    return <Navigate to="/login" replace />;
  }

  // No user data - redirect to login
  if (!currentUser) {
    console.log('AppLayout: No current user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user needs approval
  if (currentUser.status === 'pending_approval') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Account Pending Approval</h2>
          <p className="text-muted-foreground mb-4">
            Your account is pending approval by an administrator. 
            You will receive an email once your account is approved.
          </p>
          <Button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            variant="outline"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile ? (
        <Sidebar currentUser={currentUser} />
      ) : (
        <div className="fixed top-0 left-0 z-30 w-full bg-background/80 backdrop-blur-sm border-b p-3 flex items-center">
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh]">
              <div className="px-4 py-2">
                <Sidebar currentUser={currentUser} />
              </div>
            </DrawerContent>
          </Drawer>
          <div className="flex items-center">
            <img 
              src="/Chatzy.png" 
              alt="Chatzy Logo" 
              className="h-8 w-8 mr-2"
              onError={(e) => {
                console.error("AppLayout logo failed to load", e);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <h1 className="text-lg font-semibold">TaskMaster</h1>
          </div>
        </div>
      )}
      <main className={`flex-1 ${isMobile ? 'pt-16' : ''}`}>
        <div className="h-full px-6 py-6">
          <Outlet context={{ currentUser }} />
        </div>
      </main>
    </div>
  );
}
