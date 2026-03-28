import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../api/users';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { User } from '../types';
import { UserPlus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

const UsersPage = () => {
  const { hasFeature } = useTenant();
  const { user: currentUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState<{ email: string; name: string; role: 'admin' | 'member' }>({ email: '', name: '', role: 'member' });
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await usersApi.getUsers();
      setUsers(data);
      showSuccess('Users list refreshed');
    } catch (error: any) {
      showError('Failed to refresh users');
    } finally {
      setRefreshing(false);
    }
  }, [showError, showSuccess]);

  useEffect(() => {
    // Create local function to avoid dependency issues
    const loadUsers = async () => {
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

    loadUsers();

    // Set up periodic refresh to catch new users
    const intervalId = setInterval(async () => {
      try {
        setRefreshing(true);
        const data = await usersApi.getUsers();
        setUsers(data);
        showSuccess('Users list refreshed');
      } catch (error: any) {
        showError('Failed to refresh users');
      } finally {
        setRefreshing(false);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to run only once

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFeature('INVITE_USER')) {
      showError('Feature not available in your plan');
      return;
    }

    try {
      await usersApi.inviteUser(inviteData);
      showSuccess('Invitation sent successfully! The user will appear here once they accept the invitation.');
      setInviteData({ email: '', name: '', role: 'member' });
      setShowInviteForm(false);
      await refreshUsers(); // Refresh the list
    } catch (error: any) {
      showError(error.message || 'Failed to invite user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showError('You do not have permission to remove users');
      return;
    }

    if (userId === currentUser.id) {
      showError('You cannot remove yourself');
      return;
    }

    setRemovingUser(userId);
    try {
      await usersApi.removeUser(userId);
      showSuccess('User removed successfully');
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (error: any) {
      showError(error.message || 'Failed to remove user');
    } finally {
      setRemovingUser(null);
      setShowRemoveConfirm(null);
    }
  };

  const isCurrentUser = (userId: string) => currentUser?.id === userId;
  const canRemoveUser = (userId: string) =>
    currentUser?.role === 'admin' && !isCurrentUser(userId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-gray-500 font-medium mt-1">Manage and collaborate with your organization's team.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshUsers}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Refresh users list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
          {hasFeature('INVITE_USER') && (
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Invite New User
            </button>
          )}
        </div>
      </div>

      {showInviteForm && (
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/5 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Invite to Organization</h3>
          </div>
          <form
            onSubmit={handleInvite}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              placeholder="Full Name"
              value={inviteData.name}
              onChange={(e) => setInviteData((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={inviteData.email}
              onChange={(e) => setInviteData((prev) => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95">
                Send Invite
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Information message */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] -mr-8 -mt-4">
          <UserPlus className="w-32 h-32" />
        </div>
        <div className="flex items-start gap-4 relative">
          <div className="p-2 bg-blue-100/50 text-blue-600 rounded-xl">
            <UserPlus className="h-6 w-6 font-bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-blue-900 tracking-tight">Pending Invitations</h3>
            <p className="text-xs font-medium text-blue-700 max-w-2xl leading-relaxed">
              Users who have been invited but haven't accepted yet won't appear in this list.
              They will be automatically added once they join the organization. 
              Click <span className="font-bold underline cursor-pointer hover:text-blue-900" onClick={refreshUsers}>Refresh List</span> to check for updates.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-lg hover:shadow-gray-200/40 hover:border-gray-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 font-black text-lg group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-500 group-hover:border-blue-200 transition-all duration-300">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-gray-900 tracking-tight">{user.name}</p>
                    {isCurrentUser(user.id) && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border ${
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 md:justify-end">
                {canRemoveUser(user.id) && showRemoveConfirm === user.id ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2 animate-in slide-in-from-right-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-700">Remove User?</span>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={removingUser === user.id}
                      className="text-xs px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-sm"
                    >
                      {removingUser === user.id ? 'Removing...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm(null)}
                      className="text-xs px-3 py-1.5 bg-white text-gray-600 font-bold border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : canRemoveUser(user.id) ? (
                  <button
                    onClick={() => setShowRemoveConfirm(user.id)}
                    className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-bold active:scale-95"
                    title="Remove user from organization"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Remove</span>
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
