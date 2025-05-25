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
          console.log('No token found');
          setLoading(false);
          return;
        }

        console.log('Token found:', token);

        // Try to get user from localStorage first
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log('User from localStorage:', user);
            setCurrentUser(user);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('user');
          }
        }

        // If no stored user data, try to fetch from API
        console.log('Fetching user from API...');
        
        // Use the same API URL pattern as your login
        const API_BASE_URL = window.location.origin.includes('localhost') 
          ? 'http://localhost:5000/api'
          : 'https://taskmaster.xstreamapps.in/api';

        console.log('API Base URL:', API_BASE_URL);

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('API Response status:', response.status);

        if (response.ok) {
          const user = await response.json();
          console.log('User from API:', user);
          setCurrentUser(user);
          // Cache user data
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          console.log('API request failed, using mock data for development');
          // For development - if API fails, create mock super admin
          const mockUser: User = {
            id: 'mock-admin',
            name: 'System Admin',
            email: 'admin@example.com',
            role: 'super_admin'
          };
          console.log('Using mock user:', mockUser);
          setCurrentUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
      } catch (error) {
        console.error('Error in getCurrentUser:', error);
        
        // Fallback - check if we can extract user info from token
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // For development, create a mock super admin user
            const mockUser: User = {
              id: 'admin-user',
              name: 'System Admin',
              email: 'admin@example.com',
              role: 'super_admin'
            };
            console.log('Using fallback mock user:', mockUser);
            setCurrentUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }
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
