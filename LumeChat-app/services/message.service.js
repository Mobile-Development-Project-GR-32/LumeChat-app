import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

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

    postDirectMessage: async (userId, messageData) => {
        try {
            console.log('Posting direct message data:', messageData)

            const response = await fetch(`${API_URL}/messages/post-direct-message`, {
                method: 'POST',
                headers: messageService.getHeaders(userId),
                body: JSON.stringify(messageData)
            });

            if(!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to post direct message');
            }

            return response.json()
        } catch (error) {
            console.error('Direct message posting error:', error);
            throw error;
        }
    },

    deleteDirectMessage: async (userId, messageId) => {
        try {
            const response = await fetch(`${API_URL}/messages/direct-messages/delete/${messageId}`, {
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
    },

    getDirectMessages: async (userId, receiverId) => {
        try {
            const response = await fetch(`${API_URL}/direct-messages/get-messages/${userId}/${receiverId}`)

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