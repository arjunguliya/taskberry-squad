
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  BarChart3, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  LogOut, 
  Settings, 
  Users 
} from "lucide-react";
import { logout, getCurrentUser } from "@/lib/dataService";
import { useIsMobile } from "@/hooks/use-mobile";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isMobile = useIsMobile();
  
  // Auto-expand sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false);
    }
  }, [isMobile]);
  
  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { label: 'Team', icon: Users, href: '/team' },
    { label: 'Reports', icon: BarChart3, href: '/reports' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div 
      className={`${isMobile ? 'relative w-full' : 'fixed left-0 top-0 z-20 h-full border-r'} bg-sidebar transition-all duration-300 ${
        collapsed && !isMobile ? "w-16" : "w-full md:w-64"
      }`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          {/* Header with logo */}
          <div className="flex h-14 items-center px-3 border-b">
            <div className="flex items-center">
              <img 
                src="/Chatzy.png" 
                alt="Chatzy Logo" 
                className="h-8 w-8 mr-2"
                onError={(e) => {
                  console.error("Sidebar logo failed to load", e);
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              {(!collapsed || isMobile) && (
                <h2 className="text-lg font-semibold">Chatzy TaskMaster</h2>
              )}
            </div>
            {!isMobile && (
              <Button 
                variant="ghost"
                size="icon" 
                onClick={() => setCollapsed(!collapsed)}
                className={`absolute right-${collapsed ? "0.5" : "-3"} top-3 rounded-full p-0 h-6 w-6 transition-all`}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* User profile */}
          <div className={`px-3 py-4 ${collapsed && !isMobile ? "items-center justify-center" : ""} flex`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            {(!collapsed || isMobile) && (
              <div className="ml-3">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="mt-2 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  to={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-1
                              ${isActive 
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              }`}
                >
                  <item.icon className={`h-4 w-4 ${collapsed && !isMobile ? "mx-auto" : ""}`} />
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <div className="mb-4 px-3">
          <Button 
            variant="ghost" 
            className={`w-full flex items-center gap-3 ${collapsed && !isMobile ? "justify-center px-0" : ""}`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
