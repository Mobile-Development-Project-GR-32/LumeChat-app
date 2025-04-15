import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const channelService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

   // Create new channel
   createChannel: async (userId, channelData) => {
    try {
        // Ensure isPublic is boolean
        const data = {
            ...channelData,
            isPublic: Boolean(channelData.isPublic)
        };

        console.log('Sending channel data:', data);

        const response = await fetch(`${API_URL}/channels/create`, {
            method: 'POST',
            headers: channelService.getHeaders(userId),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create channel');
        }

        return response.json();
    } catch (error) {
        console.error('Channel creation error:', error);
        throw error;
    }
},

    // Update channel settings
    updateChannel: async (userId, channelId, updateData) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}`, {
                method: 'PUT',
                headers: channelService.getHeaders(userId),
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update channel');
            }

            return response.json();
        } catch (error) {
            console.error('Channel update error:', error);
            throw error;
        }
    },

    // Manage channel members
    manageMember: async (userId, channelId, targetUserId, action, role) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}/members/${targetUserId}`, {
                method: 'POST',
                headers: channelService.getHeaders(userId),
                body: JSON.stringify({ action, role })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to manage member');
            }

            return response.json();
        } catch (error) {
            console.error('Member management error:', error);
            throw error;
        }
    },

    // Delete channel
    deleteChannel: async (userId, channelId) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}`, {
                method: 'DELETE',
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete channel');
            }

            return response.json();
        } catch (error) {
            console.error('Channel deletion error:', error);
            throw error;
        }
    },

    // Get public channels
    getPublicChannels: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/channels/get-public`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch public channels');
            }

            return response.json();
        } catch (error) {
            console.error('Public channels fetch error:', error);
            throw error;
        }
    },

    // Get private channels
    getPrivateChannels: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/channels/get-private`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch private channels');
            }

            return response.json();
        } catch (error) {
            console.error('Private channels fetch error:', error);
            throw error;
        }
    }
};

export default channelService;
