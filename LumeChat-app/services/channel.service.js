const API_URL = 'http://192.168.0.56:3000/api';  // Use your machine's IP address

// Valid channel categories
const VALID_CATEGORIES = ['INFORMATION', 'GENERAL', 'STUDY_GROUPS', 'PROJECTS', 'VOICE_CHANNELS'];

export const channelService = {
    // Headers configuration
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'user-id': userId
    }),

    // Get all public channels
    getPublicChannels: async (userId) => {
        try {
            console.log('Fetching public channels with userId:', userId);
            const response = await fetch(`${API_URL}/channels/get-public`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'user-id': userId
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw public channels data:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching public channels:', error);
            return [];
        }
    },

    // Get user's private channels
    getPrivateChannels: async (userId) => {
        try {
            console.log('Fetching private channels with userId:', userId);
            const response = await fetch(`${API_URL}/channels/get-private`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'user-id': userId
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw private channels data:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching private channels:', error);
            return [];
        }
    },

    // Create new channel
    createChannel: async (userId, channelData) => {
        try {
            console.log('Creating channel with data:', channelData);

            const formData = new FormData();
            formData.append('name', channelData.name);
            formData.append('category', channelData.category);
            formData.append('isPublic', String(channelData.isPublic));
            formData.append('description', channelData.description || '');
            formData.append('createdBy', userId);

            if (channelData.coverImage) {
                const imageUri = channelData.coverImage;
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('coverImage', {
                    uri: imageUri,
                    name: filename,
                    type
                });
            }

            const response = await fetch(`${API_URL}/channels/create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'user-id': userId,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create channel');
            }

            return await response.json();
        } catch (error) {
            console.error('Channel creation error:', error);
            throw error;
        }
    },

    // Update channel details
    updateChannel: async (userId, channelId, updates) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}`, {
                method: 'PUT',
                headers: channelService.getHeaders(userId),
                body: JSON.stringify(updates)
            });
            return response.json();
        } catch (error) {
            console.error('Error updating channel:', error);
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
            return response.json();
        } catch (error) {
            console.error('Error managing member:', error);
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
            return response.json();
        } catch (error) {
            console.error('Error deleting channel:', error);
            throw error;
        }
    },

    // Search channels
    searchChannels: async (userId, query) => {
        try {
            const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`, {
                headers: channelService.getHeaders(userId)
            });
            return response.json();
        } catch (error) {
            console.error('Error searching channels:', error);
            throw error;
        }
    }
};
