import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { teamsApi } from '../api/teams';
import { usersApi } from '../api/users';
import { Project, Task, Team } from '../types';
import { TrendingUp, FolderOpen, CheckSquare, AlertCircle, Users, CreditCard, Loader2 } from 'lucide-react';
import { AdminOnly, RoleBadge, usePermissions } from '../components/RoleBasedAccess';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  created_at: string;
}

const LoadingSpinner = () => (
  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, tenant, token, isInitialized } = useAuth();
  const { subscription, hasFeature } = useTenant();
  const { canInviteUsers, canManageSubscription } = usePermissions();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Admin-specific state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) return; // Don't load anything if no user

    const fetchData = async () => {
      try {
        setLoadingProjects(true);
        // Fetch projects (limit 100 to get a good count for progress bar)
        const [projectsData] = await Promise.all([
          projectsApi.getProjects(1, 100),
          fetchTeams(),
        ]);
        setProjects(projectsData);
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

  const fetchTeams = async () => {
    try {
      const teamsData = await teamsApi.getTeams();
      setTeams(teamsData);
      return teamsData;
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      return [];
    }
  };

  const loadAdminData = async () => {
    if (loadingAdminData) return; // Prevent duplicate calls
    if (!user || !user.role || user.role !== 'admin') return; // Only load if admin

    setLoadingAdminData(true);
    try {
      // Load users using the API client (proper base URL)
      const usersList = await usersApi.getUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        setLoadingTasks(true);
        const allTasks = await tasksApi.getTenantTasks();
        setTasks(allTasks);
      } catch (error) {
        console.error('Failed to fetch all tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    if (isInitialized && user) {
      fetchAllTasks();
    }
  }, [isInitialized, user]);

  // Periodic refresh for admin data to catch new users
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const intervalId = setInterval(() => {
      loadAdminData();
    }, 60000); // Refresh every 60 seconds (less frequent than UsersPage)

    return () => clearInterval(intervalId);
  }, [user?.role]);

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

  const getUsagePercentage = (key: string, limit: number) => {
    if (limit === -1 || !limit) return 0;
    let current = 0;
    // Normalize keys which might come from backend as max_projects or maxProjects
    const normalizedKey = key.toLowerCase().replace(/_/g, '');
    
    if (normalizedKey.includes('project')) current = projects.length;
    if (normalizedKey.includes('user')) current = users.length;
    if (normalizedKey.includes('task')) current = tasks.length;
    
    return Math.min(Math.round((current / limit) * 100), 100);
  };

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

      {/* Plan Info Card - Elegant Glassmorphism style */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl p-8 mb-8">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <CreditCard className="w-32 h-32" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 uppercase tracking-wider">
              {subscription?.plan_name || 'Free'} Plan
            </span>
            <h3 className="text-2xl font-bold text-gray-900 leading-tight">
              Enhanced productivity features are active
            </h3>
            <p className="text-gray-600 max-w-2xl">
              Included: {subscription?.features?.map(f => f.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')).join(', ') || 'Basic task management'}
            </p>
          </div>
          <button
            onClick={() => navigate('/plans')}
            className="whitespace-nowrap px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium shadow-lg hover:shadow-black/10 active:scale-95"
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={FolderOpen} label="Projects" value={projects.length} loading={loadingProjects} color="indigo" />
        <StatCard icon={CheckSquare} label="Active Tasks" value={inProgressTasks} loading={loadingTasks} color="amber" />
        <StatCard icon={TrendingUp} label="Completed" value={completedTasks} loading={loadingTasks} color="green" />
        <StatCard icon={AlertCircle} label="Total Tasks" value={tasks.length} loading={loadingTasks} color="blue" />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
          {hasFeature('CREATE_PROJECT') && (
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
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
            {projects.slice(0, 5).map((project) => {
              const assignedTeam = teams.find(team => team.id === project.team_id);
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                >
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{project.description}</p>

                  {assignedTeam && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Team: {assignedTeam.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {project.status}
                      </span>
                      {!assignedTeam && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          No team
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Team</h2>
              </div>
              <button
                onClick={() => navigate('/users')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Manage All
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {loadingAdminData ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg" />)}
                </div>
              ) : (
                users.slice(0, 3).map((teamUser) => (
                  <div key={teamUser.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {teamUser.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{teamUser.name}</p>
                        <p className="text-xs text-gray-500">{teamUser.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${teamUser.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {teamUser.role}
                    </span>
                  </div>
                ))
              )}
              {users.length > 3 && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  + {users.length - 3} more members
                </p>
              )}
            </div>

            {canInviteUsers() && (
              <div className="pt-4 border-t border-gray-50">
                <button 
                  onClick={() => navigate('/users')}
                  className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Invite New Member
                </button>
              </div>
            )}
          </div>

          {/* Subscription Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tight">Active</span>
            </div>

            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest uppercase opacity-80">Current Plan</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{subscription?.plan_name || 'Free'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest uppercase opacity-80">Next Billing</p>
                  <p className="text-sm font-bold text-gray-900">
                    {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(subscription?.limits || {}).slice(0, 2).map(([key, value]) => {
                  const percentage = getUsagePercentage(key, value as number);
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-gray-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-gray-900">
                          {value === -1 ? 'Unlimited' : `${getUsagePercentage(key, value as number)}% Used`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-blue-600'
                          }`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {canManageSubscription() && (
              <button
                onClick={() => navigate('/plans')}
                className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
              >
                Change Subscription
              </button>
            )}
          </div>
        </div>
      </AdminOnly>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number; loading?: boolean; color?: string }> = ({
  icon: Icon,
  label,
  value,
  loading = false,
  color = 'blue',
}) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] opacity-70 mb-1">{label}</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">
            {loading ? <LoadingSpinner /> : value}
          </p>
        </div>
        <div className={`p-3.5 rounded-2xl transition-all duration-500 group-hover:scale-110 ${selectedColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 tracking-tight">Syncing Live Data</span>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-green-500 transition-all group-hover:scale-125" />
          <span className="text-[10px] font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">Optimal</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
