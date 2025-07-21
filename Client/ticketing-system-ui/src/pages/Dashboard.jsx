import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Ticket,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    completedTickets: 0,
    myTickets: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await axios.get('http://localhost:5000/api/tickets/stats');
      setStats(statsResponse.data);

      // Fetch recent tickets
      const ticketsResponse = await axios.get('http://localhost:5000/api/tickets?limit=5&sort=createdAt&order=desc');
      setRecentTickets(ticketsResponse.data.tickets);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_APPROVAL': { class: 'badge-warning', text: 'Pending' },
      'IN_PROGRESS': { class: 'badge-info', text: 'In Progress' },
      'COMPLETED': { class: 'badge-success', text: 'Completed' },
      'REJECTED': { class: 'badge-error', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || { class: 'badge-info', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'LOW': { class: 'bg-green-100 text-green-800', text: 'Low' },
      'MEDIUM': { class: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      'HIGH': { class: 'bg-red-100 text-red-800', text: 'High' },
      'URGENT': { class: 'bg-purple-100 text-purple-800', text: 'Urgent' }
    };
    
    const config = priorityConfig[priority] || { class: 'bg-gray-100 text-gray-800', text: priority };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight">Dashboard</p>
        <p className="text-neutral-500 text-sm font-normal leading-normal">
          Welcome back, {user?.name || user?.username || user?.teamName}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 px-4 py-3">
        <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Ticket className="h-8 w-8 text-[#141414]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Total Tickets
                </dt>
                <dd className="text-lg font-medium text-[#141414]">
                  {stats.totalTickets}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-[#141414]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Pending Tickets
                </dt>
                <dd className="text-lg font-medium text-[#141414]">
                  {stats.pendingTickets}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-[#141414]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Completed Tickets
                </dt>
                <dd className="text-lg font-medium text-[#141414]">
                  {stats.completedTickets}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-[#141414]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  My Tickets
                </dt>
                <dd className="text-lg font-medium text-[#141414]">
                  {stats.myTickets}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden mx-4 my-3">
        <div className="p-4 border-b border-[#dbdbdb]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#141414]">Recent Tickets</h3>
            <a
              href="/tickets"
              className="text-sm font-medium text-[#141414] hover:text-black"
            >
              View all
            </a>
          </div>
        </div>
        <div className="p-4">
          {recentTickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-[#141414]">No tickets</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Get started by creating a new ticket.
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-[#dbdbdb]">
                {recentTickets.map((ticket) => (
                  <li key={ticket.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-[#ededed] flex items-center justify-center">
                          <Ticket className="h-4 w-4 text-[#141414]" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#141414] truncate">
                          {ticket.taskName}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="flex min-w-[84px] max-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-6 px-2 bg-[#ededed] text-[#141414] text-xs font-medium">
                          <span className="truncate">
                            {ticket.status === 'PENDING_APPROVAL' ? 'Pending' : 
                             ticket.status === 'IN_PROGRESS' ? 'In Progress' :
                             ticket.status === 'COMPLETED' ? 'Completed' :
                             ticket.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                          </span>
                        </span>
                        <span className="flex min-w-[84px] max-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-6 px-2 bg-[#ededed] text-[#141414] text-xs font-medium">
                          <span className="truncate">{ticket.priority || 'Medium'}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[#dbdbdb] bg-neutral-50 overflow-hidden mx-4 my-3">
        <div className="p-4 border-b border-[#dbdbdb]">
          <h3 className="text-lg font-medium text-[#141414]">Quick Actions</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/tickets/create"
              className="relative rounded-xl border border-[#dbdbdb] bg-white px-6 py-5 flex items-center space-x-3 hover:border-[#c0c0c0] hover:bg-[#f9f9f9] transition-colors"
            >
              <div className="flex-shrink-0">
                <Ticket className="h-6 w-6 text-[#141414]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-[#141414]">Create Ticket</p>
                <p className="text-sm text-neutral-500">Submit a new ticket</p>
              </div>
            </a>

            <a
              href="/tickets"
              className="relative rounded-xl border border-[#dbdbdb] bg-white px-6 py-5 flex items-center space-x-3 hover:border-[#c0c0c0] hover:bg-[#f9f9f9] transition-colors"
            >
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-[#141414]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-[#141414]">View Tickets</p>
                <p className="text-sm text-neutral-500">Browse all tickets</p>
              </div>
            </a>

            <a
              href="/notifications"
              className="relative rounded-xl border border-[#dbdbdb] bg-white px-6 py-5 flex items-center space-x-3 hover:border-[#c0c0c0] hover:bg-[#f9f9f9] transition-colors"
            >
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-[#141414]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-[#141414]">Notifications</p>
                <p className="text-sm text-neutral-500">Check updates</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 