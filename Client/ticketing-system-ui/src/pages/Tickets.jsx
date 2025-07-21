import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Eye,
  Calendar,
  User,
  CheckCircle,
  List,
  LayoutGrid
} from 'lucide-react';

const Tickets = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [approvalData, setApprovalData] = useState({
    approved: true,
    priority: 'MEDIUM',
    expectedClosure: '',
    rejectionReason: ''
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Add user filter for non-admin users
      if (!isAdmin()) {
        params.append('userId', user.id);
      }

      const response = await axios.get(`http://localhost:5000/api/tickets?${params}`);
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleApproval = async () => {
    try {
      const data = {
        approved: approvalData.approved,
        priority: approvalData.priority,
        expectedClosure: approvalData.expectedClosure,
        rejectionReason: approvalData.rejectionReason
      };

      await axios.put(`http://localhost:5000/api/tickets/${selectedTicket.id}/approve`, data);

      toast.success(approvalData.approved ? 'Ticket approved successfully' : 'Ticket rejected');
      setShowApprovalModal(false);
      setSelectedTicket(null);
      setApprovalData({
        approved: true,
        priority: 'MEDIUM',
        expectedClosure: '',
        rejectionReason: ''
      });
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_APPROVAL': { class: 'bg-yellow-100 text-yellow-800', text: 'Pending Approval' },
      'APPROVED': { class: 'bg-green-100 text-green-800', text: 'Approved' },
      'IN_PROGRESS': { class: 'bg-blue-100 text-blue-800', text: 'In Progress' },
      'COMPLETED': { class: 'bg-green-100 text-green-800', text: 'Completed' },
      'REJECTED': { class: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>{config.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'LOW': { class: 'bg-green-100 text-green-800', text: 'Low' },
      'MEDIUM': { class: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      'HIGH': { class: 'bg-orange-100 text-orange-800', text: 'High' },
      'URGENT': { class: 'bg-red-100 text-red-800', text: 'Urgent' }
    };

    const config = priorityConfig[priority] || { class: 'bg-gray-100 text-gray-800', text: priority };
    return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canApproveTicket = (ticket) => {
    return isAdmin() && ticket.status === 'PENDING_APPROVAL';
  };

  const canCreateTicket = () => {
    return user?.role === 'user' || user?.role === 'team' || isAdmin();
  };

  return (
    <div>
      {/* Header with Project Title */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">Project Alpha</p>
          <p className="text-neutral-500 text-sm font-normal leading-normal">Manage all tickets related to Project Alpha</p>
        </div>
      </div>

      {/* View Controls and New Ticket Button */}
      <div className="flex justify-between gap-2 px-4 py-3">
        <div className="flex gap-2">
          <button className="p-2 text-[#141414]">
            <List className="h-6 w-6" />
          </button>
          <button className="p-2 text-[#141414]">
            <LayoutGrid className="h-6 w-6" />
          </button>
        </div>
        {canCreateTicket() && (
          <Link
            to="/tickets/create"
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-black text-neutral-50 gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4"
          >
            <Plus className="h-5 w-5" />
            <span className="truncate">New ticket</span>
          </Link>
        )}
      </div>

      {/* Tickets Table */}
      <div className="px-4 py-3 @container">
        <div className="flex overflow-hidden rounded-xl border border-[#dbdbdb] bg-neutral-50">
          {loading ? (
            <div className="flex items-center justify-center h-64 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 w-full">
              <h3 className="mt-2 text-sm font-medium text-[#141414]">No tickets found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {filters.search || filters.status || filters.priority ? 'Try adjusting your filters.' : 'Get started by creating a new ticket.'}
              </p>
            </div>
          ) : (
            <table className="flex-1 w-full">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="table-column-120 px-6 py-4 text-left text-[#141414] w-[35%] text-sm font-medium leading-normal">Title</th>
                  <th className="table-column-240 px-6 py-4 text-center text-[#141414] w-[20%] text-sm font-medium leading-normal">Priority</th>
                  <th className="table-column-360 px-6 py-4 text-center text-[#141414] w-[20%] text-sm font-medium leading-normal">Status</th>
                  <th className="table-column-480 px-6 py-4 text-left text-[#141414] w-[20%] text-sm font-medium leading-normal">Assignee</th>
                  <th className="table-column-600 px-6 py-4 text-center text-[#141414] w-[5%] text-sm font-medium leading-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={ticket.id} className="border-t border-t-[#dbdbdb]">
                    <td className="table-column-120 h-[72px] px-6 py-4 w-[35%] text-[#141414] text-sm font-normal leading-normal">
                      <Link to={`/tickets/${ticket.id}`} className="hover:underline">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="table-column-240 h-[72px] px-6 py-4 w-[20%] text-sm font-normal leading-normal text-center">
                      <div className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#ededed] text-[#141414] text-sm font-medium leading-normal w-full">
                        <span className="truncate">{ticket.priority ? ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase() : 'Medium'}</span>
                      </div>
                    </td>
                    <td className="table-column-360 h-[72px] px-6 py-4 w-[20%] text-sm font-normal leading-normal text-center">
                      <div className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#ededed] text-[#141414] text-sm font-medium leading-normal w-full">
                        <span className="truncate">
                          {ticket.status === 'PENDING_APPROVAL' ? 'To Do' :
                            ticket.status === 'APPROVED' ? 'Approved' :
                              ticket.status === 'IN_PROGRESS' ? 'In Progress' :
                                ticket.status === 'COMPLETED' ? 'Completed' :
                                  ticket.status === 'REJECTED' ? 'Rejected' : 'To Do'}
                        </span>
                      </div>
                    </td>
                    <td className="table-column-480 h-[72px] px-6 py-4 w-[20%] text-neutral-500 text-sm font-normal leading-normal">
                      {ticket.createdBy?.name || 'Unassigned'}
                    </td>
                    <td className="table-column-600 h-[72px] px-6 py-4 w-[5%] text-sm font-medium text-center">
                      <div className="flex items-center justify-center">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="p-2 text-[#141414] hover:bg-[#ededed] rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </div>
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
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

      {/* Approval Modal */}
      {showApprovalModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[480px] shadow-lg rounded-xl bg-white">
            <div className="mt-2">
              <h3 className="text-xl font-medium text-[#141414] mb-4">
                {approvalData.approved ? 'Approve' : 'Reject'} Ticket
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#141414] mb-2">
                    Action
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={approvalData.approved}
                        onChange={() => setApprovalData({ ...approvalData, approved: true })}
                        className="mr-2"
                      />
                      Approve
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!approvalData.approved}
                        onChange={() => setApprovalData({ ...approvalData, approved: false })}
                        className="mr-2"
                      />
                      Reject
                    </label>
                  </div>
                </div>

                {approvalData.approved && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#141414] mb-2">
                        Priority
                      </label>
                      <select
                        value={approvalData.priority}
                        onChange={(e) => setApprovalData({ ...approvalData, priority: e.target.value })}
                        className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141414] mb-2">
                        Expected Closure Date
                      </label>
                      <input
                        type="datetime-local"
                        value={approvalData.expectedClosure}
                        onChange={(e) => setApprovalData({ ...approvalData, expectedClosure: e.target.value })}
                        className="flex h-10 w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      />
                    </div>
                  </>
                )}

                {!approvalData.approved && (
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Rejection Reason
                    </label>
                    <textarea
                      value={approvalData.rejectionReason}
                      onChange={(e) => setApprovalData({ ...approvalData, rejectionReason: e.target.value })}
                      rows={3}
                      className="flex w-full rounded-xl border border-[#dbdbdb] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      placeholder="Provide a reason for rejection"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedTicket(null);
                      setApprovalData({
                        approved: true,
                        priority: 'MEDIUM',
                        expectedClosure: '',
                        rejectionReason: ''
                      });
                    }}
                    className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproval}
                    className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium"
                  >
                    {approvalData.approved ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets; 