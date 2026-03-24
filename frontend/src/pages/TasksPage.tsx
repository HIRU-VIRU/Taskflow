import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { Task, Project } from '../types';
import { CheckCircle, AlertCircle } from 'lucide-react';

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectsData = await projectsApi.getProjects();
        setProjects(projectsData);

        const allTasks: Task[] = [];
        for (const project of projectsData) {
          const taskData = await tasksApi.getTasksByProject(project.id);
          allTasks.push(...taskData);
        }
        setTasks(allTasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || 'Unknown';

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">All Tasks</h1>

      <div className="flex gap-2">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {getProjectName(task.project_id)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <CheckCircle
                  className={`w-6 h-6 ${
                    task.status === 'done' ? 'text-green-600' : 'text-gray-300'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
