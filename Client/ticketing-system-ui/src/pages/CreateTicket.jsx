import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import toast from 'react-hot-toast';
import {
  Ticket,
  Upload,
  X,
  Calendar,
  User,
  AlertCircle,
  Clock,
  FileText,
  Building
} from 'lucide-react';

const CreateTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    category: 'technical',
    department: 'IT',
    dueDate: '',
    teamId: '',
    projectId: '',
    assignedTo: '',
    priority: 'MEDIUM',
    estimatedHours: '',
    expectedClosure: '',
    attachments: []
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      // Fetch teams, users, and projects for dropdowns using the correct endpoints
      const [teamsRes, usersRes, projectsRes] = await Promise.all([
        api.get('/api/teams/dropdown'),
        api.get('/api/users/for-tickets'),
        api.get('/api/projects/dropdown')
      ]);

      setTeams(teamsRes.data.teams || []);
      setUsers(usersRes.data.users || []);
      setProjects(projectsRes.data.projects || []);

      // Auto-select team if user is a member
      if (user?.role === 'user' && user?.teamId) {
        setFormData(prev => ({
          ...prev,
          teamId: user.teamId.toString()
        }));
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || formData.title.length < 5) {
      toast.error('Title must be at least 5 characters long');
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      toast.error('Description must be at least 10 characters long');
      return;
    }

    if (!formData.dueDate) {
      toast.error('Due date is required');
      return;
    }

    if (!formData.teamId) {
      toast.error('Team selection is required');
      return;
    }

    try {
      setLoading(true);

      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');

      // Set authorization header for this specific request
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const ticketData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        department: formData.department,
        dueDate: formData.dueDate,
        teamId: parseInt(formData.teamId),
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null
      };

      console.log('Submitting ticket with data:', ticketData);
      console.log('Using auth token:', token ? 'Token exists' : 'No token');

      // Use axios directly with explicit headers
      const response = await axios.post(getApiUrl('/api/tickets'), ticketData, { headers });

      console.log('Ticket creation response:', response.data);
      toast.success('Ticket created successfully! It will be reviewed by administrators.');
      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      // Show more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Extract validation error messages
        if (error.response.data.details && error.response.data.details.length > 0) {
          const errorMessages = error.response.data.details.map(detail => detail.msg).join(', ');
          toast.error(errorMessages);
        } else {
          toast.error(error.response.data.error || 'Failed to create ticket');
        }
      } else {
        toast.error('Failed to create ticket. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'URGENT':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">Create New Ticket</p>
        <p className="text-neutral-500 text-sm font-normal leading-normal">
          Submit a new ticket for review and processing. All tickets require admin approval.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden mx-4">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#141414] mb-2">
              Ticket Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              placeholder="Enter ticket title (min 5 characters)"
              required
              minLength={5}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#141414] mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="flex w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              placeholder="Describe the issue or request in detail (min 10 characters)"
              required
              minLength={10}
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-[#141414] mb-2">
                Ticket Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature Request</option>
                <option value="task">Task</option>
                <option value="improvement">Improvement</option>
                <option value="support">Support</option>
                <option value="requirement">Requirement</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[#141414] mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
              >
                <option value="technical">Technical</option>
                <option value="business">Business</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
                <option value="ui/ux">UI/UX</option>
                <option value="database">Database</option>
                <option value="api">API</option>
              </select>
            </div>
          </div>

          {/* Department and Due Date */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-[#141414] mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
              >
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-[#141414] mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Team and Assignment */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="teamId" className="block text-sm font-medium text-[#141414] mb-2">
                Team <span className="text-red-500">*</span>
              </label>
              <select
                id="teamId"
                name="teamId"
                value={formData.teamId}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                required
                disabled={user?.role === 'user'} // Members are auto-assigned to their team
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName}
                  </option>
                ))}
              </select>
              {user?.role === 'user' && (
                <p className="mt-1 text-xs text-neutral-500">
                  You are automatically assigned to your team
                </p>
              )}
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-[#141414] mb-2">
                Assign To (Optional)
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.role === 'admin' ? '(Admin)' : user.role === 'super_admin' ? '(Super Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority and Project */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-[#141414] mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-[#141414] mb-2">
                Project (Optional)
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <option value="">No Project</option>
                {projects
                  .filter(project => !formData.teamId || project.teamId === parseInt(formData.teamId) || project.teamId === null)
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-[#141414] mb-2">
              Estimated Hours (Optional)
            </label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              placeholder="Enter estimated hours"
              min="0"
              step="0.5"
            />
          </div>

          {/* Expected Closure Date */}
          <div>
            <label htmlFor="expectedClosure" className="block text-sm font-medium text-[#141414] mb-2">
              Expected Closure Date (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="datetime-local"
                id="expectedClosure"
                name="expectedClosure"
                value={formData.expectedClosure}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              />
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-2">
              Attachments (Optional)
            </label>
            <div>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed border-[#dbdbdb] hover:bg-[#f9f9f9] hover:border-[#c0c0c0] group cursor-pointer rounded-xl">
                  <div className="flex flex-col items-center justify-center pt-7">
                    <Upload className="w-10 h-10 text-neutral-400 group-hover:text-[#141414]" />
                    <p className="pt-1 text-sm tracking-wider text-neutral-400 group-hover:text-[#141414]">
                      Select files
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="opacity-0"
                  />
                </label>
              </div>
            </div>

            {/* Display selected files */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-[#141414]">Selected Files:</h4>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-[#ededed] rounded-xl">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-[#141414] mr-2" />
                      <span className="text-sm text-[#141414]">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-[#141414] hover:text-red-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Information Box */}
          <div className="bg-[#f5f8ff] border border-[#dbdbdb] rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-[#141414]" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[#141414]">
                  Ticket Approval Process
                </h3>
                <div className="mt-2 text-sm text-neutral-500">
                  <p>• Your ticket will be submitted for admin review</p>
                  <p>• Admins will assign priority and expected closure date</p>
                  <p>• You will be notified when the ticket is approved or rejected</p>
                  <p>• Resource allocation will be handled by administrators</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
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
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;