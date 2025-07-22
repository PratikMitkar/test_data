import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import {
  FolderOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Users,
  Building,
  Eye,
  X
} from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    teamId: user?.role === 'team' ? user?.id : ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    // Only fetch teams if user is not a team manager
    if (user?.role !== 'team') {
      fetchTeams();
    }
  }, [user?.role]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl('/api/projects'));
      
      // If user is a team manager, filter projects to only show their team's projects
      if (user?.role === 'team') {
        const teamProjects = response.data.projects.filter(project => 
          project.teamId === user.id || project.teamId === parseInt(user.id)
        );
        setProjects(teamProjects || []);
      } else {
        setProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTeams = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/teams/dropdown'));
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create a copy of the form data to modify before sending
      const projectData = { ...formData };
      
      // For team managers, always set the teamId to their own team ID
      if (user?.role === 'team') {
        projectData.teamId = user.id;
      }
      
      // Handle empty description - set to empty string instead of null
      if (!projectData.description || projectData.description.trim() === '') {
        projectData.description = '';
      }
      
      // If description is provided but too short, show an error
      if (projectData.description && projectData.description.trim().length > 0 && 
          projectData.description.trim().length < 10) {
        toast.error('Description must be at least 10 characters');
        setSubmitting(false);
        return;
      }
      
      // Handle empty dates
      if (!projectData.startDate) {
        delete projectData.startDate;
      }
      
      if (!projectData.endDate) {
        delete projectData.endDate;
      }
      
      await axios.post(getApiUrl('/api/projects'), projectData);
      toast.success('Project created successfully');
      setShowCreateModal(false);
      
      // Reset form with appropriate teamId based on user role
      setFormData({
        name: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        teamId: user?.role === 'team' ? user.id : ''
      });
      
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      const message = error.response?.data?.error || 
                     (error.response?.data?.details && error.response.data.details.length > 0 ? 
                      error.response.data.details[0].msg : 
                      'Failed to create project');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create a copy of the form data to modify before sending
      const projectData = { ...formData };
      
      // For team managers, always set the teamId to their own team ID
      if (user?.role === 'team') {
        projectData.teamId = user.id;
      }
      
      // Handle empty description - set to empty string instead of null
      if (!projectData.description || projectData.description.trim() === '') {
        projectData.description = '';
      }
      
      // If description is provided but too short, show an error
      if (projectData.description && projectData.description.trim().length > 0 && 
          projectData.description.trim().length < 10) {
        toast.error('Description must be at least 10 characters');
        setSubmitting(false);
        return;
      }
      
      // Handle empty dates
      if (!projectData.startDate) {
        delete projectData.startDate;
      }
      
      if (!projectData.endDate) {
        delete projectData.endDate;
      }
      
      await axios.put(getApiUrl(`/api/projects/${currentProject.id}`), projectData);
      toast.success('Project updated successfully');
      setShowEditModal(false);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      const message = error.response?.data?.error || 
                     (error.response?.data?.details && error.response.data.details.length > 0 ? 
                      error.response.data.details[0].msg : 
                      'Failed to update project');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(getApiUrl(`/api/projects/${projectId}`));
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const openViewProject = (project) => {
    setCurrentProject(project);
    setShowViewModal(true);
  };

  const openEditProject = (project) => {
    setCurrentProject(project);
    setFormData({
      name: project.name || '',
      code: project.code || '',
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      teamId: project.teamId || (user?.role === 'team' ? user.id : '')
    });
    setShowEditModal(true);
  };

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(search.toLowerCase()) ||
    project.code?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTeamName = (teamId) => {
    if (!teamId) return 'No Team';
    const team = teams.find(t => t.id === parseInt(teamId));
    return team ? team.teamName : 'Unknown Team';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">Projects</p>
          <p className="text-neutral-500 text-sm font-normal leading-normal">Manage system projects and their configurations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-black text-neutral-50 gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4"
        >
          <Plus className="h-5 w-5" />
          <span className="truncate">New project</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 pl-10 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 px-4 py-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-[#141414]">No projects found</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {search ? 'Try adjusting your search.' : 'Get started by adding a new project.'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-[#141414]" />
                    <h3 className="text-lg font-medium text-[#141414]">{project.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      className="text-neutral-500 hover:text-[#141414] p-1"
                      onClick={() => openViewProject(project)}
                      title="View project"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="text-neutral-500 hover:text-[#141414] p-1"
                      onClick={() => openEditProject(project)}
                      title="Edit project"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-neutral-500 hover:text-red-600 p-1"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-neutral-500 mb-3">Code: {project.code}</p>
                
                {project.description && (
                  <p className="text-sm text-[#141414] mb-4 line-clamp-2">{project.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-neutral-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Start: {formatDate(project.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>End: {formatDate(project.endDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-500">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{project.ticketCount || 0} tickets</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-[480px] shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-[#141414]">Create New Project</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-500 hover:text-[#141414]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#141414] mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141414] mb-2">
                  Project Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141414] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="flex w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                />
              </div>

              {/* Only show team selection for admins and super admins */}
              {user?.role !== 'team' && (
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Team
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    <option value="">No Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Show team name for team managers */}
              {user?.role === 'team' && (
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Team
                  </label>
                  <div className="mt-1 p-2 bg-[#ededed] border border-[#dbdbdb] rounded-xl flex items-center">
                    <Building className="h-4 w-4 text-[#141414] mr-2" />
                    <span className="text-[#141414]">{user.teamName || 'Your Team'}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Modal */}
      {showViewModal && currentProject && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-[480px] shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-[#141414]">Project Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-neutral-500 hover:text-[#141414]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Project Name</h4>
                <p className="text-[#141414]">{currentProject.name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Project Code</h4>
                <p className="text-[#141414]">{currentProject.code}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Description</h4>
                <p className="text-[#141414]">{currentProject.description || 'No description provided'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Team</h4>
                <p className="text-[#141414]">{getTeamName(currentProject.teamId)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Start Date</h4>
                  <p className="text-[#141414]">{formatDate(currentProject.startDate)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">End Date</h4>
                  <p className="text-[#141414]">{formatDate(currentProject.endDate)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Status</h4>
                <p className="text-[#141414] capitalize">{currentProject.status || 'Active'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Tickets</h4>
                <p className="text-[#141414]">{currentProject.ticketCount || 0} tickets</p>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    openEditProject(currentProject);
                  }}
                  className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && currentProject && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-[480px] shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-[#141414]">Edit Project</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-neutral-500 hover:text-[#141414]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#141414] mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141414] mb-2">
                  Project Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141414] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="flex w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                />
              </div>

              {/* Only show team selection for admins and super admins */}
              {user?.role !== 'team' && (
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Team
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    <option value="">No Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Show team name for team managers */}
              {user?.role === 'team' && (
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Team
                  </label>
                  <div className="mt-1 p-2 bg-[#ededed] border border-[#dbdbdb] rounded-xl flex items-center">
                    <Building className="h-4 w-4 text-[#141414] mr-2" />
                    <span className="text-[#141414]">{user.teamName || 'Your Team'}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;