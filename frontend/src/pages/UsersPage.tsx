import { useEffect, useState } from 'react';
import { usersApi } from '../api/users';
import { useTenant } from '../contexts/TenantContext';
import { useNotification } from '../hooks/useNotification';
import { User } from '../types';
import { UserPlus, Trash2 } from 'lucide-react';

const UsersPage = () => {
  const { hasFeature } = useTenant();
  const { showError, showSuccess } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'member' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (error: any) {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFeature('INVITE_USER')) {
      showError('Feature not available in your plan');
      return;
    }

    try {
      await usersApi.inviteUser(inviteData);
      showSuccess('User invited successfully!');
      setInviteData({ email: '', name: '', role: 'member' });
      setShowInviteForm(false);
      await fetchUsers();
    } catch (error: any) {
      showError(error.message || 'Failed to invite user');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Team Members</h1>
        {hasFeature('INVITE_USER') && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        )}
      </div>

      {showInviteForm && (
        <form
          onSubmit={handleInvite}
          className="bg-white p-6 rounded-lg border border-gray-200 space-y-4"
        >
          <input
            type="text"
            placeholder="Name"
            value={inviteData.name}
            onChange={(e) => setInviteData((prev) => ({ ...prev, name: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="email"
            placeholder="Email"
            value={inviteData.email}
            onChange={(e) => setInviteData((prev) => ({ ...prev, email: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Invite
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded mt-2 inline-block">
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
