import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { usersApi } from '../api/users';
import { teamsApi } from '../api/teams';
import { useAuth } from '../contexts/AuthContext';
import { Project, Task, User, CreateTaskRequest, Team, TeamMember } from '../types';
import { AISummarizer } from '../components/AISummarizer';
import { User as UserIcon, Edit, Trash2, Plus, Check, X, Crown, Calendar, Users } from 'lucide-react';

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if current user can manage tasks (admin or team leader)
  const canManageTasks = () => {
    if (!user || !project) return false;

    // Admins can always manage tasks
    if (user.role === 'admin') return true;

    // Team leaders can manage tasks for their team's projects
    if (team) {
      return teamMembers.some(member =>
        member.user_id === user.id && member.role === 'leader'
      );
    }

    // Fallback: if no team assigned, check old leader_id system
    return project.leader_id === user.id;
  };

  // Task CRUD states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [taskFormData, setTaskFormData] = useState<CreateTaskRequest & { status?: string }>({
    title: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
    due_date: '',
    status: 'todo'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const [projectData, tasksData, usersData] = await Promise.all([
          projectsApi.getProject(projectId),
          tasksApi.getTasksByProject(projectId),
          usersApi.getUsers(),
        ]);
        setProject(projectData);
        setTasks(tasksData);
        setUsers(usersData);

        // Fetch team data if project has a team assigned
        if (projectData.team_id) {
          try {
            const [teamData, teamMembersData] = await Promise.all([
              teamsApi.getTeam(projectData.team_id),
              teamsApi.getTeamMembers(projectData.team_id),
            ]);
            setTeam(teamData);
            setTeamMembers(teamMembersData);
          } catch (error) {
            console.error('Failed to fetch team data:', error);
            // Continue without team data if there's an error
          }
        }
      } catch (error) {
        console.error('Failed to fetch project details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Get users who can be assigned tasks (team members or all users if no team)
  const getAssignableUsers = () => {
    if (team && teamMembers.length > 0) {
      // Only show team members for task assignment
      const teamUserIds = teamMembers.map(member => member.user_id);
      return users.filter(user => teamUserIds.includes(user.id));
    }
    // If no team is assigned, show all users (fallback for existing projects)
    return users;
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignee_id: '',
      due_date: '',
      status: 'todo'
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      const newTask = await tasksApi.createTask(projectId, taskFormData);
      setTasks(prev => [newTask, ...prev]);
      setShowCreateForm(false);
      resetTaskForm();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  const handleEditTask = async (taskId: string) => {
    if (!projectId) return;

    try {
      const updatedTask = await tasksApi.updateTask(projectId, taskId, taskFormData);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setEditingTask(null);
      resetTaskForm();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;

    setDeletingTask(taskId);
    try {
      await tasksApi.deleteTask(projectId, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    } finally {
      setDeletingTask(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!projectId) return;

    try {
      const updatedTask = await tasksApi.updateTask(projectId, taskId, { status: newStatus as any });
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status');
    }
  };

  const startEditTask = (task: Task) => {
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee_id: task.assignee_id || '',
      due_date: task.due_date || '',
      status: task.status
    });
    setEditingTask(task.id);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setShowCreateForm(false);
    resetTaskForm();
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const stats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const getUserName = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId)?.name || 'Unknown User' : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600 mt-2">{project.description}</p>

        {/* Team information */}
        {team ? (
          <div className="mt-6 relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
              <Users className="w-32 h-32" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Assigned Team: {team.name}</h3>
                    {team.description && (
                      <p className="text-gray-500 text-sm font-medium">{team.description}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80">Team Members ({teamMembers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((member) => {
                    const memberUser = users.find(u => u.id === member.user_id);
                    return (
                      <div
                        key={member.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 border ${
                          member.role === 'leader'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm'
                            : 'bg-white text-blue-700 border-blue-100 shadow-sm'
                        }`}
                      >
                        {member.role === 'leader' ? <Crown className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-blue-400" />}
                        {memberUser?.name || 'Unknown User'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800 text-sm">
                No team assigned to this project. Only admins can manage tasks.
              </p>
            </div>
          </div>
        )}
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

      {/* AI Summarizer */}
      {projectId && <AISummarizer projectId={projectId} />}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          {canManageTasks() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          )}
        </div>

        {/* Create Task Form */}
        {showCreateForm && canManageTasks() && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={taskFormData.priority}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <textarea
                placeholder="Task description (optional)"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select
                    value={taskFormData.assignee_id || ''}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, assignee_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No assignee</option>
                    {getAssignableUsers().map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskFormData.due_date}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200">
              {editingTask === task.id ? (
                /* Edit Task Form */
                <form onSubmit={(e) => { e.preventDefault(); handleEditTask(task.id); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={taskFormData.title}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={taskFormData.status}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>

                    <select
                    value={taskFormData.assignee_id || ''}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, assignee_id: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No assignee</option>
                      {getAssignableUsers().map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={taskFormData.due_date}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Display Task */
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}

                    {/* Task metadata */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.priority} priority
                      </span>

                      {/* Status Badge with Quick Change */}
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${
                          task.status === 'done'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>

                      {/* Assignee */}
                      {task.assignee_id && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          <UserIcon className="w-3 h-3" />
                          {getUserName(task.assignee_id)}
                        </span>
                      )}

                      {/* Due Date */}
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEditTask(task)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit task"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingTask === task.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
