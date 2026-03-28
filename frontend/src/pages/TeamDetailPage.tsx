import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamsApi } from '../api/teams';
import { usersApi } from '../api/users';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../contexts/AuthContext';
import { Team, TeamMember, User } from '../types';
import { Users, UserPlus, Trash2, ArrowLeft, Crown, Shield, Loader2 } from 'lucide-react';

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isInitialized } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'leader' | 'member'>('member');

  useEffect(() => {
    if (isInitialized && user) {
      if (teamId) {
        fetchTeamData();
      }
    }
  }, [teamId, isInitialized, user]);

  const canManage = isAdmin() || members.find(m => m.user_id === user?.id)?.role === 'leader';

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [teamData, membersData, usersData] = await Promise.all([
        teamsApi.getTeam(teamId!),
        teamsApi.getTeamMembers(teamId!),
        usersApi.getUsers(),
      ]);
      setTeam(teamData);
      setMembers(membersData);
      setAllUsers(usersData);
    } catch (error: any) {
      showError('Failed to load team details');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId || !teamId) return;

    try {
      setAddingMember(true);
      await teamsApi.addTeamMember(teamId, {
        user_id: newMemberId,
        role: newMemberRole,
      });
      
      // Refresh members list
      const updatedMembers = await teamsApi.getTeamMembers(teamId);
      setMembers(updatedMembers);
      
      setNewMemberId('');
      setNewMemberRole('member');
      showSuccess('Member added successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!teamId || !confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      await teamsApi.removeTeamMember(teamId, userId);
      setMembers(members.filter(m => m.user_id !== userId));
      showSuccess('Member removed successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to remove member');
    }
  };

  // Filter users who are not already in the team
  const availableUsers = allUsers.filter(
    user => !members.some(member => member.user_id === user.id)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-gray-600">Loading team members...</p>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/teams')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-600 font-medium">Manage Team Memberships</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team Info & Add Member */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Team Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <p className="text-gray-700 mt-1">{team.description || 'No description provided.'}</p>
              </div>
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Members</span>
                <span className="font-bold text-gray-900">{members.length}</span>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Add New Member
              </h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    required
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'leader' | 'member')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    required
                  >
                    <option value="member">Team Member</option>
                    <option value="leader">Team Leader</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addingMember || !newMemberId}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-blue-500/20"
                >
                  {addingMember ? 'Adding...' : 'Add Member To Team'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-black">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                Current Members
              </h2>
            </div>
            
            <div className="divide-y divide-gray-50">
              {members.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No members assigned to this team yet.
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white ${member.role === 'leader' ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                        {member.user_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{member.user_name}</p>
                          {member.role === 'leader' && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                              <Crown className="w-3 h-3" />
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{member.user_email}</p>
                      </div>
                    </div>
                    
                    {canManage && member.user_id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove member"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;
