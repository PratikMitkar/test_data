import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import toast from 'react-hot-toast';
import {
  Search,
  Eye,
  Calendar,
  User,
  List,
  LayoutGrid,
  Users
} from 'lucide-react';

const AssignedTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  useEffect(() => {
    fetchAssignedTickets();
  }, [filters]);

  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(getApiUrl(`/api/tickets/assigned?${params}`));
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching assigned tickets:', error);
      toast.error('Failed to fetch assigned tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_APPROVAL': { class: 'badge-warning', text: 'Pending' },
      'APPROVED': { class: 'badge-info', text: 'Approved' },
      'IN_PROGRESS': { class: 'badge-primary', text: 'In Progress' },
      'COMPLETED': { class: 'badge-success', text: 'Completed' },
      'REJECTED': { class: 'badge-error', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || { class: 'badge-info', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'LOW': { class: 'badge-success', text: 'Low' },
      'MEDIUM': { class: 'badge-warning', text: 'Medium' },
      'HIGH': { class: 'badge-error', text: 'High' },
      'URGENT': { class: 'badge-error', text: 'Urgent' }
    };
    
    const config = priorityConfig[priority] || { class: 'badge-info', text: priority };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getTicketTypeIcon = (type) => {
    const iconConfig = {
      'bug': '🐛',
      'feature': '✨',
      'task': '📋',
      'improvement': '🚀',
      'support': '🆘',
      'requirement': '📝'
    };
    return iconConfig[type] || '📄';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">
              Tickets Assigned to Me
            </h1>
            <p className="text-neutral-500 text-sm font-normal leading-normal">
              Tickets assigned to you by other teams and users
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-black text-white' : 'bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-100'}`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#dbdbdb] mx-4 mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({ status: '', priority: '', search: '', page: 1, limit: 10 })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-[#141414]">No assigned tickets</h3>
            <p className="mt-1 text-sm text-neutral-500">
              You don't have any tickets assigned to you by other teams or users.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl border border-[#dbdbdb] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-6 py-4 text-left text-[#141414] text-sm font-medium">Title</th>
                  <th className="px-6 py-4 text-center text-[#141414] text-sm font-medium">From Team</th>
                  <th className="px-6 py-4 text-center text-[#141414] text-sm font-medium">Priority</th>
                  <th className="px-6 py-4 text-center text-[#141414] text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-center text-[#141414] text-sm font-medium">Due Date</th>
                  <th className="px-6 py-4 text-center text-[#141414] text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-t-[#dbdbdb] hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTicketTypeIcon(ticket.type)}</span>
                        <div>
                          <Link to={`/tickets/${ticket.id}`} className="font-medium text-[#141414] hover:underline">
                            {ticket.title}
                          </Link>
                          <p className="text-sm text-gray-500">{ticket.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{ticket.creatorTeam?.teamName || 'Unknown Team'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {formatDate(ticket.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl border border-[#dbdbdb] p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTicketTypeIcon(ticket.type)}</span>
                    <div>
                      <h3 className="font-medium text-[#141414]">{ticket.title}</h3>
                      <p className="text-sm text-gray-500">{ticket.category}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      From: {ticket.creatorTeam?.teamName || 'Unknown Team'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Due: {formatDate(ticket.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                </div>

                <Link
                  to={`/tickets/${ticket.id}`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-xl border border-[#dbdbdb]">
            <div className="text-sm text-neutral-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center justify-center rounded-xl h-8 px-3 border border-[#dbdbdb] bg-neutral-50 text-[#141414] text-sm font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center justify-center rounded-xl h-8 px-3 border border-[#dbdbdb] bg-neutral-50 text-[#141414] text-sm font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTickets; 