import apiConfig from '../config/api.config';
import { notificationService } from './notification.service';

const API_URL = apiConfig.API_URL;

export const messageService = {
  getHeaders: (userId) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'user-id': userId
  }),

  //
  // DIRECT MESSAGES (User-to-User)
  //

  // Get all user chats (conversations)
  getUserChats: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/messages/chats`, {
        headers: messageService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user chats');
      }
      
      return response.json();
    } catch (error) {
      console.error('Get user chats error:', error);
      throw error;
    }
  },
  
  // Send a direct message to another user
  sendDirectMessage: async (userId, targetUserId, content) => {
    try {
      console.log(`Sending direct message to ${targetUserId}: ${content.substring(0, 20)}...`);
      
      const response = await fetch(`${API_URL}/messages/direct/${targetUserId}`, {
        method: 'POST',
        headers: messageService.getHeaders(userId),
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      
      const result = await response.json();
      console.log('Message sent successfully', result);
      return result;
    } catch (error) {
      console.error('Send direct message error:', error);
      throw error;
    }
  },
  
  // Get direct messages with another user
  getDirectMessages: async (userId, targetUserId, limit = 50, before = null) => {
    try {
      let url = `${API_URL}/messages/direct/${targetUserId}?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }
      
      console.log(`Fetching direct messages with ${targetUserId}`);
      
      const response = await fetch(url, {
        headers: messageService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch direct messages');
      }
      
      const result = await response.json();
      console.log(`Fetched ${result.messages?.length || 0} direct messages`);
      return result;
    } catch (error) {
      console.error('Get direct messages error:', error);
      throw error;
    }
  },
  
  // Delete a direct message
  deleteDirectMessage: async (userId, targetUserId, messageId) => {
    try {
      const response = await fetch(`${API_URL}/messages/direct/${targetUserId}/${messageId}`, {
        method: 'DELETE',
        headers: messageService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
      
      return response.json();
    } catch (error) {
      console.error('Delete direct message error:', error);
      throw error;
    }
  },

  //
  // CHANNEL MESSAGES
  //

  // Post a message to a channel
  postChannelMessage: async (userId, channelId, content) => {
    try {
      console.log(`Posting message to channel ${channelId}: ${content.substring(0, 20)}...`);
      
      const response = await fetch(`${API_URL}/messages/channels/${channelId}`, {
        method: 'POST',
        headers: messageService.getHeaders(userId),
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post message');
      }
      
      const result = await response.json();
      console.log('Channel message posted successfully', result);
      return result;
    } catch (error) {
      console.error('Post channel message error:', error);
      throw error;
    }
  },
  
  // Get messages from a channel with pagination
  getChannelMessages: async (userId, channelId, limit = 50, before = null) => {
    try {
      // Check if the channel is known to be deleted
      const channelService = require('./channel.service').default;
      if (channelService.isChannelDeleted(channelId)) {
        throw new Error('Channel not found or was deleted');
      }
      
      let url = `${API_URL}/messages/channels/${channelId}?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }
      
      const response = await fetch(url, {
        headers: messageService.getHeaders(userId)
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch channel messages: ${response.status}`;
        
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          // Use default error message
        }
        
        // If channel not found, mark it as deleted
        if (response.status === 404 || errorMessage.includes('not found')) {
          channelService.markChannelAsDeleted(channelId);
          throw new Error('Channel not found or was deleted');
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a channel message
  deleteChannelMessage: async (userId, channelId, messageId) => {
    try {
      const response = await fetch(`${API_URL}/messages/channels/${channelId}/${messageId}`, {
        method: 'DELETE',
        headers: messageService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
      
      return response.json();
    } catch (error) {
      console.error('Delete channel message error:', error);
      throw error;
    }
  },

  //
  // UTILITY FUNCTIONS
  //

  // Format timestamp to readable format
  formatTimestamp: (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  },
  
  // Get total unread messages count across all chats
  getTotalUnreadCount: (chats) => {
    if (!chats || !Array.isArray(chats)) return 0;
    return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  },
  
  // Prepare message data for UI display (compatible with react-native-gifted-chat)
  formatForGiftedChat: (messages, currentUserId) => {
    if (!messages || !Array.isArray(messages)) return [];
    
    return messages.map(message => ({
      _id: message.id,
      text: message.content,
      createdAt: new Date(message.timestamp),
      user: {
        _id: message.senderId,
        name: message.senderName,
        avatar: message.senderPhoto || undefined
      },
      // Additional metadata
      sent: true,
      received: true,
      pending: false,
      isRead: message.readBy ? !!message.readBy[currentUserId] : false
    }));
  },
  
  // Convert messages to a simple format
  formatMessageForUI: (message, currentUserId) => {
    return {
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      formattedTime: messageService.formatTimestamp(message.timestamp),
      senderId: message.senderId,
      senderName: message.senderName,
      senderPhoto: message.senderPhoto,
      isCurrentUser: message.senderId === currentUserId,
      isRead: message.readBy ? !!message.readBy[currentUserId] : false
    };
  },
  
  // Create a real-time listener for messages in a channel
  createChannelMessagesListener: (channelId, callback) => {
    console.log('Setting up API-based polling for channel messages:', channelId);
    
    // First check if the channel is already known to be deleted
    try {
      const channelService = require('./channel.service').default;
      if (channelService.isChannelDeleted(channelId)) {
        console.log(`Not starting polling for already deleted channel: ${channelId}`);
        return () => {}; // Return empty cleanup function
      }
    } catch (error) {
      console.warn('Error checking if channel is deleted:', error);
    }
    
    // Initialize the active polling map if it doesn't exist
    if (!messageService.activePolling) {
      messageService.activePolling = new Map();
    }
    
    // First check if we're already polling for this channel
    if (messageService.activePolling.has(channelId)) {
      console.log(`Cleaning up existing polling for channel ${channelId}`);
      clearInterval(messageService.activePolling.get(channelId));
    }
    
    let lastMessageTimestamp = Date.now();
    let consecutiveErrorCount = 0;
    const MAX_ERRORS = 2; // Reduce tolerance for errors - stop polling faster
    
    // Set up interval to poll for new messages
    const intervalId = setInterval(async () => {
      try {
        const userId = callback.userId;
        if (!userId) {
          console.warn('Missing userId for message polling');
          clearInterval(intervalId);
          messageService.activePolling.delete(channelId);
          return;
        }
        
        // Double-check if channel has been deleted before each polling attempt
        try {
          const channelService = require('./channel.service').default;
          if (channelService.isChannelDeleted(channelId)) {
            console.log(`Stopping polling for deleted channel: ${channelId}`);
            clearInterval(intervalId);
            messageService.activePolling.delete(channelId);
            return;
          }
        } catch (checkError) {
          console.warn('Error checking channel deletion status:', checkError);
        }
        
        // First verify channel exists and user has access - with throttling check
        try {
          const channelService = require('./channel.service').default;
          await channelService.getChannelDetails(userId, channelId);
          // Reset error count on success
          consecutiveErrorCount = 0;
        } catch (channelError) {
          if (channelError.message && (
              channelError.message.includes('not found') || 
              channelError.message.includes('deleted')
          )) {
            console.log(`Channel ${channelId} no longer exists, stopping polling`);
            clearInterval(intervalId);
            messageService.activePolling.delete(channelId);
            
            // Mark channel as deleted to prevent future attempts
            try {
              const channelService = require('./channel.service').default;
              channelService.markChannelAsDeleted(channelId);
            } catch (markError) {
              console.warn('Failed to mark channel as deleted:', markError);
            }
            return;
          }
          
          // For other errors, incrementally back off but continue
          consecutiveErrorCount++;
          if (consecutiveErrorCount > MAX_ERRORS) {
            console.log(`Too many errors polling channel ${channelId}, stopping`);
            clearInterval(intervalId);
            messageService.activePolling.delete(channelId);
            return;
          }
        }
        
        // Get messages since last check
        try {
          const response = await messageService.getChannelMessages(
            userId, 
            channelId,
            10,
            null
          );
          
          // Reset error count on success
          consecutiveErrorCount = 0;
          
          if (response && response.messages) {
            // Find messages newer than our last check
            const newMessages = response.messages.filter(msg => 
              new Date(msg.timestamp) > new Date(lastMessageTimestamp)
            );
            
            // Update timestamp for next check
            if (response.messages.length > 0) {
              const mostRecentMsg = response.messages.reduce((latest, msg) => {
                return new Date(msg.timestamp) > new Date(latest.timestamp) ? msg : latest;
              }, response.messages[0]);
              
              lastMessageTimestamp = new Date(mostRecentMsg.timestamp).getTime();
            }
            
            // Call callback for each new message
            newMessages.forEach(message => {
              callback(message);
            });
          }
        } catch (error) {
          // Handle channel deleted error
          if (error.message && (
              error.message.includes('not found') || 
              error.message.includes('deleted')
          )) {
            console.log(`Channel ${channelId} was deleted, stopping polling`);
            clearInterval(intervalId);
            messageService.activePolling.delete(channelId);
            
            // Mark the channel as deleted to prevent future polling
            try {
              const channelService = require('./channel.service').default;
              channelService.markChannelAsDeleted(channelId);
            } catch (markError) {
              console.warn('Failed to mark channel as deleted:', markError);
            }
            return;
          }
          
          // Incremental backoff for consecutive errors
          consecutiveErrorCount++;
          if (consecutiveErrorCount > MAX_ERRORS) {
            console.log(`Too many errors polling channel ${channelId}, stopping`);
            clearInterval(intervalId);
            messageService.activePolling.delete(channelId);
            return;
          }
        }
      } catch (error) {
        console.error('Unexpected error in message polling:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Store the interval ID for cleanup
    messageService.activePolling.set(channelId, intervalId);
    
    // Return function to cancel interval
    return () => {
      if (messageService.activePolling && messageService.activePolling.has(channelId)) {
        clearInterval(messageService.activePolling.get(channelId));
        messageService.activePolling.delete(channelId);
        console.log(`Polling stopped for channel ${channelId}`);
      }
    };
  },
  
  // Create a real-time listener for direct messages
  createDirectMessagesListener: (userId, targetUserId, callback) => {
    console.log('Setting up API-based polling for direct messages');
    let lastMessageTimestamp = Date.now();
    
    // Set up interval to poll for new messages
    const intervalId = setInterval(async () => {
      try {
        // Get messages since last check
        const response = await messageService.getDirectMessages(
          userId,
          targetUserId,
          10,
          null
        );
        
        if (response && response.messages) {
          // Find messages newer than our last check
          const newMessages = response.messages.filter(msg => 
            new Date(msg.timestamp) > new Date(lastMessageTimestamp)
          );
          
          // Update timestamp for next check
          if (response.messages.length > 0) {
            const mostRecentMsg = response.messages.reduce((latest, msg) => {
              return new Date(msg.timestamp) > new Date(latest.timestamp) ? msg : latest;
            }, response.messages[0]);
            
            lastMessageTimestamp = new Date(mostRecentMsg.timestamp).getTime();
          }
          
          // Call callback for each new message
          newMessages.forEach(message => {
            callback(message);
            
            // Show notification if message is not from current user
            if (message.senderId !== userId) {
              try {
                const notificationService = require('./notification.service').default;
                notificationService.showMessageNotification(message);
              } catch (e) {
                console.log('Notification service not available');
              }
            }
          });
        }
      } catch (error) {
        console.error('Error polling for direct messages:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Return function to cancel interval
    return () => clearInterval(intervalId);
  }
};

export default messageService;