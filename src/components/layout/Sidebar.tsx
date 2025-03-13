
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { currentUser } from "@/lib/data";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { label: 'Team', icon: Users, href: '/team' },
    { label: 'Reports', icon: BarChart3, href: '/reports' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div 
      className={`fixed left-0 top-0 z-20 h-full border-r bg-sidebar transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          {/* Header with logo */}
          <div className="flex h-14 items-center px-3 border-b">
            {!collapsed && (
              <h2 className="text-lg font-semibold">TaskMaster</h2>
            )}
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
          </div>

          {/* User profile */}
          <div className={`px-3 py-4 ${collapsed ? "items-center justify-center" : ""} flex`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
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
                  <item.icon className={`h-4 w-4 ${collapsed ? "mx-auto" : ""}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <div className="mb-4 px-3">
          <Button 
            variant="ghost" 
            className={`w-full flex items-center gap-3 ${collapsed ? "justify-center px-0" : ""}`}
            onClick={() => {/* Handle logout */}}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
