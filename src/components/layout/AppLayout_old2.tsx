import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'supervisor' | 'member' | 'Super_admin';
  avatarUrl?: string;
  supervisorId?: string;
  managerId?: string;
}

export function AppLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Get current user data
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Try to get user from token first (if stored in localStorage)
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setLoading(false);
          return;
        }

        // Otherwise, fetch from API
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
          // Cache user data
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          // Token might be expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // For development - create a mock super admin user
        const mockUser: User = {
          id: 'mock-admin',
          name: 'System Admin',
          email: 'admin@example.com',
          role: 'super_admin'
        };
        setCurrentUser(mockUser);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  // Debug logging (remove after testing)
  useEffect(() => {
    console.log('AppLayout - Current User:', currentUser);
    console.log('AppLayout - User Role:', currentUser?.role);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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
            <h1 className="text-lg font-semibold">Chatzy TaskMaster</h1>
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
