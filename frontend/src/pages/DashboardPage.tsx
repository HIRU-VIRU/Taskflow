import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { Project, Task } from '../types';
import { TrendingUp, FolderOpen, CheckSquare, AlertCircle, Users, CreditCard, Loader2 } from 'lucide-react';
import { AdminOnly, RoleBadge, usePermissions } from '../components/RoleBasedAccess';

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

const LoadingSpinner = () => (
  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
);

const DashboardPage = () => {
  const { user, tenant, token, isInitialized } = useAuth();
  const { subscription, hasFeature } = useTenant();
  const { isAdmin, canInviteUsers, canManageSubscription } = usePermissions();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Admin-specific state
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'member' | 'admin'>('member');

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) return; // Don't load anything if no user

    const fetchData = async () => {
      try {
        setLoadingProjects(true);
        const projectsData = await projectsApi.getProjects();
        setProjects(projectsData.slice(0, 5)); // Show first 5
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchData();

    // Load admin data if user is admin
    if (user.role === 'admin') {
      loadAdminData();
    }
  }, [isInitialized, user]);

  const loadAdminData = async () => {
    if (loadingAdminData) return; // Prevent duplicate calls
    if (!user || !user.role || user.role !== 'admin') return; // Only load if admin

    setLoadingAdminData(true);
    try {
      // Load both plans and users in parallel
      const [plansResponse, usersResponse] = await Promise.all([
        fetch('/api/plans', {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.data?.plans || plansData.plans || []);
      } else {
        console.error('Failed to fetch plans:', plansResponse.status);
        if (plansResponse.status === 401) {
          console.log('User not authenticated - stopping admin data load');
          return;
        }
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data?.users || usersData.users || []);
      } else {
        console.error('Failed to fetch users:', usersResponse.status);
        if (usersResponse.status === 401) {
          console.log('User not authenticated - stopping admin data load');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoadingAdminData(false);
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
        loadAdminData(); // Reload admin data
        alert('User invited successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error?.message || 'Failed to invite user'}`);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Error inviting user');
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    if (projects.length === 0) return;

    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        // Fetch tasks for the first 2 projects
        const taskPromises = projects.slice(0, 2).map(project =>
          tasksApi.getTasksByProject(project.id).then(tasks => tasks.slice(0, 3))
        );
        const allTasks = await Promise.all(taskPromises);
        setTasks(allTasks.flat());
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [projects]);

  // Show loading spinner while auth is initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to TaskFlow</h2>
            <p className="text-gray-600 mb-4">
              Please log in to access your dashboard and manage your projects.
            </p>
            <div className="space-y-2">
              <a
                href="/login"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
              >
                Login
              </a>
              <a
                href="/register"
                className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition duration-200"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="dashboard-container space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            Welcome, {user?.name || 'User'}!
            <RoleBadge />
          </h1>
          <p className="text-gray-600 mt-2">{tenant?.name || 'Loading tenant...'}</p>
        </div>
      </div>

      {/* Plan Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Current Plan: {subscription?.plan_name || 'Free'}
            </h3>
            <p className="text-gray-600 mt-1">
              Features: {subscription?.features?.join(', ') || 'Basic tasks & projects'}
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
            View Plans
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={FolderOpen} label="Projects" value={projects.length} loading={loadingProjects} />
        <StatCard icon={CheckSquare} label="Active Tasks" value={inProgressTasks} loading={loadingTasks} />
        <StatCard icon={TrendingUp} label="Completed" value={completedTasks} loading={loadingTasks} />
        <StatCard icon={AlertCircle} label="Total Tasks" value={tasks.length} loading={loadingTasks} />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
          {hasFeature('CREATE_PROJECT') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
              New Project
            </button>
          )}
        </div>
        {loadingProjects ? (
          <div className="text-center py-8 text-gray-500">
            <LoadingSpinner />
            <p className="mt-2">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin-Only Sections */}
      <AdminOnly fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            🔒 Additional admin features are available for administrators.
          </p>
        </div>
      }>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="admin-section">
            <h2>
              <Users className="w-5 h-5 text-blue-600" />
              User Management
            </h2>

            {/* User List */}
            <div className="space-y-3 mb-6">
              <h3>Team Members ({users.length})</h3>
              {loadingAdminData ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse p-3 bg-gray-100 rounded">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No team members found</p>
                </div>
              ) : (
                users.map((teamUser) => (
                  <div key={teamUser.id} className="user-item">
                    <div className="user-info">
                      <p className="user-name">{teamUser.name}</p>
                      <p className="user-email">{teamUser.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`user-role ${teamUser.role}`}>
                        {teamUser.role}
                      </span>
                      {teamUser.id === user?.id && (
                        <span className="text-xs text-gray-500">(You)</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Invite User Form */}
            {canInviteUsers() && (
              <form onSubmit={handleInviteUser} className="border-t pt-4">
                <h3>Invite New User</h3>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'member' | 'admin')}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <>
                        <LoadingSpinner />
                        Inviting...
                      </>
                    ) : (
                      'Invite User'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Subscription Management */}
          <div className="admin-section">
            <h2>
              <CreditCard className="w-5 h-5 text-green-600" />
              Subscription Management
            </h2>
            <p className="mb-4">Available Plans:</p>
            {loadingAdminData ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm">No plans available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="plan-card">
                    <div className="plan-header">
                      <h3 className="plan-name">{plan.name}</h3>
                      <span className="plan-price">
                        ${plan.priceMonthly}/mo
                      </span>
                    </div>
                    <p className="plan-description">{plan.description}</p>

                    <div className="plan-features">
                      <p className="font-medium mb-1 text-gray-900">Features:</p>
                      <ul>
                        {plan.features.map((feature) => (
                          <li key={feature}>{feature.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 text-sm">
                      <p className="font-medium mb-1 text-gray-900">Limits:</p>
                      <ul className="text-gray-600 space-y-1">
                        {Object.entries(plan.limits).map(([key, value]) => (
                          <li key={key}>
                            {key.replace('_', ' ')}: {value === -1 ? 'Unlimited' : value}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {canManageSubscription() && (
                      <button className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-200 text-sm">
                        Select Plan
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminOnly>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number; loading?: boolean }> = ({
  icon: Icon,
  label,
  value,
  loading = false,
}) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {loading ? <LoadingSpinner /> : value}
        </p>
      </div>
      <Icon className="w-12 h-12 text-blue-600 opacity-20" />
    </div>
  </div>
);

export default DashboardPage;
