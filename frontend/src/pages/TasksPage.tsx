import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { usersApi } from '../api/users';
import { Task, Project, User } from '../types';
import { CheckCircle, AlertCircle, User as UserIcon, Edit, RefreshCw } from 'lucide-react';

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsData, usersData] = await Promise.all([
          projectsApi.getProjects(),
          usersApi.getUsers(),
        ]);
        setProjects(projectsData);
        setUsers(usersData);

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

  const filteredTasks = tasks
    .filter(task => filter === 'all' || task.status === filter)
    .filter(task => assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && !task.assignee_id) ||
      task.assignee_id === assigneeFilter
    );

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || 'Unknown';

  const getUserName = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId)?.name || 'Unknown User' : null;

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await tasksApi.updateTask(task.project_id, taskId, {
        assignee_id: (assigneeId || null) as any
      });

      // Update the task in local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, assignee_id: assigneeId || null }
            : t
        )
      );

      setEditingTask(null);
      setSelectedAssignee('');
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('Failed to assign task');
    }
  };

  const refreshUsers = async () => {
    setRefreshingUsers(true);
    try {
      const usersData = await usersApi.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to refresh users:', error);
    } finally {
      setRefreshingUsers(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">All Tasks</h1>

      <div className="space-y-4">
        {/* Status Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status:</h3>
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
        </div>

        {/* Assignee Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Assignee:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAssigneeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                assigneeFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setAssigneeFilter('unassigned')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                assigneeFilter === 'unassigned'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unassigned
            </button>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setAssigneeFilter(user.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  assigneeFilter === user.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {user.name}
              </button>
            ))}
            <button
              onClick={refreshUsers}
              disabled={refreshingUsers}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh team members for assignment"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingUsers ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh Users</span>
            </button>
          </div>
        </div>
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
                  <div className="flex flex-wrap gap-2 mt-3">
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

                    {/* Assignee Display */}
                    {editingTask === task.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignTask(task.id, selectedAssignee)}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(null);
                            setSelectedAssignee('');
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          <UserIcon className="w-3 h-3" />
                          {getUserName(task.assignee_id) || 'Unassigned'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingTask(task.id);
                            setSelectedAssignee(task.assignee_id || '');
                          }}
                          className="text-xs p-1 text-gray-400 hover:text-gray-600"
                          title="Edit assignment"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
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
