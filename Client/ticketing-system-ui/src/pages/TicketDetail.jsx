import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  XCircle,
  User,
  Edit,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    action: 'approve',
    priority: 'MEDIUM',
    expectedClosure: '',
    rejectionReason: ''
  });

  // Check if user is admin or super_admin
  const isAdminOrSuperAdmin = ['admin', 'super_admin'].includes(user?.role);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/tickets/${id}`);
      setTicket(response.data.ticket);
      
      // Initialize approval data with ticket values
      if (response.data.ticket) {
        setApprovalData({
          ...approvalData,
          priority: response.data.ticket.priority || 'MEDIUM',
          expectedClosure: response.data.ticket.expectedClosure || ''
        });
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to fetch ticket details');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setSubmitting(true);
      await axios.patch(`http://localhost:5000/api/tickets/${id}/status`, {
        status: newStatus
      });
      toast.success('Ticket status updated successfully');
      fetchTicket();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async () => {
    try {
      setSubmitting(true);
      
      const updateData = {
        status: approvalData.action === 'approve' ? 'APPROVED' : 'REJECTED'
      };

      if (approvalData.action === 'approve') {
        updateData.priority = approvalData.priority;
        if (approvalData.expectedClosure) {
          updateData.expectedClosure = approvalData.expectedClosure;
        }
      } else {
        updateData.rejectionReason = approvalData.rejectionReason;
      }

      await axios.put(`http://localhost:5000/api/tickets/${id}`, updateData);

      toast.success(`Ticket ${approvalData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowApprovalModal(false);
      fetchTicket();
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast.error('Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const openApprovalModal = (action) => {
    setApprovalData({
      ...approvalData,
      action,
      rejectionReason: ''
    });
    setShowApprovalModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-neutral-400" />
        <h3 className="mt-2 text-sm font-medium text-[#141414]">Ticket not found</h3>
        <p className="mt-1 text-sm text-neutral-500">The ticket you're looking for doesn't exist.</p>
      </div>
    );
  }

  const projectName = ticket.projectRef?.name || 'Project Alpha';

  return (
    <>
      {/* Breadcrumb - This will replace the one from Layout */}
      <div className="flex flex-wrap gap-2 p-4">
        <Link to="/projects" className="text-neutral-500 text-base font-medium leading-normal">Projects</Link>
        <span className="text-neutral-500 text-base font-medium leading-normal">/</span>
        <Link to={`/projects/${ticket.projectRef?.id || ''}`} className="text-neutral-500 text-base font-medium leading-normal">
          {projectName}
        </Link>
        <span className="text-neutral-500 text-base font-medium leading-normal">/</span>
        <span className="text-[#141414] text-base font-medium leading-normal">Ticket #{ticket.id}</span>
      </div>

      {/* Ticket Title */}
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex min-w-72 flex-col gap-3">
          <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">{ticket.title}</p>
          <p className="text-neutral-500 text-sm font-normal leading-normal">
            {projectName} | Ticket #{ticket.id}
          </p>
        </div>
      </div>

      <div className="gap-1 px-6 flex flex-1 justify-center">
        {/* Main Content - Left Side */}
        <div className="flex flex-col flex-1">
          {/* Details Section */}
          <h3 className="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">Details</h3>
          <div className="grid grid-cols-[20%_1fr] gap-x-6">
            <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
              <p className="text-neutral-500 text-sm font-normal leading-normal">Description</p>
              <p className="text-[#141414] text-sm font-normal leading-normal">{ticket.description}</p>
            </div>

            <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
              <p className="text-neutral-500 text-sm font-normal leading-normal">Priority</p>
              <p className="text-[#141414] text-sm font-normal leading-normal">
                {ticket.priority ? ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase() : 'Medium'}
              </p>
            </div>

            <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
              <p className="text-neutral-500 text-sm font-normal leading-normal">Status</p>
              <p className="text-[#141414] text-sm font-normal leading-normal">
                {ticket.status === 'PENDING_APPROVAL' ? 'To Do' :
                  ticket.status === 'APPROVED' ? 'Approved' :
                    ticket.status === 'IN_PROGRESS' ? 'In Progress' :
                      ticket.status === 'COMPLETED' ? 'Completed' :
                        ticket.status === 'REJECTED' ? 'Rejected' : 'To Do'}
              </p>
            </div>

            {ticket.type && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Type</p>
                <p className="text-[#141414] text-sm font-normal leading-normal">{ticket.type}</p>
              </div>
            )}

            {ticket.category && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Category</p>
                <p className="text-[#141414] text-sm font-normal leading-normal">{ticket.category}</p>
              </div>
            )}

            {ticket.department && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Department</p>
                <p className="text-[#141414] text-sm font-normal leading-normal">{ticket.department}</p>
              </div>
            )}

            <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
              <p className="text-neutral-500 text-sm font-normal leading-normal">Created On</p>
              <p className="text-[#141414] text-sm font-normal leading-normal">{formatFullDate(ticket.createdAt)}</p>
            </div>

            {ticket.dueDate && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Due Date</p>
                <p className="text-[#141414] text-sm font-normal leading-normal">{formatFullDate(ticket.dueDate)}</p>
              </div>
            )}

            {ticket.expectedClosure && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Expected Closure</p>
                <p className="text-[#141414] text-sm font-normal leading-normal">{formatFullDate(ticket.expectedClosure)}</p>
              </div>
            )}

            {ticket.team && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Team</p>
                <p className="text-[#141414] text-sm font-normal leading-normal">{ticket.team.teamName}</p>
              </div>
            )}
            
            {ticket.rejectionReason && (
              <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#dbdbdb] py-5">
                <p className="text-neutral-500 text-sm font-normal leading-normal">Rejection Reason</p>
                <p className="text-red-600 text-sm font-normal leading-normal">{ticket.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Assignee Section */}
          <h3 className="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Assignee</h3>
          <div className="flex items-center gap-4 bg-neutral-50 px-4 min-h-14">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-fit"
              style={{ backgroundImage: `url("https://i.pravatar.cc/300?u=${ticket.assignedUser?.id || '1'}")` }}
            ></div>
            <p className="text-[#141414] text-base font-normal leading-normal flex-1 truncate">
              {ticket.assignedUser?.name || 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Activity Log - Right Side */}
        <div className="layout-content-container flex flex-col w-[360px]">
          <h3 className="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Activity Log</h3>
          <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
            {/* Ticket Created */}
            <div className="flex flex-col items-center gap-1 pt-3">
              <div className="text-[#141414]">
                <FileText className="h-6 w-6" />
              </div>
              <div className="w-[1.5px] bg-[#dbdbdb] h-2 grow"></div>
            </div>
            <div className="flex flex-1 flex-col py-3">
              <p className="text-[#141414] text-base font-medium leading-normal">Ticket created</p>
              <p className="text-neutral-500 text-base font-normal leading-normal">
                {formatDate(ticket.createdAt)}
              </p>
              <p className="text-neutral-500 text-sm font-normal leading-normal">
                by {ticket.creator?.name || 'Unknown'}
              </p>
            </div>

            {/* Status Updated */}
            {ticket.status !== 'PENDING_APPROVAL' && (
              <>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[1.5px] bg-[#dbdbdb] h-2"></div>
                  <div className="text-[#141414]">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="w-[1.5px] bg-[#dbdbdb] h-2 grow"></div>
                </div>
                <div className="flex flex-1 flex-col py-3">
                  <p className="text-[#141414] text-base font-medium leading-normal">
                    Status updated to '{ticket.status === 'IN_PROGRESS' ? 'In Progress' :
                      ticket.status === 'COMPLETED' ? 'Completed' :
                        ticket.status === 'REJECTED' ? 'Rejected' :
                          ticket.status === 'APPROVED' ? 'Approved' : ticket.status}'
                  </p>
                  <p className="text-neutral-500 text-base font-normal leading-normal">
                    {formatDate(ticket.updatedAt)}
                  </p>
                  {ticket.approver && (
                    <p className="text-neutral-500 text-sm font-normal leading-normal">
                      by {ticket.approver.name}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Assigned To */}
            {ticket.assignedUser && (
              <>
                <div className="flex flex-col items-center gap-1 pb-3">
                  <div className="w-[1.5px] bg-[#dbdbdb] h-2"></div>
                  <div className="text-[#141414]">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col py-3">
                  <p className="text-[#141414] text-base font-medium leading-normal">
                    Assigned to {ticket.assignedUser.name}
                  </p>
                  <p className="text-neutral-500 text-base font-normal leading-normal">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </>
            )}
            
            {/* Actions - Moved below activity log */}
            <div className="col-span-2 border-t border-t-[#dbdbdb] mt-4 pt-4">
              {/* Admin/Super Admin Actions for Pending Approval tickets */}
              {isAdminOrSuperAdmin && ticket.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openApprovalModal('approve')}
                    disabled={submitting}
                    className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </button>
                  <button
                    onClick={() => openApprovalModal('reject')}
                    disabled={submitting}
                    className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}

              {/* Regular user actions for In Progress tickets */}
              {!isAdminOrSuperAdmin && ticket.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  disabled={submitting}
                  className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-neutral-50 text-sm font-medium w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </button>
              )}

              {/* Edit button for pending approval tickets */}
              {ticket.status === 'PENDING_APPROVAL' && (
                <button
                  onClick={() => navigate(`/tickets/${id}/edit`)}
                  className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium w-full mt-2"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                {approvalData.action === 'approve' ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mr-2" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {approvalData.action === 'approve' ? 'Accept Ticket' : 'Reject Ticket'}
                </h3>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {ticket.title}
                </h4>
                
                {approvalData.action === 'approve' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={approvalData.priority}
                        onChange={(e) => setApprovalData({...approvalData, priority: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Expected Closure Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={approvalData.expectedClosure}
                        onChange={(e) => setApprovalData({...approvalData, expectedClosure: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={approvalData.rejectionReason}
                      onChange={(e) => setApprovalData({...approvalData, rejectionReason: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Please provide a reason for rejection..."
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproval}
                  disabled={approvalData.action === 'reject' && !approvalData.rejectionReason}
                  className={`px-4 py-2 rounded-md ${
                    approvalData.action === 'approve' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } ${(approvalData.action === 'reject' && !approvalData.rejectionReason) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {approvalData.action === 'approve' ? 'Accept' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketDetail;