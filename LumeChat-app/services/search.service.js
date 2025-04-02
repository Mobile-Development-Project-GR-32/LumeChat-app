const API_URL = 'http://192.168.0.56:3000/api';  // Use your machine's IP address

export const searchService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
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
                    headers: {
                        ...searchService.getHeaders(userId),
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Search results:', data);
            return data;
        } catch (error) {
            console.error('Error in global search:', error);
            return { users: [], channels: { member: [], public: [], recommended: [] } };
        }
    }
};
