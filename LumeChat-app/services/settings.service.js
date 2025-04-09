const API_URL = 'http://192.168.0.56:3000/api';

export const settingsService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    getSettings: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/settings`, {
                headers: settingsService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            return response.json();
        } catch (error) {
            console.error('Settings fetch error:', error);
            throw error;
        }
    },

    updateSettings: async (userId, category, settings) => {
        try {
            const response = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: settingsService.getHeaders(userId),
                body: JSON.stringify({ category, settings })
            });

            if (!response.ok) {
                throw new Error(`Failed to update ${category} settings`);
            }

            return response.json();
        } catch (error) {
            console.error(`${category} settings update error:`, error);
            throw error;
        }
    },

    resetSettings: async (userId, category = null) => {
        try {
            const url = category ? 
                `${API_URL}/settings/reset/${category}` : 
                `${API_URL}/settings/reset`;

            const response = await fetch(url, {
                method: 'POST',
                headers: settingsService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to reset settings');
            }

            return response.json();
        } catch (error) {
            console.error('Settings reset error:', error);
            throw error;
        }
    }
};

export const settingsHelpers = {
    updatePrivacy: (userId, privacySettings) => 
        settingsService.updateSettings(userId, 'privacy', privacySettings),

    updateTheme: (userId, themeSettings) => 
        settingsService.updateSettings(userId, 'theme', themeSettings),

    updateNotifications: (userId, notificationSettings) => 
        settingsService.updateSettings(userId, 'notifications', notificationSettings),

    updateSecurity: (userId, securitySettings) => 
        settingsService.updateSettings(userId, 'security', securitySettings)
};

export default settingsService;
