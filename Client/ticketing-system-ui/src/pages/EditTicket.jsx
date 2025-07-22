import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import toast from 'react-hot-toast';
import {
  Ticket,
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const EditTicket = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    department: '',
    dueDate: ''
  });
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchTicket();
    fetchFormData();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl(`/api/tickets/${id}`));
      const ticketData = response.data.ticket;
      setTicket(ticketData);
      
      // Format date for input field (YYYY-MM-DDThh:mm)
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };
      
      setFormData({
        title: ticketData.title || '',
        description: ticketData.description || '',
        type: ticketData.type || 'task',
        category: ticketData.category || 'technical',
        department: ticketData.department || 'IT',
        dueDate: formatDate(ticketData.dueDate),
        teamId: ticketData.teamId?.toString() || '',
        projectId: ticketData.projectId?.toString() || '',
        assignedTo: ticketData.assignedTo?.toString() || '',
        priority: ticketData.priority || 'MEDIUM'
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to fetch ticket details');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      // Fetch teams, users, and projects for dropdowns using the correct endpoints
      const [teamsRes, usersRes, projectsRes] = await Promise.all([
        axios.get(getApiUrl('/api/teams/dropdown')),
        axios.get(getApiUrl('/api/users/for-tickets')),
        axios.get(getApiUrl('/api/projects/dropdown'))
      ]);

      setTeams(teamsRes.data.teams || []);
      setUsers(usersRes.data.users || []);
      setProjects(projectsRes.data.projects || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
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
        priority: formData.priority
      };

      await axios.put(getApiUrl(`/api/tickets/${id}`), ticketData);

      toast.success('Ticket updated successfully!');
      navigate(`/tickets/${id}`);
    } catch (error) {
      console.error('Error updating ticket:', error);
      const message = error.response?.data?.error || error.response?.data?.details?.[0]?.msg || 'Failed to update ticket';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user can edit this ticket
  const canEdit = () => {
    if (!ticket || !user) return false;
    
    // If ticket is not in PENDING_APPROVAL status, it can't be edited
    if (ticket.status !== 'PENDING_APPROVAL') return false;
    
    // Admin and super admin can always edit
    if (user.role === 'admin' || user.role === 'super_admin') return true;
    
    // Team manager can edit tickets for their team
    if (user.role === 'team' && ticket.teamId === user.id) return true;
    
    // User can edit if they created the ticket
    if (user.role === 'user' && ticket.createdBy === user.id) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <Ticket className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ticket not found</h3>
        <p className="mt-1 text-sm text-gray-500">The ticket you're looking for doesn't exist.</p>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/tickets/${id}`)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Ticket</h1>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Cannot Edit Ticket
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This ticket cannot be edited because:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {ticket.status !== 'PENDING_APPROVAL' && (
                        <li>The ticket has already been {ticket.status.toLowerCase().replace('_', ' ')}</li>
                      )}
                      {ticket.status === 'PENDING_APPROVAL' && (
                        <li>You don't have permission to edit this ticket</li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/tickets/${id}`)}
                      className="btn btn-sm btn-outline"
                    >
                      Back to Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/tickets/${id}`)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Ticket</h1>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="card-content space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Ticket Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 input"
              placeholder="Enter ticket title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 input"
              placeholder="Describe the issue or request in detail"
              required
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Ticket Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 input"
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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 input"
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
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="mt-1 input"
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
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="mt-1 input"
                required
              />
            </div>
          </div>

          {/* Team and Assignment */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                Team <span className="text-red-500">*</span>
              </label>
              <select
                id="teamId"
                name="teamId"
                value={formData.teamId}
                onChange={handleInputChange}
                className="mt-1 input"
                required
                disabled={user?.role === 'team'} // Team managers can't change the team
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                Assign To (Optional)
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="mt-1 input"
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
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="mt-1 input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                Project (Optional)
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="mt-1 input"
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

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/tickets/${id}`)}
              className="btn btn-secondary btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-md"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTicket;