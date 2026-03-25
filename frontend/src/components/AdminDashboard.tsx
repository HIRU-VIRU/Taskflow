import React, { useState, useEffect } from 'react';
import { AdminOnly, RoleBadge, usePermissions } from './RoleBasedAccess';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: string;
  features: string[];
  limits: Record<string, number>;
}

/**
 * Admin Dashboard Component
 * Demonstrates RBAC system with admin-only features
 */
export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, canInviteUsers, canManageSubscription } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'member' | 'admin'>('member');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load plans (public endpoint)
      const plansResponse = await fetch('/api/plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.data.plans);
      }

      // Load users (admin only)
      if (isAdmin()) {
        const usersResponse = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.data.users);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInviteUsers()) return;

    setInviting(true);
    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
        }),
      });

      if (response.ok) {
        setNewUserEmail('');
        setNewUserName('');
        setNewUserRole('member');
        loadData(); // Reload users list
        alert('User invited successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error.message}`);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Error inviting user');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          Dashboard
          <RoleBadge />
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome, {user?.name}! You are logged in as: <strong>{user?.role}</strong>
        </p>
      </div>

      {/* Admin-Only Sections */}
      <AdminOnly fallback={<div className="bg-yellow-100 p-4 rounded-lg">
        <p className="text-yellow-800">
          🔒 Admin features are hidden. Some functionality requires admin privileges.
        </p>
      </div>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">👥 User Management</h2>

            {/* User List */}
            <div className="space-y-3 mb-6">
              <h3 className="font-medium text-gray-700">Team Members ({users.length})</h3>
              {users.map((teamUser) => (
                <div key={teamUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{teamUser.name}</p>
                    <p className="text-sm text-gray-600">{teamUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      teamUser.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {teamUser.role}
                    </span>
                    {teamUser.id === user?.id && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite User Form */}
            {canInviteUsers() && (
              <form onSubmit={handleInviteUser} className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-3">Invite New User</h3>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'member' | 'admin')}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviting ? 'Inviting...' : 'Invite User'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Subscription Management */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">💳 Subscription Management</h2>
            <p className="text-gray-600 mb-4">Available Plans:</p>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <span className="text-lg font-bold text-green-600">
                      ${plan.priceMonthly}/mo
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

                  <div className="text-sm">
                    <p className="font-medium mb-1">Features:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature.replace('_', ' ')}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 text-sm">
                    <p className="font-medium mb-1">Limits:</p>
                    <ul className="text-gray-600 space-y-1">
                      {Object.entries(plan.limits).map(([key, value]) => (
                        <li key={key}>
                          {key.replace('_', ' ')}: {value === -1 ? 'Unlimited' : value}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {canManageSubscription() && (
                    <button className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm">
                      Select Plan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminOnly>

      {/* General user info (visible to all authenticated users) */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Your Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Role:</p>
            <p className="font-medium">{user?.role}</p>
          </div>
          <div>
            <p className="text-gray-600">Email:</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};