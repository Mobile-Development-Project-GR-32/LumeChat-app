import apiConfig from "@/config/api.config";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = apiConfig.API_URL;

// Enhanced tracking system for deleted channels
const deletedChannelIds = new Set();
// Track pending cleanup operations
const pendingCleanups = new Map();
// Track API request timestamps to prevent duplicate calls
const lastChannelRequests = new Map();

export const channelService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    // Get channel details by ID with throttling and caching
    getChannelDetails: async (userId, channelId) => {
        // Skip if channel ID is missing
        if (!channelId) {
            throw new Error('Channel ID is required');
        }
        
        // First check if this channel is already known to be deleted
        if (deletedChannelIds.has(channelId)) {
            throw new Error('Channel not found or was deleted');
        }
        
        // Throttle requests - no more than once every 2 seconds per channel
        const now = Date.now();
        const lastRequest = lastChannelRequests.get(channelId) || 0;
        
        if (now - lastRequest < 2000) {
            // Try to get from cache first
            try {
                const cachedData = await AsyncStorage.getItem(`channel_${channelId}`);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            } catch (cacheError) {
                // Continue with API request if cache fails
            }
        }
        
        // Update last request time
        lastChannelRequests.set(channelId, now);
        
        try {
            const response = await fetch(`${API_URL}/channels/${channelId}`, {
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                // Record API error
                let errorMessage = 'Failed to fetch channel details';
                
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (parseError) {
                    // Use default error message
                }
                
                // If channel not found, mark it as deleted to prevent future polling
                if (response.status === 404 || errorMessage.includes('not found')) {
                    channelService.markChannelAsDeleted(channelId);
                    throw new Error('Channel not found or was deleted');
                }
                
                throw new Error(errorMessage);
            }

            const channelData = await response.json();
            
            // Cache the successful response
            try {
                await AsyncStorage.setItem(`channel_${channelId}`, JSON.stringify(channelData));
            } catch (cacheError) {
                // Ignore cache errors
            }
            
            return channelData;
        } catch (error) {
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
            throw error;
        }
    },

    // Delete a channel
    deleteChannel: async (userId, channelId) => {
        try {
            // Mark as deleted FIRST to prevent further API calls during deletion
            channelService.markChannelAsDeleted(channelId);
            
            // Immediately stop any message polling for this channel
            try {
                const messageService = require('./message.service').default;
                if (messageService.activePolling && messageService.activePolling.has(channelId)) {
                    clearInterval(messageService.activePolling.get(channelId));
                    messageService.activePolling.delete(channelId);
                }
            } catch (pollError) {
                // Ignore polling errors
            }
            
            // Immediately clean up local data
            await channelService.cleanupChannelData(channelId);
            
            // Now make the API call to delete the channel
            const response = await fetch(`${API_URL}/channels/${channelId}`, {
                method: 'DELETE',
                headers: channelService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete channel');
            }
            
            // Do another cleanup after successful API call to ensure everything is gone
            await channelService.cleanupChannelData(channelId);
            
            // Update the persistent deleted channels list
            channelService.saveDeletedChannelsList();
            
            return response.json();
        } catch (error) {
            throw error;
        }
    },
    
    // Check if a channel has been deleted (for polling services)
    isChannelDeleted: (channelId) => {
        if (!channelId) return true;
        return deletedChannelIds.has(channelId);
    },
    
    // Mark a channel as deleted (used by error handlers)
    markChannelAsDeleted: (channelId) => {
        if (!channelId) return;
        
        // Skip if already marked as deleted
        if (deletedChannelIds.has(channelId)) {
            return;
        }
        
        deletedChannelIds.add(channelId);
        
        // Immediately clear any pending cleanups
        if (pendingCleanups.has(channelId)) {
            clearTimeout(pendingCleanups.get(channelId));
            pendingCleanups.delete(channelId);
        }
        
        // Save the updated list of deleted channels to persistent storage
        channelService.saveDeletedChannelsList();
        
        // Directly start cleanup without delay
        channelService.cleanupChannelData(channelId)
            .catch(() => {/* Ignore cleanup errors */});
    },

    // Save the deleted channels list to persistent storage
    saveDeletedChannelsList: async () => {
        try {
            const deletedList = Array.from(deletedChannelIds);
            await AsyncStorage.setItem('deleted_channels', JSON.stringify(deletedList));
        } catch (error) {
            // Ignore storage errors
        }
    },

    // Load the deleted channels list from persistent storage
    loadDeletedChannelsList: async () => {
        try {
            const deletedListStr = await AsyncStorage.getItem('deleted_channels');
            if (deletedListStr) {
                const deletedList = JSON.parse(deletedListStr);
                deletedList.forEach(id => deletedChannelIds.add(id));
            }
        } catch (error) {
            // Ignore storage errors
        }
    },

    // Clean up local channel data
    cleanupChannelData: async (channelId) => {
        try {
            // Cancel any pending cleanup for this channel
            if (pendingCleanups.has(channelId)) {
                clearTimeout(pendingCleanups.get(channelId));
                pendingCleanups.delete(channelId);
            }
            
            // 1. Clean up message service polling
            try {
                const messageService = require('./message.service').default;
                if (messageService.activePolling && messageService.activePolling.has(channelId)) {
                    clearInterval(messageService.activePolling.get(channelId));
                    messageService.activePolling.delete(channelId);
                }
            } catch (pollError) {
                // Ignore polling errors
            }
            
            // 2. Clear all AsyncStorage items related to this channel
            const allKeys = await AsyncStorage.getAllKeys();
            const channelKeys = allKeys.filter(key => 
                key.includes(channelId) || 
                key.includes(`channel_${channelId}`) ||
                key.includes(`channelMessages_${channelId}`) ||
                key.includes(`channelMembers_${channelId}`)
            );
            
            if (channelKeys.length > 0) {
                await AsyncStorage.multiRemove(channelKeys);
            }
            
            // 3. Clean channel from all channel lists
            const channelListKeys = [
                'publicChannels', 
                'privateChannels', 
                'allChannels',
                'recentChannels'
            ];
            
            for (const listKey of channelListKeys) {
                try {
                    const listStr = await AsyncStorage.getItem(listKey);
                    if (listStr) {
                        const list = JSON.parse(listStr);
                        const filteredList = list.filter(ch => 
                            ch._id !== channelId && ch.id !== channelId
                        );
                        
                        if (filteredList.length !== list.length) {
                            await AsyncStorage.setItem(listKey, JSON.stringify(filteredList));
                        }
                    }
                } catch (listError) {
                    // Ignore list errors
                }
            }
            
            // 4. Clear from LastChannelRequests map
            if (lastChannelRequests.has(channelId)) {
                lastChannelRequests.delete(channelId);
            }
            
            return true;
        } catch (error) {
            return false;
        }
    },

    // Leave a channel
    leaveChannel: async (userId, channelId) => {
        try {
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
                    }
                } catch (parseError) {
                    // Use default error message
                }
                
                throw new Error(errorMessage);
            }
            
            // For successful responses
            try {
                if (isJson) {
                    return await response.json();
                } else {
                    // If it's not JSON but successful, return a simple success object
                    return { success: true, message: 'Left channel successfully' };
                }
            } catch (parseError) {
                return { success: true, message: 'Left channel successfully' };
            }
        } catch (error) {
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
            throw error;
        }
    },
    
    // Get channel profile details
    getChannelProfile: async (userId, channelId) => {
        try {
            // Try getting channel details directly instead of using a specific profile endpoint
            try {
                // First attempt - use standard channel details endpoint
                return await channelService.getChannelDetails(userId, channelId);
            } catch (apiError) {
                // Fallback: create a basic channel object
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
            throw error;
        }
    },

    // Clear all deleted channel data (for app reset/logout)
    clearAllDeletedChannels: async () => {
        try {
            // Clear all pending timeouts
            for (const [channelId, timeoutId] of pendingCleanups.entries()) {
                clearTimeout(timeoutId);
            }
            pendingCleanups.clear();
            
            // Perform cleanup for each deleted channel
            const cleanupPromises = Array.from(deletedChannelIds).map(
                channelId => channelService.cleanupChannelData(channelId)
            );
            
            await Promise.allSettled(cleanupPromises);
            
            // Clear the deleted channels set
            deletedChannelIds.clear();
            lastChannelRequests.clear();
            
            return true;
        } catch (error) {
            return false;
        }
    }
};

export default channelService;
