import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import {
  Bell,
  Check,
  X,
  Ticket,
  Flag,
  Clock,
  MessageCircle,
  Calendar,
  Users,
  CheckCircle,
  Trophy,
  AlertCircle
} from 'lucide-react';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch notifications when dropdown is opened
  const loadNotifications = useCallback(async () => {
    if (!isOpen || hasLoaded) return;
    
    try {
      setError(null);
      // Only fetch 5 most recent notifications for the bell dropdown
      await fetchNotifications(5, 1);
      setHasLoaded(true);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    }
  }, [isOpen, fetchNotifications, hasLoaded]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reset hasLoaded when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setHasLoaded(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    e.preventDefault();
    markAsRead(notificationId);
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    e.preventDefault();
    deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setHasLoaded(false);
    loadNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-[#ededed] text-[#141414] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
      >
        <div className="text-[#141414]">
          <Bell className="h-5 w-5" />
        </div>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg z-50 border border-[#dbdbdb] overflow-hidden max-w-[calc(100vw-2rem)]">
          <div className="p-3 border-b border-[#dbdbdb] flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#141414]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#141414] hover:text-black flex items-center"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-sm text-neutral-500">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="mt-2 text-sm text-neutral-500">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="mt-2 text-sm text-[#141414] underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <Bell className="h-8 w-8 text-neutral-400 mx-auto" />
                <p className="mt-2 text-sm text-neutral-500">No notifications available</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div key={notification.id} className="relative group">
                    <Link
                      to={notification.ticketId ? `/tickets/${notification.ticketId}` : '/notifications'}
                      className={`block hover:bg-[#f5f5f5] ${!notification.isRead ? 'bg-neutral-50' : ''}`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-4 px-4 min-h-[72px] py-2">
                        <div className="text-[#141414] flex items-center justify-center rounded-lg bg-[#ededed] shrink-0 size-12">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`text-[#141414] text-base ${!notification.isRead ? 'font-medium' : 'font-normal'} leading-normal line-clamp-1`}>
                                {notification.title}
                              </p>
                              <p className="text-neutral-500 text-sm font-normal leading-normal line-clamp-2 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-neutral-500 text-sm font-normal leading-normal whitespace-nowrap">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Action buttons that appear on hover */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white rounded-md shadow-sm p-1">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          className="text-[#141414] hover:text-black p-1 rounded-md hover:bg-[#ededed]"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="text-[#141414] hover:text-red-600 p-1 rounded-md hover:bg-[#ededed]"
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="p-3 text-center border-t border-[#dbdbdb]">
                  <Link
                    to="/notifications"
                    className="text-sm text-[#141414] hover:text-black"
                    onClick={() => setIsOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;