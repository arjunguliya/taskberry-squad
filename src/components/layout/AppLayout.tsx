import { useEffect, useState } from "react";
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
import { getCurrentUser } from "@/lib/dataService";
import { User } from "@/lib/types";

// Temporary debug function - REMOVE AFTER TESTING
const debugCurrentUser = () => {
  console.log('=== DEBUGGING getCurrentUser ===');
  
  try {
    const userData = localStorage.getItem('user');
    console.log('1. Raw localStorage user:', userData);
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('2. Parsed user:', parsedUser);
      console.log('3. User type:', typeof parsedUser);
      console.log('4. User keys:', Object.keys(parsedUser));
      
      // Check each field individually
      console.log('5. Field analysis:');
      console.log('   - id:', parsedUser.id, typeof parsedUser.id);
      console.log('   - name:', parsedUser.name, typeof parsedUser.name);
      console.log('   - email:', parsedUser.email, typeof parsedUser.email);
      console.log('   - role:', parsedUser.role, typeof parsedUser.role);
      
      // Test getCurrentUser function
      console.log('6. Testing getCurrentUser function...');
      const userFromFunction = getCurrentUser();
      console.log('7. getCurrentUser result:', userFromFunction);
      console.log('8. getCurrentUser type:', typeof userFromFunction);
      
      if (userFromFunction) {
        console.log('9. getCurrentUser keys:', Object.keys(userFromFunction));
      } else {
        console.log('9. getCurrentUser returned null/undefined');
      }
    }
  } catch (error) {
    console.error('Debug error:', error);
    console.error('Error stack:', error.stack);
  }
  
  console.log('=== END DEBUG ===');
};

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

  // Get current user data
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('AppLayout: Loading current user...');
        
        // Run debug function
        debugCurrentUser();
        
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('AppLayout: No token found, redirecting to login');
          setLoading(false);
          return;
        }

        console.log('AppLayout: Token found, getting user data');
        
        // BYPASS TEST - Use direct localStorage instead of getCurrentUser
        const rawUserData = localStorage.getItem('user');
        console.log('AppLayout: Raw user data:', rawUserData);
        
        if (rawUserData) {
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
              
              console.log('AppLayout: Created safe user:', safeUser);
              console.log('AppLayout: Safe user name type:', typeof safeUser.name);
              console.log('AppLayout: Safe user role type:', typeof safeUser.role);
              
              setCurrentUser(safeUser);
              console.log('AppLayout: User set in state');
            } else {
              console.error('AppLayout: Invalid user structure:', user);
              setError('Invalid user data structure');
            }
          } catch (parseError) {
            console.error('AppLayout: Parse error:', parseError);
            setError('Failed to parse user data');
          }
        } else {
          console.log('AppLayout: No user data in localStorage');
          setError('No user data found');
        }
        
      } catch (error) {
        console.error('AppLayout: Error loading user:', error);
        setError('Failed to load user data');
        
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Debug logging with more detail
  useEffect(() => {
    console.log('=== AppLayout State Update ===');
    console.log('Current User State:', currentUser);
    console.log('User Role:', currentUser?.role);
    console.log('User Status:', currentUser?.status);
    console.log('User Name:', currentUser?.name);
    console.log('User Name Type:', typeof currentUser?.name);
    console.log('=== End State Update ===');
  }, [currentUser]);

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
