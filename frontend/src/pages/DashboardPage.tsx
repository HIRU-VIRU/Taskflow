import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { Project, Task } from '../types';
import { TrendingUp, FolderOpen, CheckSquare, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
  const { user, tenant } = useAuth();
  const { subscription, hasFeature } = useTenant();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        // Fetch tasks for all projects
        for (const project of projects.slice(0, 2)) {
          const tasksData = await tasksApi.getTasksByProject(project.id);
          setTasks((prev) => [...prev, ...tasksData.slice(0, 3)]);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    if (projects.length > 0) {
      fetchTasks();
    }
  }, [projects]);

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">{tenant?.name}</p>
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            View Plans
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={FolderOpen} label="Projects" value={projects.length} />
        <StatCard icon={CheckSquare} label="Active Tasks" value={inProgressTasks} />
        <StatCard icon={TrendingUp} label="Completed" value={completedTasks} />
        <StatCard icon={AlertCircle} label="Total Tasks" value={tasks.length} />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
          {hasFeature('CREATE_PROJECT') && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              New Project
            </button>
          )}
        </div>
        {loadingProjects ? (
          <div className="text-center py-8 text-gray-500">Loading projects...</div>
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
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition"
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
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: number }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <Icon className="w-12 h-12 text-blue-600 opacity-20" />
    </div>
  </div>
);

export default DashboardPage;
