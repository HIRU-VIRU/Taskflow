import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { Project, Task } from '../types';

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const [projectData, tasksData] = await Promise.all([
          projectsApi.getProject(projectId),
          tasksApi.getTasksByProject(projectId),
        ]);
        setProject(projectData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to fetch project details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const stats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600 mt-2">{project.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">To Do</p>
          <p className="text-3xl font-bold text-gray-900">{stats.todo}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Done</p>
          <p className="text-3xl font-bold text-gray-900">{stats.done}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tasks</h2>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
