import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  AlertTriangle,
  MessageSquare,
  Filter,
  Search,
  Ticket,
  Flag,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config/api';

const TicketApproval = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    action: 'approve',
    priority: 'MEDIUM',
    expectedClosure: '',
    rejectionReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING_APPROVAL');

  // Only admin and super admin can access this page
  if (!['admin', 'super_admin'].includes(user?.role)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-[#141414]">Access Denied</h3>
        <p className="mt-1 text-sm text-neutral-500">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(getApiUrl(`/api/tickets?status=${filterStatus}&limit=50`));
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedTicket) return;

    try {
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

      await axios.put(getApiUrl(`/api/tickets/${selectedTicket.id}`), updateData);

      toast.success(`Ticket ${approvalData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      
      // Update the ticket in the list
      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, ...updateData }
          : ticket
      ));

      setShowApprovalModal(false);
      setSelectedTicket(null);
      setApprovalData({
        action: 'approve',
        priority: 'MEDIUM',
        expectedClosure: '',
        rejectionReason: ''
      });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  const openApprovalModal = (ticket, action) => {
    setSelectedTicket(ticket);
    setApprovalData({
      action,
      priority: ticket.priority || 'MEDIUM',
      expectedClosure: ticket.expectedClosure || '',
      rejectionReason: ''
    });
    setShowApprovalModal(true);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.creator?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'bg-[#FEF9C3] text-[#854D0E]'; // Yellow
      case 'APPROVED':
        return 'bg-[#DCFCE7] text-[#166534]'; // Green
      case 'REJECTED':
        return 'bg-[#FEE2E2] text-[#991B1B]'; // Red
      case 'IN_PROGRESS':
        return 'bg-[#DBEAFE] text-[#1E40AF]'; // Blue
      case 'COMPLETED':
        return 'bg-[#F3F4F6] text-[#1F2937]'; // Gray
      default:
        return 'bg-[#F3F4F6] text-[#1F2937]'; // Gray
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'text-[#166534]'; // Green
      case 'MEDIUM':
        return 'text-[#854D0E]'; // Yellow
      case 'HIGH':
        return 'text-[#C2410C]'; // Orange
      case 'URGENT':
        return 'text-[#991B1B]'; // Red
      default:
        return 'text-[#6B7280]'; // Gray
    }
  };

  const getTicketTypeIcon = (type) => {
    const iconConfig = {
      'BUG': { icon: AlertCircle, color: 'text-[#991B1B]' },
      'FEATURE': { icon: Flag, color: 'text-[#1E40AF]' },
      'TASK': { icon: Ticket, color: 'text-[#166534]' },
      'default': { icon: Ticket, color: 'text-[#6B7280]' }
    };
    
    const config = iconConfig[type] || iconConfig.default;
    const Icon = config.icon;
    return <Icon className={`h-6 w-6 ${config.color}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight min-w-72">Ticket Approval</p>
        <p className="text-neutral-500 text-sm font-normal leading-normal">
          Review and approve or reject submitted tickets
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-[#dbdbdb] p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#dbdbdb] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-neutral-400" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#dbdbdb] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
              >
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="">All Tickets</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-[#dbdbdb] overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-[#141414]">No tickets found</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No tickets match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#dbdbdb]">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-neutral-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg bg-[#ededed] shrink-0 size-12">
                        {getTicketTypeIcon(ticket.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-[#141414]">
                            {ticket.title}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          {ticket.priority && (
                            <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          )}
                        </div>
                        
                        <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-6 text-sm text-neutral-500 ml-16">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Created by: {ticket.creator?.name || 'Unknown'}</span>
                      </div>
                      {ticket.dueDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {ticket.rejectionReason && (
                      <div className="mt-3 p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl ml-16">
                        <div className="flex">
                          <XCircle className="h-5 w-5 text-[#991B1B] mr-2 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-[#991B1B]">Rejection Reason</h4>
                            <p className="text-sm text-[#B91C1C] mt-1">{ticket.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {ticket.status === 'PENDING_APPROVAL' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openApprovalModal(ticket, 'approve')}
                        className="flex items-center justify-center rounded-xl h-10 px-4 bg-black text-white text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => openApprovalModal(ticket, 'reject')}
                        className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                {approvalData.action === 'approve' ? (
                  <CheckCircle className="h-6 w-6 text-[#166534] mr-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-[#991B1B] mr-2" />
                )}
                <h3 className="text-lg font-medium text-[#141414]">
                  {approvalData.action === 'approve' ? 'Accept Ticket' : 'Reject Ticket'}
                </h3>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-[#141414] mb-2">
                  {selectedTicket.title}
                </h4>
                
                {approvalData.action === 'approve' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#141414]">
                        Priority
                      </label>
                      <select
                        value={approvalData.priority}
                        onChange={(e) => setApprovalData({...approvalData, priority: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-[#dbdbdb] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#141414]">
                        Expected Closure Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={approvalData.expectedClosure}
                        onChange={(e) => setApprovalData({...approvalData, expectedClosure: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border border-[#dbdbdb] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[#141414]">
                      Rejection Reason <span className="text-[#991B1B]">*</span>
                    </label>
                    <textarea
                      value={approvalData.rejectionReason}
                      onChange={(e) => setApprovalData({...approvalData, rejectionReason: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-[#dbdbdb] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      rows={3}
                      placeholder="Please provide a reason for rejection..."
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproval}
                  disabled={approvalData.action === 'reject' && !approvalData.rejectionReason}
                  className={`flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium ${
                    approvalData.action === 'approve' 
                      ? 'bg-black text-white' 
                      : 'bg-[#991B1B] text-white'
                  } ${(approvalData.action === 'reject' && !approvalData.rejectionReason) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {approvalData.action === 'approve' ? 'Accept' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketApproval;