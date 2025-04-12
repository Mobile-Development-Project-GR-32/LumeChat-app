const API_URL = 'http://192.168.0.56:3000/api';

export const messageService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    postMessage: async (userId, messageData) => {
        try {
            console.log('Posting message data:', messageData)

            const response = await fetch(`${API_URL}/messages/post`, {
                method: 'POST',
                headers: messageService.getHeaders(userId),
                body: JSON.stringify(messageData)
            });

            if(!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to post message');
            }

            return response.json()
        } catch (error) {
            console.error('Message posting error:', error);
            throw error;
        }
    },

    deleteMessage: async (userId, messageId) => {
        try {
            const response = await fetch(`${API_URL}/messages/delete/${messageId}`, {
                method: 'DELETE',
                headers: messageService.getHeaders(userId)
            });

            if(!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete message');
            }

            return response.json();
        } catch (error) {
            console.error('Message deletion error:', error);
            throw error
        }
    },

    getMessagesByChannelName: async (channelName) => {
        try {
            const response = await fetch(`${API_URL}/messages/get-messages/${channelName}`)

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            return response.json();
        } catch (error) {
            console.error('Messages fetch error:', error);
            throw error;
        }
    }
}