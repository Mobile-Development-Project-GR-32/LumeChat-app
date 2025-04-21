import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationService } from '../services/notification.service';
import { useFocusEffect } from '@react-navigation/native';

const NotificationsScreen = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!user?._id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    console.log('Fetching notifications for user:', user._id);
    setLoading(true);
    
    try {
      // Get notifications from service
      const response = await notificationService.getNotifications(user._id);
      console.log('Notifications response:', response);
      
      // Process the response which could be in different formats
      let notificationsData = [];
      
      if (Array.isArray(response)) {
        // If the response is directly an array of notifications
        notificationsData = response;
      } else if (response && Array.isArray(response.notifications)) {
        // If the response has a notifications array property
        notificationsData = response.notifications;
      } else if (response && typeof response === 'object') {
        // If response is an object with various notification types
        const allNotifications = [];
        Object.keys(response).forEach(key => {
          if (Array.isArray(response[key])) {
            allNotifications.push(...response[key]);
          }
        });
        notificationsData = allNotifications;
      }
      
      console.log(`Processed ${notificationsData.length} notifications`);
      
      // Format notifications for display
      const formattedNotifications = notificationsData.map(notification => {
        // Check if the notification already has the required format
        if (notification.title && notification.message && notification.time) {
          return notification;
        }
        
        // Otherwise format it
        return {
          id: notification._id || notification.id || `temp-${Date.now()}-${Math.random()}`,
          title: notification.title || getDefaultTitle(notification.type),
          message: notification.content || notification.message || 'New notification',
          time: formatTime(notification.createdAt || notification.timestamp),
          type: notification.type || 'GENERAL',
          data: notification.data || {},
          read: notification.read || false
        };
      });
      
      setNotifications(formattedNotifications);
      
      // Reset badge count
      notificationService.resetBadgeCount();
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Helper function to get default title based on notification type
  const getDefaultTitle = (type) => {
    switch (type) {
      case 'DIRECT_MESSAGE': return 'New Message';
      case 'CHANNEL_ADDED': return 'Channel Update';
      case 'CHANNEL_INVITE': return 'Channel Invitation';
      case 'FRIEND_REQUEST': return 'Friend Request';
      case 'FRIEND_REQUEST_ACCEPTED': return 'Friend Request Accepted';
      default: return 'Notification';
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return notifTime.toLocaleDateString();
  };

  // Fetch notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      return () => {
        // Optional cleanup when screen loses focus
      };
    }, [fetchNotifications])
  );

  // Handle notification press
  const handleNotificationPress = (notification) => {
    console.log('Notification pressed:', notification);
    
    // Mark as read if we have an ID
    if (notification.id && user?._id) {
      notificationService.markAsRead(user._id, notification.id)
        .catch(err => console.error('Error marking notification as read:', err));
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'DIRECT_MESSAGE':
        navigation.navigate('DirectMessages', {
          userId: notification.data?.senderId,
          userName: notification.data?.senderName || 'User'
        });
        break;
        
      case 'CHANNEL_INVITE':
      case 'CHANNEL_ADDED':
        navigation.navigate('ChannelChat', {
          channel: {
            id: notification.data?.channelId,
            name: notification.data?.channelName || 'Channel'
          }
        });
        break;
        
      case 'FRIEND_REQUEST':
      case 'FRIEND_REQUEST_ACCEPTED':
        navigation.navigate('UserProfile', {
          userId: notification.data?.userId || notification.data?.senderId
        });
        break;
        
      default:
        Alert.alert('Notification', notification.message);
    }
  };

  // Handle dismissing a notification
  const handleDismiss = (notificationId) => {
    if (!user?._id) return;
    
    notificationService.deleteNotification(user._id, notificationId)
      .then(() => {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      })
      .catch(error => {
        console.error('Error dismissing notification:', error);
        // Remove from local state anyway for better UX
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      });
  };

  // Handle clearing all notifications
  const handleClearAll = () => {
    if (notifications.length === 0 || !user?._id) return;
    
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            notificationService.deleteAllNotifications(user._id)
              .then(() => {
                setNotifications([]);
              })
              .catch(error => {
                console.error('Error clearing notifications:', error);
                // Clear local state anyway for better UX
                setNotifications([]);
              });
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DIRECT_MESSAGE':
        return 'chat';
      case 'CHANNEL_INVITE':
      case 'CHANNEL_ADDED':
        return 'group';
      case 'FRIEND_REQUEST':
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'person-add';
      case 'CHANNEL_ADMIN_PROMOTED':
        return 'star';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'DIRECT_MESSAGE':
        return '#7289DA';
      case 'CHANNEL_INVITE':
      case 'CHANNEL_ADDED':
        return '#43B581';
      case 'FRIEND_REQUEST':
        return '#FAA61A';
      case 'FRIEND_REQUEST_ACCEPTED':
        return '#43B581';
      case 'CHANNEL_ADMIN_PROMOTED':
        return '#F04747';
      default:
        return '#747F8D';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7289DA" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2F3136', '#202225']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <MaterialIcons name="clear-all" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#F04747" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={80} color="#72767D" />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>When you get notifications, they'll show up here</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.notificationsList}>
          {/* Debug info - remove in production */}
          <Text style={styles.debugText}>{notifications.length} notifications found</Text>
          
          {notifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationItem}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(notification.type) }
              ]}>
                <MaterialIcons 
                  name={getNotificationIcon(notification.type)} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(notification.id)}
              >
                <MaterialIcons name="close" size={20} color="#B9BBBE" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#7289DA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#B9BBBE',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#2F3136',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#B9BBBE',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#72767D',
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  debugText: {
    color: '#43B581',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
