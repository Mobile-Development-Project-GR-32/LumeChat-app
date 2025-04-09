const API_URL = 'http://192.168.0.56:3000/api';  // Change localhost to your IP address

export const userService = {
    // Headers configuration
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'user-id': userId
    }),

    // Create new user
    createUser: async (userId, userData) => {
        try {
            const response = await fetch(`${API_URL}/users/create`, {
                method: 'POST',
                headers: userService.getHeaders(userId),
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
            }
            
            return response.json();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Friend management
    addFriend: async (userId, friendUsername) => {
        try {
            const response = await fetch(`${API_URL}/users/add-friend`, {
                method: 'POST',
                headers: userService.getHeaders(userId),
                body: JSON.stringify({ friendUsername })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add friend');
            }

            return response.json();
        } catch (error) {
            console.error('Error adding friend:', error);
            throw error;
        }
    },

    getFriends: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/users/friends`, {
                headers: userService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch friends');
            }

            return response.json();
        } catch (error) {
            console.error('Error fetching friends:', error);
            throw error;
        }
    },

    // Contact management
    sendContactRequest: async (userId, contactUsername) => {
        try {
            const response = await fetch(`${API_URL}/users/contacts`, {
                method: 'POST',
                headers: userService.getHeaders(userId),
                body: JSON.stringify({ contactUsername })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send contact request');
            }

            return response.json();
        } catch (error) {
            console.error('Error sending contact request:', error);
            throw error;
        }
    },

    getContacts: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/users/contacts`, {
                headers: userService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch contacts');
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    },

    removeContact: async (userId, contactId) => {
        try {
            const response = await fetch(`${API_URL}/users/contacts/${contactId}`, {
                method: 'DELETE',
                headers: userService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to remove contact');
            }

            return response.json();
        } catch (error) {
            console.error('Error removing contact:', error);
            throw error;
        }
    },

    // Contact requests
    getPendingContacts: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/users/contacts/pending`, {
                headers: userService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch pending contacts');
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching pending contacts:', error);
            return [];
        }
    },

    acceptContactRequest: async (userId, requesterId) => {
        try {
            const response = await fetch(`${API_URL}/users/contacts/${requesterId}/accept`, {
                method: 'POST',
                headers: userService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to accept contact request');
            }

            return response.json();
        } catch (error) {
            console.error('Error accepting contact request:', error);
            throw error;
        }
    },

    rejectContactRequest: async (userId, requesterId) => {
        try {
            const response = await fetch(`${API_URL}/users/contacts/${requesterId}/reject`, {
                method: 'POST',
                headers: userService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reject contact request');
            }

            return response.json();
        } catch (error) {
            console.error('Error rejecting contact request:', error);
            throw error;
        }
    }
};
