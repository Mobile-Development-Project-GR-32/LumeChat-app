import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const statusService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    updateStatus: async (userId, status) => {
        try {
            const response = await fetch(`${API_URL}/status`, {
                method: 'PUT',
                headers: statusService.getHeaders(userId),
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update status');
            }

            return response.json();
        } catch (error) {
            console.error('Status update error:', error);
            throw error;
        }
    },

    getPresetStatuses: () => [
        { icon: 'sentiment-satisfied', text: 'Available', color: '#43B581' },
        { icon: 'schedule', text: 'Away', color: '#FAA61A' },
        { icon: 'do-not-disturb-on', text: 'Do Not Disturb', color: '#F04747' },
        { icon: 'remove-circle-outline', text: 'Offline', color: '#747F8D' }
    ],

    getDefaultStatus: () => ({
        text: 'Hey there! I am using LumeChat',
        icon: 'chat',
        color: '#7289DA'
    })
};

export default statusService;
