import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Building, Shield, Crown, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../config/api';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Team-specific fields
    teamName: '',
    managerName: '',
    // User-specific fields
    username: '',
    teamId: '',
    // Admin-specific fields
    superAdminId: ''
  });

  const roles = [
    { value: 'super_admin', label: 'Super Admin', description: 'System administrator with full access' },
    { value: 'admin', label: 'Admin', description: 'Administrator under a Super Admin' },
    { value: 'team', label: 'Team Manager', description: 'Team manager who can manage team members' },
    { value: 'user', label: 'User', description: 'Regular user under a team' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      
      let endpoint = '';
      let payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };

      switch (formData.role) {
        case 'super_admin':
          endpoint = '/api/auth/register/super-admin';
          break;
        case 'admin':
          if (!formData.superAdminId) {
            toast.error('Please select a Super Admin');
            return;
          }
          endpoint = '/api/auth/register/admin';
          payload.superAdminId = formData.superAdminId;
          break;
        case 'team':
          if (!formData.teamName || !formData.managerName) {
            toast.error('Please fill in all team fields');
            return;
          }
          endpoint = '/api/auth/register/team';
          payload.teamName = formData.teamName;
          payload.managerName = formData.managerName;
          break;
        case 'user':
          if (!formData.username || !formData.teamId) {
            toast.error('Please fill in all user fields');
            return;
          }
          endpoint = '/api/auth/register/user';
          payload.username = formData.username;
          payload.teamId = formData.teamId;
          break;
        default:
          toast.error('Please select a role');
          return;
      }

      const response = await axios.post(getApiUrl(endpoint), payload);
      
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Registration failed';
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

  const fetchTeams = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/users/teams'));
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchSuperAdmins = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/users/super-admins'));
      setSuperAdmins(response.data);
    } catch (error) {
      console.error('Error fetching super admins:', error);
    }
  };

  // Fetch data based on selected role
  useEffect(() => {
    if (formData.role === 'user') {
      fetchTeams();
    } else if (formData.role === 'admin') {
      fetchSuperAdmins();
    }
  }, [formData.role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-[#ededed]">
            <UserPlus className="h-6 w-6 text-[#141414]" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-[#141414] tracking-light">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Join the Ticketing System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[#141414] mb-2">
                Register as
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
              >
                <option value="">Select your role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Super Admin Registration Fields */}
            {formData.role === 'super_admin' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#141414] mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Crown className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            {/* Admin Registration Fields */}
            {formData.role === 'admin' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#141414] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="superAdminId" className="block text-sm font-medium text-[#141414] mb-2">
                    Super Admin <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Crown className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="superAdminId"
                      name="superAdminId"
                      value={formData.superAdminId}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      required
                    >
                      <option value="">Select a Super Admin</option>
                      {superAdmins.map((superAdmin) => (
                        <option key={superAdmin.id} value={superAdmin.id}>
                          {superAdmin.name} ({superAdmin.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Team Registration Fields */}
            {formData.role === 'team' && (
              <>
                <div>
                  <label htmlFor="teamName" className="block text-sm font-medium text-[#141414] mb-2">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="teamName"
                      name="teamName"
                      type="text"
                      required
                      value={formData.teamName}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      placeholder="Enter team name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="managerName" className="block text-sm font-medium text-[#141414] mb-2">
                    Manager Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="managerName"
                      name="managerName"
                      type="text"
                      required
                      value={formData.managerName}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      placeholder="Enter manager name"
                    />
                  </div>
                </div>
              </>
            )}

            {/* User Registration Fields */}
            {formData.role === 'user' && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-[#141414] mb-2">
                    Username <span className="text-red-500">*</span>
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

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#141414] mb-2">
                    Full Name <span className="text-red-500">*</span>
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
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="teamId" className="block text-sm font-medium text-[#141414] mb-2">
                    Team <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="teamId"
                      name="teamId"
                      value={formData.teamId}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      required
                    >
                      <option value="">Select a team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName} (Manager: {team.managerName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field (Common for all roles) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#141414] mb-2">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#141414] mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#141414] mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium w-full"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center justify-center w-full text-sm text-[#141414] hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;