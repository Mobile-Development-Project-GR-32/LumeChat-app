import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const conversationService = {
  getHeaders: (userId) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'user-id': userId
  }),
  
  /**
   * Get all conversations for the user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Conversations data
   */
  getAllConversations: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: conversationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch conversations');
      }
      
      return response.json();
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  },
  
  /**
   * Mark a conversation as read
   * @param {string} userId - User ID
   * @param {string} conversationType - Type of conversation ('direct' or 'channel')
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Result of the operation
   */
  markAsRead: async (userId, conversationType, conversationId) => {
    try {
      const response = await fetch(`${API_URL}/conversations/${conversationType}/${conversationId}/read`, {
        method: 'POST',
        headers: conversationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark conversation as read');
      }
      
      return response.json();
    } catch (error) {
      console.error('Mark conversation as read error:', error);
      throw error;
    }
  },
  
  /**
   * Archive a conversation
   * @param {string} userId - User ID
   * @param {string} conversationType - Type of conversation ('direct' or 'channel')
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Result of the operation
   */
  archiveConversation: async (userId, conversationType, conversationId) => {
    try {
      const response = await fetch(`${API_URL}/conversations/${conversationType}/${conversationId}/archive`, {
        method: 'POST',
        headers: conversationService.getHeaders(userId)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive conversation');
      }
      
      return response.json();
    } catch (error) {
      console.error('Archive conversation error:', error);
      throw error;
    }
  },
  
  /**
   * Format conversation data for display
   * @param {Object} conversation - Conversation object from API
   * @returns {Object} Formatted conversation for display
   */
  formatForDisplay: (conversation) => {
    const lastMessageTime = conversation.lastActivity ? new Date(conversation.lastActivity) : null;
    
    // Determine if this is a channel conversation
    const isChannel = conversation.type === 'channel';
    
    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name || 'Unknown',
      photo: conversation.photo || null,
      lastMessage: conversation.lastMessage ? {
        content: conversation.lastMessage.content,
        senderId: conversation.lastMessage.senderId,
        senderName: conversation.lastMessage.senderName,
        time: lastMessageTime ? conversationService.formatLastMessageTime(lastMessageTime) : ''
      } : null,
      unreadCount: conversation.unreadCount || 0,
      isChannel: isChannel,
      memberCount: conversation.memberCount,
      isPublic: conversation.isPublic,
      userId: conversation.userId, // For direct messages, the other user's ID
      
      // Add extra channel-specific properties with defaults
      category: conversation.category || (isChannel ? 'General' : null),
      description: conversation.description || (isChannel ? '' : null)
    };
  },
  
  /**
   * Format timestamp for display
   * @param {Date} timestamp - Message timestamp
   * @returns {string} Formatted time string
   */
  formatLastMessageTime: (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // Check if it's today
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Check if it's within the last week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show the date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  },
  
  /**
   * Setup real-time listener for conversation updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to handle updates
   * @returns {Function} Function to remove the listener
   */
  setupRealtimeListener: (userId, callback) => {
    console.log('Setting up polling for conversation updates');
    let lastUpdateTimestamp = Date.now();
    
    // Set up interval to poll for conversation updates
    const intervalId = setInterval(async () => {
      try {
        // Get latest conversations
        const response = await conversationService.getAllConversations(userId);
        
        if (response && response.conversations) {
          // Find conversations with updates since last check
          const updatedConversations = response.conversations.filter(conv => 
            conv.lastActivity && new Date(conv.lastActivity) > new Date(lastUpdateTimestamp)
          );
          
          // Update timestamp for next check
          lastUpdateTimestamp = Date.now();
          
          // Notify about updates
          updatedConversations.forEach(conversation => {
            const type = conversation.type === 'channel' ? 'channel' : 'direct';
            callback({
              type: 'update',
              conversationType: type,
              conversationId: conversation.id,
              data: conversation
            });
          });
        }
      } catch (error) {
        console.error('Error polling for conversation updates:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
};

export default conversationService;
