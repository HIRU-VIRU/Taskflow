import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
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
    { label: 'Team', icon: Users, path: '/users', adminOnly: false },
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

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition',
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
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
