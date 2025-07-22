import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Users, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config/api';

const CreateMember = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamId: ''
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check permissions
    if (user && user.role !== 'team' && user.role !== 'admin' && user.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }

    // If user is a team, auto-select their team
    if (user?.role === 'team') {
      setFormData(prev => ({ ...prev, teamId: user.id }));
    }

    fetchTeams();
  }, [user, navigate]);

  const fetchTeams = async () => {
    try {
      setFetchingTeams(true);
      const response = await axios.get(getApiUrl('/api/teams'));
      setTeams(response.data.teams || []);
      
      // If user is a team, auto-select their team
      if (user?.role === 'team') {
        setFormData(prev => ({ ...prev, teamId: user.id }));
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setFetchingTeams(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.teamId) {
      toast.error('Please select a team');
      return;
    }

    setLoading(true);

    try {
      await axios.post(getApiUrl('/api/auth/register/user'), {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        teamId: parseInt(formData.teamId)
      });

      toast.success('Member created successfully!');
      navigate('/users');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create member';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // If user is not loaded yet, show loading
  if (!user || fetchingTeams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </button>
        <h1 className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">Create New Member</h1>
        <p className="text-neutral-500 text-sm font-normal leading-normal">Add a new team member to the system</p>
      </div>

      <div className="rounded-xl border border-[#dbdbdb] bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#141414] mb-2">
              Username
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#141414] mb-2">
              Full Name
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                placeholder="Enter full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#141414] mb-2">
              Email Address
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Team Selection */}
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-[#141414] mb-2">
              Assign to Team
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="teamId"
                name="teamId"
                required
                value={formData.teamId}
                onChange={handleChange}
                disabled={user?.role === 'team'}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName} - {team.managerName}
                  </option>
                ))}
              </select>
            </div>
            {user?.role === 'team' && (
              <p className="mt-1 text-sm text-neutral-500">
                Member will be assigned to your team
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#141414] mb-2">
              Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                placeholder="Enter password (min 6 characters)"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#141414] mb-2">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Create Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMember;