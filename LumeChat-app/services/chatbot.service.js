import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const chatbotService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    // Test the connection to the chatbot API
    testConnection: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/chatbot/test`, {
                headers: chatbotService.getHeaders(userId)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to test chatbot connection');
            }

            return response.json();
        } catch (error) {
            console.error('Chatbot connection test error:', error);
            throw error;
        }
    },

    // Send a message to the AI chatbot
    sendMessage: async (userId, message) => {
        try {
            console.log('Sending message to chatbot:', message);
            
            const response = await fetch(`${API_URL}/chatbot/message`, {
                method: 'POST',
                headers: chatbotService.getHeaders(userId),
                body: JSON.stringify({ 
                    message,
                    timestamp: new Date().toISOString() 
                })
            });

            let responseData;
            try {
                responseData = await response.json();
                console.log('Raw API response:', responseData);
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to send message to chatbot');
            }
            
            // Check for aiResponse structure in the response data
            if (responseData && responseData.aiResponse && responseData.aiResponse.content) {
                return {
                    reply: responseData.aiResponse.content,
                    timestamp: responseData.aiResponse.timestamp || new Date().toISOString()
                };
            }
            
            // Fallback to regular reply field
            if (responseData && responseData.reply) {
                return responseData;
            }
            
            // If neither format is found, create default response
            console.warn('No usable reply in response, using fallback');
            return {
                reply: "I received your message but I'm not sure how to respond right now.",
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Chatbot message error:', error);
            // Return a fallback response instead of throwing
            return {
                reply: "I'm sorry, there was an error processing your request. Please try again.",
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },

    // Get chat history (all messages in a single conversation)
    getChatHistory: async (userId, limit = 100) => {
        try {
            console.log('Requesting chat history for userId:', userId);
            const response = await fetch(`${API_URL}/chatbot/history?limit=${limit}`, {
                headers: chatbotService.getHeaders(userId)
            });

            console.log('History response status:', response.status);
            let responseData = {};
            
            try {
                responseData = await response.json();
                console.log('History response data:', responseData);
            } catch (jsonError) {
                console.error('Error parsing history JSON:', jsonError);
                return { messages: [] };
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to fetch chat history');
            }

            // Ensure we always return an object with a messages array
            return responseData && responseData.messages ? 
                responseData : 
                { messages: responseData || [] };
                
        } catch (error) {
            console.error('Chat history error:', error);
            return { messages: [] }; // Return empty messages array instead of throwing
        }
    },

    // Clear chat history
    clearChatHistory: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/chatbot/clear`, {
                method: 'DELETE',
                headers: chatbotService.getHeaders(userId)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to clear chat history');
            }

            return response.json();
        } catch (error) {
            console.error('Clear chat history error:', error);
            throw error;
        }
    },
    
    // Format messages for display in UI
    formatMessagesForUI: (messages) => {
        if (!Array.isArray(messages)) {
            console.warn('formatMessagesForUI received non-array:', messages);
            return [];
        }
        
        return messages.map(msg => ({
            id: msg.id || String(Date.now() + Math.random()),
            content: msg.content || msg.message || msg.text || "Empty message",
            isUser: msg.role === 'user' || msg.sender === 'user' || msg.isUser === true,
            timestamp: new Date(msg.timestamp || Date.now()),
            formattedTime: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        }));
    },
    
    // Group messages by date for UI display
    groupMessagesByDate: (messages) => {
        if (!Array.isArray(messages)) return [];
        
        const groups = {};
        
        messages.forEach(msg => {
            const date = new Date(msg.timestamp);
            const dateString = date.toDateString();
            
            if (!groups[dateString]) {
                groups[dateString] = [];
            }
            
            groups[dateString].push(msg);
        });
        
        // Convert to array and sort by date
        return Object.keys(groups).map(date => ({
            date,
            messages: groups[date].sort((a, b) => a.timestamp - b.timestamp)
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
};

export default chatbotService;