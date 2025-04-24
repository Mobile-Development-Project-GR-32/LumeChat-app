import apiConfig from "@/config/api.config";

const API_URL = apiConfig.API_URL;

export const channelService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    // Get channel details by ID
    getChannelDetails: async (userId, channelId) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch channel details');
            }

            return response.json();
        } catch (error) {
            console.error('Channel details fetch error:', error);
            throw error;
        }
    },

    // Create a new channel
    createChannel: async (userId, channelData) => {
        try {
            const response = await fetch(`${API_URL}/channels/create`, {
                method: 'POST',
                headers: channelService.getHeaders(userId),
                body: JSON.stringify(channelData)
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

    // Get user's public channels
    getPublicChannels: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/channels/get-public`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch public channels');
            }

            return response.json();
        } catch (error) {
            console.error('Public channels fetch error:', error);
            throw error;
        }
    },

    // Get user's private channels
    getPrivateChannels: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/channels/get-private`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch private channels');
            }

            return response.json();
        } catch (error) {
            console.error('Private channels fetch error:', error);
            throw error;
        }
    },

    // Get channel members with their roles
    getChannelMembers: async (userId, channelId) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}/members`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch channel members');
            }

            return response.json();
        } catch (error) {
            console.error('Channel members fetch error:', error);
            throw error;
        }
    },

    // Update channel details
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

    // Manage channel member (add, remove, updateRole)
    manageMember: async (userId, channelId, targetUserId, action, role = null) => {
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

    // Bulk add members to channel (admin only)
    addMembers: async (userId, channelId, memberIds) => {
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}/members`, {
                method: 'POST',
                headers: channelService.getHeaders(userId),
                body: JSON.stringify({ members: memberIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add members to channel');
            }

            return response.json();
        } catch (error) {
            console.error('Add members error:', error);
            throw error;
        }
    },

    // Delete a channel
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
    
    // Leave a channel
    leaveChannel: async (userId, channelId) => {
        try {
            console.log(`Attempting to leave channel: ${channelId}`);
            
            const response = await fetch(`${API_URL}/channels/${channelId}/leave`, {
                method: 'POST',
                headers: channelService.getHeaders(userId)
            });
            
            // Check for non-JSON responses first
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            
            if (!response.ok) {
                let errorMessage = `Failed with status: ${response.status}`;
                
                // Handle both JSON and non-JSON error responses
                try {
                    if (isJson) {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } else {
                        // For HTML or plain text errors
                        const textResponse = await response.text();
                        console.error('Non-JSON error response:', textResponse);
                        errorMessage = 'Server returned non-JSON error';
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                }
                
                throw new Error(errorMessage);
            }
            
            // For successful responses
            try {
                if (isJson) {
                    return await response.json();
                } else {
                    // If it's not JSON but successful, return a simple success object
                    const textResponse = await response.text();
                    console.log('Non-JSON success response:', textResponse);
                    return { success: true, message: 'Left channel successfully' };
                }
            } catch (parseError) {
                console.log('Response parsing error but operation likely succeeded:', parseError);
                return { success: true, message: 'Left channel successfully' };
            }
        } catch (error) {
            console.error('Channel leave error:', error);
            throw error;
        }
    },
    
    // Get all channels for the user (both public and private)
    getAllChannels: async (userId) => {
        try {
            const [publicChannels, privateChannels] = await Promise.all([
                channelService.getPublicChannels(userId),
                channelService.getPrivateChannels(userId)
            ]);
            
            return [...publicChannels, ...privateChannels];
        } catch (error) {
            console.error('All channels fetch error:', error);
            throw error;
        }
    },

    // Create a channel invitation
    createChannelInvite: async (userId, channelId, expiry = 24) => {
        try {
            const response = await fetch(`${API_URL}/invites`, {
                method: 'POST',
                headers: channelService.getHeaders(userId),
                body: JSON.stringify({
                    type: 'channel',
                    targetId: channelId,
                    expiry
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create channel invitation');
            }

            return response.json();
        } catch (error) {
            console.error('Channel invitation creation error:', error);
            throw error;
        }
    },

    // Get channel invitations
    getChannelInvites: async (userId, channelId) => {
        try {
            const response = await fetch(`${API_URL}/invites/channel/${channelId}`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch channel invitations');
            }

            return response.json();
        } catch (error) {
            console.error('Channel invitations fetch error:', error);
            throw error;
        }
    },
    
    // Get channel profile details
    getChannelProfile: async (userId, channelId) => {
        try {
            // Log request details for debugging
            console.log(`Fetching channel profile: userId=${userId}, channelId=${channelId}`);
            
            // Try getting channel details directly instead of using a specific profile endpoint
            try {
                // First attempt - use standard channel details endpoint
                return await channelService.getChannelDetails(userId, channelId);
            } catch (apiError) {
                console.error('Channel details fetch error:', apiError);
                
                // Fallback: create a basic channel object
                console.log('Falling back to basic channel data');
                return {
                    _id: channelId,
                    id: channelId, // Include both ID formats for compatibility
                    name: 'Channel',
                    description: 'Channel description unavailable',
                    createdAt: new Date().toISOString(),
                    isPublic: true,
                    category: 'GENERAL'
                };
            }
        } catch (error) {
            console.error('Channel profile fetch error:', error);
            throw error;
        }
    },
    
    // Search for channels
    searchChannels: async (userId, query, category = null, limit = 20) => {
        try {
            let url = `${API_URL}/channels/search?query=${encodeURIComponent(query)}&limit=${limit}`;
            if (category) {
                url += `&category=${category}`;
            }
            
            const response = await fetch(url, {
                headers: channelService.getHeaders(userId)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to search channels');
            }
            
            return response.json();
        } catch (error) {
            console.error('Channel search error:', error);
            throw error;
        }
    },

    // Get trending channels
    getTrendingChannels: async (userId, limit = 10, category = null) => {
        try {
            let url = `${API_URL}/channels/trending?limit=${limit}`;
            if (category) {
                url += `&category=${category}`;
            }
            
            const response = await fetch(url, {
                headers: channelService.getHeaders(userId)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch trending channels');
            }
            
            return response.json();
        } catch (error) {
            console.error('Trending channels fetch error:', error);
            throw error;
        }
    },

    // Get recommended channels for user
    getRecommendedChannels: async (userId, limit = 5) => {
        try {
            const response = await fetch(`${API_URL}/channels/recommended?limit=${limit}`, {
                headers: channelService.getHeaders(userId)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch recommended channels');
            }
            
            return response.json();
        } catch (error) {
            console.error('Recommended channels fetch error:', error);
            throw error;
        }
    }
};

export default channelService;
