import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { teamsApi } from '../api/teams';
import { usersApi } from '../api/users';
import { Team, CreateTeamRequest, User } from '../types';
import { Users, Plus, Edit, Trash2, Crown, X } from 'lucide-react';

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [teamFormData, setTeamFormData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
    leader_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, usersData] = await Promise.all([
        teamsApi.getTeams(),
        usersApi.getUsers(),
      ]);
      setTeams(teamsData);
      setUsers(usersData);
    } catch (error: any) {
      showError('Failed to fetch teams data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTeam = await teamsApi.createTeam(teamFormData);
      setTeams([...teams, newTeam]);
      setTeamFormData({ name: '', description: '', leader_id: '' });
      setShowCreateForm(false);
      showSuccess('Team created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create team');
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    try {
      const updatedTeam = await teamsApi.updateTeam(editingTeam.id, teamFormData);
      setTeams(teams.map(t => t.id === editingTeam.id ? updatedTeam : t));
      setEditingTeam(null);
      setTeamFormData({ name: '', description: '', leader_id: '' });
      showSuccess('Team updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await teamsApi.deleteTeam(teamId);
      setTeams(teams.filter(t => t.id !== teamId));
      showSuccess('Team deleted successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to delete team');
    }
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      description: team.description || '',
      leader_id: team.leader_id || '',
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setTeamFormData({ name: '', description: '', leader_id: '' });
    setShowCreateForm(false);
  };

  if (!isAdmin()) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can manage teams.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Create and manage teams for your organization</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {/* Create/Edit Team Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  placeholder="Development Team"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Leader
                </label>
                <select
                  value={teamFormData.leader_id}
                  onChange={(e) => setTeamFormData({ ...teamFormData, leader_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a leader (optional)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Brief description of the team's purpose..."
                value={teamFormData.description}
                onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingTeam ? 'Update Team' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const leader = users.find(u => u.id === team.leader_id);
          return (
            <div key={team.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                  {team.description && (
                    <p className="text-gray-600 text-sm mt-1">{team.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(team)}
                    className="text-gray-400 hover:text-blue-600 transition"
                    title="Edit team"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="Delete team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {leader && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700">Leader: {leader.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">
                    {team.project_count || 0} project{team.project_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  Created {new Date(team.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Manage Members
                </button>
              </div>
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first team to organize your projects and team members.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Your First Team
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;