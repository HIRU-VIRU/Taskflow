import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
