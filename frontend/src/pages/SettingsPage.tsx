import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { SuccessMessage } from '../components/common/StatusMessages';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { tenant } = useTenant();
  const { addNotification } = useNotification();
  const [tenantName, setTenantName] = useState(tenant?.name || '');
  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleUpdateTenantName = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification({
      type: 'success',
      message: 'Tenant name update functionality would go here',
      duration: 3000,
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Section */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="font-medium text-gray-900">{user?.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Role</p>
            <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-gray-600">Tenant</p>
            <p className="font-medium text-gray-900">{tenant?.name}</p>
          </div>
        </div>
      </section>

      {/* Tenant Settings */}
      {isAdmin() && (
        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Tenant Settings</h2>
          <form onSubmit={handleUpdateTenantName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        </section>
      )}

      {/* Subscription */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Plan</h2>
        <button
          onClick={() => navigate('/plans')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View and Upgrade Plans →
        </button>
      </section>

      {/* Logout */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Session</h2>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Logout
        </button>
      </section>

      {/* Danger Zone */}
      {isAdmin() && (
        <section className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            {showDangerZone ? 'Hide' : 'Show'} Dangerous Actions
          </button>
          {showDangerZone && (
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure? This cannot be undone.')) {
                  addNotification({ type: 'error', message: 'Delete tenant functionality not yet implemented' });
                }
              }}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Delete Tenant Account
            </button>
          )}
        </section>
      )}
    </div>
  );
};
