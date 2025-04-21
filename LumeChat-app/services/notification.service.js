import apiConfig from '../config/api.config';
import { Alert, Platform } from 'react-native';

const API_URL = apiConfig.API_URL;

// Store for notification listeners
const listeners = {
  notification: []
};

// Track notification counts
let unreadCount = 0;

export const notificationService = {
  getHeaders: (userId) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'user-id': userId
  }),
  
  /**
   * Initialize notification system
   * @returns {boolean} Whether initialization was successful
   */
  initialize: () => {
    console.log('Simple notification service initialized');
    unreadCount = 0;
    return true;
  },
  
  /**
   * Get all notifications
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications data
   */
  getNotifications: async (userId, options = {}) => {
    try {
      const { limit = 50, unreadOnly = false } = options;
      const queryParams = new URLSearchParams({
        limit,
        unreadOnly
      }).toString();
      
      const response = await fetch(`${API_URL}/notifications?${queryParams}`, {
        headers: notificationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch notifications');
      }
      
      return response.json();
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },
  
  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unread count data
   */
  getUnreadCount: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: notificationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch unread count');
      }
      
      return response.json();
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  },
  
  /**
   * Mark notification as read
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Result
   */
  markAsRead: async (userId, notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: notificationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark notification as read');
      }
      
      return response.json();
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  markAllAsRead: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: notificationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark all notifications as read');
      }
      
      return response.json();
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  },
  
  /**
   * Delete notification
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Result
   */
  deleteNotification: async (userId, notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: notificationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete notification');
      }
      
      return response.json();
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },
  
  /**
   * Delete all notifications
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  deleteAllNotifications: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: notificationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete all notifications');
      }
      
      return response.json();
    } catch (error) {
      console.error('Delete all notifications error:', error);
      throw error;
    }
  },
  
  /**
   * Format notification for display
   * @param {Object} notification - Notification object
   * @returns {Object} Formatted notification
   */
  formatForDisplay: (notification) => {
    const { type, data, createdAt } = notification;
    
    // Format time
    const formattedTime = notificationService.formatTime(createdAt);
    
    // Format message based on type
    let message = '';
    let title = '';
    
    switch (type) {
      case 'FRIEND_REQUEST':
        title = 'Friend Request';
        message = `You received a friend request`;
        break;
      case 'FRIEND_REQUEST_ACCEPTED':
        title = 'Friend Request Accepted';
        message = `Your friend request was accepted`;
        break;
      case 'CHANNEL_ADDED':
        title = 'Added to Channel';
        message = `You were added to ${data.channelName || 'a channel'}`;
        break;
      case 'CHANNEL_INVITE':
        title = 'Channel Invitation';
        message = `You were invited to join ${data.channelName || 'a channel'}`;
        break;
      case 'CHANNEL_ADMIN_PROMOTED':
        title = 'Channel Admin';
        message = `You are now an admin of ${data.channelName || 'a channel'}`;
        break;
      case 'DIRECT_MESSAGE':
        title = 'New Message';
        message = `You received a new message from ${data.senderName || 'someone'}`;
        break;
      default:
        title = 'Notification';
        message = 'You have a new notification';
    }
    
    return {
      ...notification,
      title,
      message,
      time: formattedTime,
      data
    };
  },
  
  /**
   * Format time for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  formatTime: (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  },
  
  /**
   * Show a message notification
   * @param {Object} message - Message data
   * @param {string} channelName - Channel name (optional)
   * @returns {string} Notification ID
   */
  showMessageNotification: (message, channelName = null) => {
    try {
      // Increment unread count
      unreadCount++;
      
      // Create notification data
      let title, body;
      
      if (channelName) {
        title = `New message in #${channelName}`;
        body = `${message.senderName}: ${message.content}`;
      } else {
        title = `${message.senderName}`;
        body = message.content;
      }
      
      const notification = {
        id: `notification-${Date.now()}`,
        title,
        body,
        data: {
          type: 'message',
          messageData: message,
          channelName
        },
        timestamp: new Date()
      };
      
      // If the app is in foreground, show an alert
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          Alert.alert(
            notification.title,
            notification.body,
            [{ text: 'OK' }],
            { cancelable: true }
          );
        }, 300);
      }
      
      // Notify listeners
      listeners.notification.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
      
      return notification.id;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  },
  
  /**
   * Add a notification listener
   * @param {Function} callback - Function to call when notification is received
   * @returns {Function} Function to remove the listener
   */
  addNotificationListener: (callback) => {
    listeners.notification.push(callback);
    
    return () => {
      const index = listeners.notification.indexOf(callback);
      if (index > -1) {
        listeners.notification.splice(index, 1);
      }
    };
  },
  
  /**
   * Get the current badge count
   * @returns {number} Badge count
   */
  getBadgeCount: () => {
    return unreadCount;
  },
  
  /**
   * Reset the badge count
   */
  resetBadgeCount: () => {
    unreadCount = 0;
  }
};

export default notificationService;
