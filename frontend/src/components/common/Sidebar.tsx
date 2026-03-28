import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  UserCog,
  Settings,
  CreditCard,
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { subscription } = useTenant();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Projects', icon: FolderOpen, path: '/projects' },
    { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { label: 'Teams', icon: Users, path: '/teams', adminOnly: true },
    { label: 'Members', icon: UserCog, path: '/users', adminOnly: false },
    { label: 'Plans', icon: CreditCard, path: '/plans' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">TaskFlow</h2>
        <p className="text-xs text-gray-400 mt-1">{subscription?.plan_name || 'Free'} Plan</p>
      </div>

      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          // Hide admin-only items for non-admin users
          if (item.adminOnly && !isAdmin()) {
            return null;
          }

          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                active
                  ? 'bg-blue-600/10 text-blue-500 font-bold'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 font-medium'
              )}
            >
              <div className={clsx(
                "absolute left-0 w-1 h-8 rounded-r-full transition-all duration-200",
                active ? "bg-blue-500 opacity-100" : "bg-transparent opacity-0"
              )} />
              <Icon className={clsx(
                "w-5 h-5 transition-transform duration-200",
                active ? "scale-110" : "group-hover:scale-110"
              )} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <p>Role: {isAdmin() ? 'Admin' : 'Member'}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
