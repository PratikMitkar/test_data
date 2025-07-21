import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Building,
  Shield,
  Crown
} from 'lucide-react';

const UsersPage = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState(''); // 'admin' or 'member'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    teamId: '',
    username: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all user types and teams
      const [usersRes, teamsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users/all'),
        axios.get('http://localhost:5000/api/users/teams')
      ]);
      
      setUsers(usersRes.data.users || []);
      setTeams(teamsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For members, teamId is required
    if (createType === 'member' && !formData.teamId) {
      toast.error('Please select a team for the member');
      return;
    }

    // For members, username is required
    if (createType === 'member' && !formData.username) {
      toast.error('Please provide a username for the member');
      return;
    }

    try {
      setSubmitting(true);
      
      if (createType === 'admin') {
        // Create admin (only super admin can do this)
        await axios.post('http://localhost:5000/api/auth/register/admin', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          superAdminId: user.id // Add the current super admin's ID
        });
        toast.success('Admin created successfully');
      } else if (createType === 'member') {
        // Create member (team can do this)
        await axios.post('http://localhost:5000/api/auth/register/user', {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          teamId: formData.teamId
        });
        toast.success('Member created successfully');
      }
      
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        teamId: '',
        username: ''
      });
      setCreateType('');
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      const message = error.response?.data?.error || 'Failed to create user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userType) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'team':
        return <Building className="h-4 w-4 text-green-600" />;
      case 'user':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'team':
        return 'Team Manager';
      case 'user':
        return 'Member';
      default:
        return 'Unknown';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.username?.toLowerCase().includes(search.toLowerCase()) ||
    user.teamName?.toLowerCase().includes(search.toLowerCase())
  );

  const canCreateAdmin = isSuperAdmin();
  const canCreateMember = isAdmin() || user?.role === 'team';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">User Management</p>
          <p className="text-neutral-500 text-sm font-normal leading-normal">Manage system users and their permissions</p>
        </div>
        <div className="flex gap-2">
          {canCreateAdmin && (
            <button
              onClick={() => {
                setCreateType('admin');
                setShowCreateModal(true);
              }}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-black text-neutral-50 gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4"
            >
              <Shield className="h-5 w-5" />
              <span className="truncate">Create Admin</span>
            </button>
          )}
          {canCreateMember && (
            <button
              onClick={() => {
                setCreateType('member');
                setShowCreateModal(true);
              }}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 border border-[#dbdbdb] bg-neutral-50 text-[#141414] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4"
            >
              <UserPlus className="h-5 w-5" />
              <span className="truncate">Create Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="px-4 py-3 @container">
        <div className="flex overflow-hidden rounded-xl border border-[#dbdbdb] bg-neutral-50">
          {loading ? (
            <div className="flex items-center justify-center h-64 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 w-full">
              <UsersIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-[#141414]">No users found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {search ? 'Try adjusting your search.' : 'Get started by adding a new user.'}
              </p>
            </div>
          ) : (
            <table className="flex-1">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="table-column-120 px-4 py-3 text-left text-[#141414] w-[400px] text-sm font-medium leading-normal">
                    User
                  </th>
                  <th className="table-column-240 px-4 py-3 text-left text-[#141414] w-60 text-sm font-medium leading-normal">
                    Role
                  </th>
                  <th className="table-column-360 px-4 py-3 text-left text-[#141414] w-60 text-sm font-medium leading-normal">
                    Team
                  </th>
                  <th className="table-column-480 px-4 py-3 text-left text-[#141414] w-60 text-sm font-medium leading-normal">
                    Status
                  </th>
                  <th className="table-column-600 px-4 py-3 text-left text-[#141414] w-20 text-sm font-medium leading-normal">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-t-[#dbdbdb]">
                    <td className="table-column-120 h-[72px] px-4 py-2 w-[400px]">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-[#ededed] flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#141414]">
                            {user.name || user.teamName || user.username}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {user.username || user.managerName}
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-column-240 h-[72px] px-4 py-2 w-60">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className="ml-2 text-sm text-[#141414]">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="table-column-360 h-[72px] px-4 py-2 w-60 text-sm text-[#141414]">
                      {user.role === 'user' ? (user.team?.teamName || 'N/A') : (user.role === 'team' ? 'Team Manager' : 'N/A')}
                    </td>
                    <td className="table-column-480 h-[72px] px-4 py-2 w-60">
                      <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#ededed] text-[#141414] text-sm font-medium leading-normal">
                        <span className="truncate">{user.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="table-column-600 h-[72px] px-4 py-2 w-20 text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.role)}
                        className="text-neutral-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <style>
          {`
          @container(max-width:120px){.table-column-120{display: none;}}
          @container(max-width:240px){.table-column-240{display: none;}}
          @container(max-width:360px){.table-column-360{display: none;}}
          @container(max-width:480px){.table-column-480{display: none;}}
          @container(max-width:600px){.table-column-600{display: none;}}
          `}
        </style>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[480px] shadow-lg rounded-xl bg-white">
            <div className="mt-2">
              <h3 className="text-xl font-medium text-[#141414] mb-4">
                Create {createType === 'admin' ? 'Admin' : 'Member'}
              </h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                {createType === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    placeholder="Enter password"
                    required
                  />
                </div>

                {createType === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Team <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.teamId}
                      onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      required
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        name: '',
                        email: '',
                        password: '',
                        teamId: '',
                        username: ''
                      });
                      setCreateType('');
                    }}
                    className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 