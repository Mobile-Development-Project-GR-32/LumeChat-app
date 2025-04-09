const API_URL = 'http://192.168.0.56:3000/api';

export const searchService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    // Global search for users and channels
    globalSearch: async (userId, query, limit = 10) => {
        try {
            console.log('Searching with params:', { userId, query, limit });
            
            const response = await fetch(
                `${API_URL}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
                { 
                    method: 'GET',
                    headers: searchService.getHeaders(userId)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Log the response to check the data structure
            console.log('Raw search results:', data);

            // Transform user data if needed
            if (data.users) {
                data.users = data.users.map(user => ({
                    ...user,
                    fullName: user.fullName || user.displayName || 'Unknown User',
                    profilePic: user.profilePic || null
                }));
            }

            return data;
        } catch (error) {
            console.error('Error in global search:', error);
            return { users: [], channels: { member: [], public: [], recommended: [] } };
        }
    },

    searchUsers: async (userId, query) => {
        try {
            const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
                headers: searchService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to search users');
            }

            const data = await response.json();
            return data.users;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
};

export default searchService;
