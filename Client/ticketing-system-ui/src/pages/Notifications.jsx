import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import {
  Bell,
  Ticket,
  Flag,
  Clock,
  MessageCircle,
  Calendar,
  Users,
  CheckCircle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

const Notifications = () => {
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    formatNotificationDate,
    unreadCount,
    pagination
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState(null);

  // Load notifications when page or page size changes
  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      await fetchNotifications(pageSize, currentPage);
    } catch (err) {
      setError('Failed to load notifications. Please try again later.');
      console.error('Error loading notifications:', err);
    }
  }, [fetchNotifications, pageSize, currentPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const getNotificationIcon = (type) => {
    const iconConfig = {
      'TICKET_CREATED': { icon: Ticket },
      'TICKET_ASSIGNED': { icon: Ticket },
      'TICKET_APPROVED': { icon: CheckCircle },
      'TICKET_COMPLETED': { icon: CheckCircle },
      'TICKET_STATUS_UPDATED': { icon: Clock },
      'TICKET_COMMENT': { icon: MessageCircle },
      'PRIORITY_CHANGED': { icon: Flag },
      'RESOURCE_REQUEST': { icon: Ticket },
      'PROJECT_UPDATE': { icon: Ticket },
      'DEADLINE_APPROACHING': { icon: Calendar },
      'REASSIGNED': { icon: Users },
      'MILESTONE_ADDED': { icon: Trophy },
      'SYSTEM_ANNOUNCEMENT': { icon: Bell },
      'default': { icon: Bell }
    };
    
    const config = iconConfig[type] || iconConfig.default;
    const Icon = config.icon;
    return <Icon className="h-6 w-6" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const readCount = notifications.filter(n => n.isRead).length;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <p className="text-[#141414] tracking-light text-[32px] font-bold leading-tight min-w-72">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center justify-center rounded-xl h-10 px-4 border border-[#dbdbdb] bg-white text-[#141414] gap-2 text-sm font-medium"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="px-4 py-3">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-[#141414]">Filter:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-xl ${
                filter === 'all'
                  ? 'bg-[#ededed] text-[#141414]'
                  : 'text-neutral-500 hover:text-[#141414]'
              }`}
            >
              All ({pagination.total || 0})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-xl ${
                filter === 'unread'
                  ? 'bg-[#ededed] text-[#141414]'
                  : 'text-neutral-500 hover:text-[#141414]'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 text-sm rounded-xl ${
                filter === 'read'
                  ? 'bg-[#ededed] text-[#141414]'
                  : 'text-neutral-500 hover:text-[#141414]'
              }`}
            >
              Read ({readCount})
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-center bg-red-50 text-red-600 border border-red-200 rounded-lg mx-4">
          <p>{error}</p>
          <button 
            onClick={loadNotifications}
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-4 text-center">
          <Bell className="h-12 w-12 text-neutral-400 mx-auto" />
          <p className="mt-2 text-sm text-neutral-500">
            {filter === 'all' 
              ? 'No notifications available' 
              : filter === 'unread' 
                ? 'No unread notifications' 
                : 'No read notifications'}
          </p>
        </div>
      ) : (
        <>
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between border-b border-[#dbdbdb] ${!notification.isRead ? 'bg-neutral-50' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className="flex items-center gap-4">
                <div className="text-[#141414] flex items-center justify-center rounded-lg bg-[#ededed] shrink-0 size-12">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex flex-col justify-center">
                  <p className={`text-[#141414] text-base ${!notification.isRead ? 'font-medium' : 'font-normal'} leading-normal line-clamp-1`}>
                    {notification.title}
                  </p>
                  <p className="text-neutral-500 text-sm font-normal leading-normal line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <p className="text-neutral-500 text-sm font-normal leading-normal">
                  {formatDate(notification.createdAt)}
                </p>
                <div className="flex gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                      className="text-[#141414] hover:text-black p-1 rounded-md hover:bg-[#ededed]"
                      title="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="text-[#141414] hover:text-red-600 p-1 rounded-md hover:bg-[#ededed]"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#dbdbdb]">
              <div className="flex items-center">
                <label className="text-sm text-neutral-500 mr-2">Items per page:</label>
                <select 
                  value={pageSize} 
                  onChange={handlePageSizeChange}
                  className="border border-[#dbdbdb] rounded-md text-sm p-1"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1 rounded-md ${currentPage === 1 ? 'text-neutral-300' : 'text-[#141414] hover:bg-[#ededed]'}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <span className="text-sm text-neutral-500">
                  Page {currentPage} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className={`p-1 rounded-md ${currentPage === pagination.pages ? 'text-neutral-300' : 'text-[#141414] hover:bg-[#ededed]'}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;