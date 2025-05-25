// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Users, 
  BarChart3, 
  Settings, 
  CheckSquare, 
  Home,
  UserCog, // Add this icon for team management
  Shield // Add this icon for admin badge
} from 'lucide-react';

interface SidebarProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'manager' | 'supervisor' | 'member';
  };
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser }) => {
  const location = useLocation();

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

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'Super_admin';
  
  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <img src="/logo.png" alt="TaskBerry" className="h-8 w-auto" />
        <span className="ml-2 text-xl font-bold text-gray-900">TaskBerry</span>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{currentUser.name}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
                {isSuperAdmin && (
                  <Shield className="h-3 w-3 text-blue-600" title="Super Administrator" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
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
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors'
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
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors'
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
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors'
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
          onClick={() => {
            // Add your logout logic here
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="w-full text-left text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
