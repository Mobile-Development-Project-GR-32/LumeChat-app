import apiConfig from '../config/api.config';

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
      let url = `${API_URL}/messages/channels/${channelId}?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }
      
      console.log(`Fetching messages for channel ${channelId}, limit: ${limit}, before: ${before || 'none'}`);
      
      const response = await fetch(url, {
        headers: messageService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch channel messages');
      }
      
      // Get response as text first
      const responseText = await response.text();
      
      // Log the first part of the response to debug
      console.log(`API response start: ${responseText.substring(0, 200)}...`);
      
      let result;
      try {
        // Try to parse as JSON
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        console.log('Raw response:', responseText);
        throw new Error('Server returned invalid JSON');
      }
      
      // Process the result
      const messagesArray = Array.isArray(result) ? result : 
                            (result.messages && Array.isArray(result.messages) ? result.messages : []);
      
      console.log(`Successfully parsed ${messagesArray.length} messages from response`);
      
      // If we received an array directly, wrap it to match the expected format
      return Array.isArray(result) ? { messages: result } : result;
    } catch (error) {
      console.error('Get channel messages error:', error);
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
    console.log('Setting up API-based polling for channel messages');
    let lastMessageTimestamp = Date.now();
    
    // Set up interval to poll for new messages
    const intervalId = setInterval(async () => {
      try {
        // Get messages since last check
        const response = await messageService.getChannelMessages(
          callback.userId, 
          channelId,
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
          });
        }
      } catch (error) {
        console.error('Error polling for channel messages:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Return function to cancel interval
    return () => clearInterval(intervalId);
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