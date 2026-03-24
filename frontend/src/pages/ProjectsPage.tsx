import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { useTenant } from '../contexts/TenantContext';
import { useNotification } from '../hooks/useNotification';
import { Project } from '../types';
import { FolderPlus, Trash2, Archive } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { hasFeature } = useTenant();
  const { showError, showSuccess } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getProjects();
      setProjects(data);
    } catch (error: any) {
      showError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFeature('CREATE_PROJECT')) {
      showError('Feature not available in your plan');
      return;
    }

    try {
      const newProject = await projectsApi.createProject(formData);
      setProjects((prev) => [newProject, ...prev]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      showSuccess('Project created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create project');
    }
  };

  const handleArchive = async (projectId: string) => {
    try {
      await projectsApi.updateProject(projectId, { status: 'archived' });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showSuccess('Project archived');
    } catch (error: any) {
      showError('Failed to archive project');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Projects</h1>
        {hasFeature('CREATE_PROJECT') && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FolderPlus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Project name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Project description (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <p className="text-gray-600 text-sm mt-2">{project.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {project.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(project.id);
                  }}
                  className="p-1 text-gray-600 hover:text-red-600"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
