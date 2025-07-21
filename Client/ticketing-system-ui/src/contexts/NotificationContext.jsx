import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Fetch notifications from the backend
  const fetchNotifications = useCallback(async (limit = 10, page = 1) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Call the backend API to get notifications
      const response = await axios.get(`http://localhost:5000/api/notifications`, {
        params: { limit, page },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { notifications: fetchedNotifications, pagination: paginationData } = response.data;
      
      setNotifications(fetchedNotifications || []);
      setPagination(paginationData || {
        page,
        limit,
        total: fetchedNotifications?.length || 0,
        pages: Math.ceil((fetchedNotifications?.length || 0) / limit)
      });
      
      // Update unread count
      const unreadNotifications = fetchedNotifications?.filter(n => !n.isRead) || [];
      setUnreadCount(unreadNotifications.length);
      
      setLastFetched(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show toast for errors in the context to avoid duplicate toasts
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      // Fetch notifications immediately
      fetchNotifications(10, 1);
      
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    }
  }, [user, fetchNotifications]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      // Call the backend API to get unread count
      const response = await axios.get(`http://localhost:5000/api/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Call the backend API to mark notification as read
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Call the backend API to mark all notifications as read
      await axios.put(`http://localhost:5000/api/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // Call the backend API to delete notification
      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        pages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit)
      }));
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  const formatNotificationDate = useCallback((dateString) => {
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);
  
  // Handle API errors gracefully
  const handleApiError = useCallback((error, message) => {
    console.error(`${message}:`, error);
    // If the error is due to authentication, we might want to redirect to login
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    lastFetched,
    pagination,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatNotificationDate
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};