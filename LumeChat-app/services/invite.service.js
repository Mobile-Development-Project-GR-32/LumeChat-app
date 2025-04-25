import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const inviteService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),
    
    // Create an invitation (for channels, direct messages, etc.)
    createInvite: async (userId, type, targetId, expiry = 24) => {
        try {
            const response = await fetch(`${API_URL}/invites`, {
                method: 'POST',
                headers: inviteService.getHeaders(userId),
                body: JSON.stringify({
                    type,
                    targetId,
                    expiry
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create invitation');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    },
    
    // Accept an invitation by code
    acceptInvite: async (userId, code) => {
        try {
            const response = await fetch(`${API_URL}/invites/accept/${code}`, {
                method: 'POST',
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to accept invitation');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    },
    
    // Get information about an invitation
    getInviteInfo: async (userId, code) => {
        try {
            const response = await fetch(`${API_URL}/invites/${code}`, {
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get invitation info');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    },
    
    // List invitations created by the user
    getMyInvites: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/invites/created`, {
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch your invitations');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    },
    
    // Delete an invitation
    deleteInvite: async (userId, inviteId) => {
        try {
            const response = await fetch(`${API_URL}/invites/${inviteId}`, {
                method: 'DELETE',
                headers: inviteService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete invitation');
            }

            return response.json();
        } catch (error) {
            throw error;
        }
    }
};

export default inviteService;
