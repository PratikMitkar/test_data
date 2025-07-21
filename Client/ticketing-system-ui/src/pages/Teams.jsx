import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Mail, User, Calendar, Search, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/teams');
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && team.isActive) ||
                         (filterStatus === 'inactive' && !team.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const toggleTeamStatus = async (teamId, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/teams/${teamId}/status`, {
        isActive: !currentStatus
      });
      
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, isActive: !currentStatus } : team
      ));
      
      toast.success(`Team ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update team status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">Teams</p>
          <p className="text-neutral-500 text-sm font-normal leading-normal">Manage teams and their members</p>
        </div>
        {user?.role === 'super_admin' && (
          <Link
            to="/teams/create"
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-black text-neutral-50 gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4"
          >
            <Plus className="h-5 w-5" />
            <span className="truncate">New team</span>
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="all">All Teams</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-3">
        {filteredTeams.map((team) => (
          <div key={team.id} className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-[#ededed] rounded-full p-2">
                  <Users className="h-6 w-6 text-[#141414]" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-[#141414]">{team.teamName}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    team.isActive 
                      ? 'bg-[#ededed] text-[#141414]' 
                      : 'bg-[#ededed] text-[#141414]'
                  }`}>
                    {team.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-neutral-500">
                <User className="h-4 w-4 mr-2" />
                <span>Manager: {team.managerName}</span>
              </div>
              
              <div className="flex items-center text-sm text-neutral-500">
                <Mail className="h-4 w-4 mr-2" />
                <span className="truncate">{team.email}</span>
              </div>
              
              <div className="flex items-center text-sm text-neutral-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created: {new Date(team.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-sm text-neutral-500">
                <Users className="h-4 w-4 mr-2" />
                <span>Members: {team.memberCount || 0}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Link
                to={`/teams/${team.id}`}
                className="text-[#141414] hover:text-black text-sm font-medium"
              >
                View Details
              </Link>
              
              {(user?.role === 'super_admin' || user?.role === 'admin') && (
                <button
                  onClick={() => toggleTeamStatus(team.id, team.isActive)}
                  className={`text-sm font-medium ${
                    team.isActive 
                      ? 'text-red-600 hover:text-red-700' 
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {team.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12 px-4">
          <Users className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-sm font-medium text-[#141414]">No teams found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new team.'
            }
          </p>
          {user?.role === 'super_admin' && !searchTerm && filterStatus === 'all' && (
            <div className="mt-6">
              <Link
                to="/teams/create"
                className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-black text-neutral-50 gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span className="truncate">New team</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teams;