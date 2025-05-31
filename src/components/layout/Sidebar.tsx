import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types'; // Use the centralized type
import { 
  Users, 
  BarChart3, 
  Settings, 
  CheckSquare, 
  Home,
  UserCog,
  Shield,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentUser?: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser }) => {
  const location = useLocation();

  // Debug logging
  console.log('Sidebar Debug:', {
    currentUser,
    userRole: currentUser?.role,
    userName: currentUser?.name,
    userEmail: currentUser?.email
  });

  // Safe string helpers to prevent .slice errors
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const getDisplayName = (user: User | null | undefined): string => {
    if (!user) return 'User';
    
    const name = safeString(user.name);
    if (name.length === 0) return 'User';
    
    return name;
  };

  const getInitials = (user: User | null | undefined): string => {
    if (!user) return 'U';
    
    try {
      const name = safeString(user.name);
      if (name.length === 0) return 'U';
      
      const words = name.trim().split(/\s+/).filter(word => word.length > 0);
      
      if (words.length === 0) return 'U';
      if (words.length === 1) return words[0].charAt(0).toUpperCase();
      
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    } catch (error) {
      console.error('Error generating initials:', error);
      return 'U';
    }
  };

  const formatRole = (role: string | undefined): string => {
    if (!role) return 'Member';
    
    try {
      const roleStr = safeString(role);
      return roleStr
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      console.error('Error formatting role:', error);
      return 'Member';
    }
  };

  // Safe role checking
  const isSuperAdmin = (() => {
    if (!currentUser?.role) return false;
    
    try {
      const role = safeString(currentUser.role).toLowerCase().replace(/\s+/g, '_');
      return role === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin role:', error);
      return false;
    }
  })();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      current: location.pathname === '/tasks',
    },
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      current: location.pathname === '/team',
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      current: location.pathname === '/reports',
    },
  ];

  // Add admin-only navigation items for super admins
  const adminNavigationItems = [
    {
      name: 'Manage Team Members',
      href: '/admin/team-members',
      icon: UserCog,
      current: location.pathname === '/admin/team-members',
      adminOnly: true,
    },
  ];

  const settingsItems = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
    },
  ];

  console.log('Sidebar role check:', {
    currentUserRole: currentUser?.role,
    isSuperAdmin,
    roleFormatted: formatRole(currentUser?.role)
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Don't render sidebar if no user
  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-white shadow-lg border-r">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
        <img 
          src="/Chatzy.png" 
          alt="TaskMaster" 
          className="h-8 w-8"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <span className="ml-2 text-xl font-bold text-gray-900">TaskMaster</span>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {currentUser.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={getDisplayName(currentUser)}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  // Hide image and show initials on error
                  e.currentTarget.style.display = 'none';
                  const initialsDiv = e.currentTarget.nextElementSibling as HTMLElement;
                  if (initialsDiv) {
                    initialsDiv.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            
            {/* Initials fallback */}
            <div 
              className={cn(
                "h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center",
                currentUser.avatarUrl ? "hidden" : "flex"
              )}
            >
              <span className="text-sm font-medium text-white">
                {getInitials(currentUser)}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 truncate">
              {getDisplayName(currentUser)}
            </p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-500 truncate">
                {formatRole(currentUser.role)}
              </p>
              {isSuperAdmin && (
                <Shield className="h-3 w-3 text-blue-600 flex-shrink-0" title="Super Administrator" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  item.current
                    ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-l-md'
                )}
              >
                <Icon
                  className={cn(
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Admin Section - Only show for super admins */}
        {isSuperAdmin && (
          <div className="pt-6">
            <div className="mb-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Administration
              </h3>
            </div>
            <div className="space-y-1">
              {adminNavigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      item.current
                        ? 'bg-red-50 border-r-4 border-red-500 text-red-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-l-md'
                    )}
                  >
                    <Icon
                      className={cn(
                        item.current ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-5 w-5 flex-shrink-0'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Section */}
        <div className="pt-6">
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-l-md'
                  )}
                >
                  <Icon
                    className={cn(
                      item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5 flex-shrink-0'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer/Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center text-left text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};
