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
            console.warn('Cannot fetch channel details: Missing channelId');
            throw new Error('Channel ID is required');
        }
        
        // First check if this channel is already known to be deleted
        if (deletedChannelIds.has(channelId)) {
            console.log(`Skipping fetch for known deleted channel: ${channelId}`);
            throw new Error('Channel not found or was deleted');
        }
        
        // Throttle requests - no more than once every 2 seconds per channel
        const now = Date.now();
        const lastRequest = lastChannelRequests.get(channelId) || 0;
        
        if (now - lastRequest < 2000) {
            console.log(`Throttling getChannelDetails request for ${channelId}`);
            
            // Try to get from cache first
            try {
                const cachedData = await AsyncStorage.getItem(`channel_${channelId}`);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    console.log(`Using cached data for channel ${channelId}`);
                    return parsed;
                }
            } catch (cacheError) {
                console.warn('Error reading channel cache:', cacheError);
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
                    console.warn('Error parsing error response:', parseError);
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
                console.warn('Error caching channel data:', cacheError);
            }
            
            return channelData;
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
            console.log(`Attempting to delete channel: ${channelId}`);

            // Mark as deleted FIRST to prevent further API calls during deletion
            channelService.markChannelAsDeleted(channelId);
            
            // Immediately stop any message polling for this channel
            try {
                const messageService = require('./message.service').default;
                if (messageService.activePolling && messageService.activePolling.has(channelId)) {
                    clearInterval(messageService.activePolling.get(channelId));
                    messageService.activePolling.delete(channelId);
                    console.log(`Stopped polling for deleted channel: ${channelId}`);
                }
            } catch (pollError) {
                console.warn('Failed to stop message polling:', pollError);
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
            
            console.log(`Channel ${channelId} successfully deleted and all data cleaned up`);
            return response.json();
        } catch (error) {
            console.error('Channel deletion error:', error);
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
            console.log(`Channel ${channelId} already marked as deleted`);
            return;
        }
        
        console.log(`Marking channel as deleted: ${channelId}`);
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
            .catch(err => console.warn(`Failed to clean up channel data for ${channelId}:`, err));
    },

    // Save the deleted channels list to persistent storage
    saveDeletedChannelsList: async () => {
        try {
            const deletedList = Array.from(deletedChannelIds);
            await AsyncStorage.setItem('deleted_channels', JSON.stringify(deletedList));
            console.log(`Saved ${deletedList.length} deleted channel IDs to persistent storage`);
        } catch (error) {
            console.error('Error saving deleted channels list:', error);
        }
    },

    // Load the deleted channels list from persistent storage
    loadDeletedChannelsList: async () => {
        try {
            const deletedListStr = await AsyncStorage.getItem('deleted_channels');
            if (deletedListStr) {
                const deletedList = JSON.parse(deletedListStr);
                deletedList.forEach(id => deletedChannelIds.add(id));
                console.log(`Loaded ${deletedList.length} deleted channel IDs from storage`);
            }
        } catch (error) {
            console.error('Error loading deleted channels list:', error);
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
            
            console.log(`Cleaning up local data for channel: ${channelId}`);
            
            // 1. Clean up message service polling
            try {
                const messageService = require('./message.service').default;
                if (messageService.activePolling && messageService.activePolling.has(channelId)) {
                    clearInterval(messageService.activePolling.get(channelId));
                    messageService.activePolling.delete(channelId);
                    console.log(`Stopped polling for deleted channel: ${channelId}`);
                }
            } catch (pollError) {
                console.warn(`Failed to stop message polling for ${channelId}:`, pollError);
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
                console.log(`Removed ${channelKeys.length} channel-specific storage keys`);
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
                            console.log(`Removed channel from ${listKey}, new length: ${filteredList.length}`);
                        }
                    }
                } catch (listError) {
                    console.warn(`Error cleaning channel from ${listKey}:`, listError);
                }
            }
            
            // 4. Clear from LastChannelRequests map
            if (lastChannelRequests.has(channelId)) {
                lastChannelRequests.delete(channelId);
            }
            
            console.log(`Successfully cleaned up all data for channel: ${channelId}`);
            return true;
        } catch (error) {
            console.error('Error cleaning up channel data:', error);
            return false;
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
    },

    // Clear all deleted channel data (for app reset/logout)
    clearAllDeletedChannels: async () => {
        try {
            console.log(`Clearing data for ${deletedChannelIds.size} deleted channels`);
            
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
            
            console.log('Successfully cleared all deleted channel data');
            return true;
        } catch (error) {
            console.error('Error clearing deleted channels:', error);
            return false;
        }
    }
};

export default channelService;
