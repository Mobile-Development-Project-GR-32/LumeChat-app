import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const inviteService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    // Create an invitation link (channel or platform)
    createInvite: async (userId, type, targetId = null, expiry = 24) => {
        try {
            const response = await fetch(`${API_URL}/invites`, {
                method: 'POST',
                headers: inviteService.getHeaders(userId),
                body: JSON.stringify({ type, targetId, expiry })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create invitation');
            }

            return response.json();
        } catch (error) {
            console.error('Invitation creation error:', error);
            throw error;
        }
    },

    // Get invite details by code (no auth needed)
    getInviteDetails: async (code) => {
        try {
            const response = await fetch(`${API_URL}/invites/${code}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get invitation details');
            }

            return response.json();
        } catch (error) {
            console.error('Get invitation error:', error);
            throw error;
        }
    },

    // Accept an invitation
    acceptInvite: async (userId, code) => {
        try {
            const response = await fetch(`${API_URL}/invites/${code}/accept`, {
                method: 'POST',
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to accept invitation');
            }

            return response.json();
        } catch (error) {
            console.error('Accept invitation error:', error);
            throw error;
        }
    },

    // Deactivate an invitation
    deactivateInvite: async (userId, code) => {
        try {
            const response = await fetch(`${API_URL}/invites/${code}`, {
                method: 'DELETE',
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to deactivate invitation');
            }

            return response.json();
        } catch (error) {
            console.error('Deactivate invitation error:', error);
            throw error;
        }
    },

    // Get all invites for a channel
    getChannelInvites: async (userId, channelId) => {
        try {
            const response = await fetch(`${API_URL}/invites/channel/${channelId}`, {
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get channel invitations');
            }

            return response.json();
        } catch (error) {
            console.error('Get channel invites error:', error);
            throw error;
        }
    },
    
    // Add friends directly to channel
    addFriendsToChannel: async (userId, channelId, friendIds) => {
        try {
            const response = await fetch(`${API_URL}/invites/channel/${channelId}/add-friends`, {
                method: 'POST',
                headers: inviteService.getHeaders(userId),
                body: JSON.stringify({ friendIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add friends to channel');
            }

            return response.json();
        } catch (error) {
            console.error('Add friends to channel error:', error);
            throw error;
        }
    },
    
    // Generate shareable invite link
    generateShareableLink: (code) => {
        // For web browser sharing
        return `http://192.168.0.56:3000/invite/${code}`;
    },
    
    // Generate deep link for mobile
    generateDeepLink: (code) => {
        return `lumechat://invite/${code}`;
    },
    
    // Share invite via platform's native share functionality
    shareInvite: async (invite) => {
        try {
            if (typeof Share !== 'undefined' && Share.share) {
                await Share.share({
                    title: 'Join me on LumeChat',
                    message: `I'm inviting you to join ${invite.type === 'channel' ? invite.channelName : 'LumeChat platform'}!\n\nCode: ${invite.code}\n\nOpen LumeChat to join or use this link: ${invite.url || inviteService.generateDeepLink(invite.code)}`
                });
                return { success: true };
            } else {
                // Fallback for platforms without Share API
                return { 
                    success: false, 
                    error: 'Share API not supported',
                    clipboard: true  // Indicate that copying to clipboard is an option
                };
            }
        } catch (error) {
            console.error('Share invite error:', error);
            throw error;
        }
    }
};

export default inviteService;
