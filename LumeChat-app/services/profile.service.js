import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

const EVENT_BUS = new Map();

export const profileService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    // Get complete user profile from Firebase Auth
    getProfile: async (userId) => {
        try {
            console.log('Fetching profile for userId:', userId);
            const response = await fetch(`${API_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'user-id': userId
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const profile = await response.json();

            // Ensure profilePic is from API
            if (!profile.profilePic) {
                profile.profilePic = null;
            }

            console.log('Retrieved profile with picture:', profile);

            // Update AsyncStorage with API data
            await AsyncStorage.setItem('user', JSON.stringify(profile));

            return profile;
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    },

    // Update profile in Firebase Auth
    updateProfile: async (userId, updateData) => {
        try {
            console.log('Updating profile with:', updateData);
            
            const { fullName, status, phoneNumber } = updateData;
            const requestBody = { fullName, status, phoneNumber };

            // Remove undefined values
            Object.keys(requestBody).forEach(key => {
                if (requestBody[key] === undefined) delete requestBody[key];
            });

            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: profileService.getHeaders(userId),
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            // After successful update, fetch fresh profile data
            const freshProfile = await profileService.getProfile(userId);
            
            // Update AsyncStorage
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                const updatedUser = { ...userData, ...freshProfile };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }

            // Notify subscribers with fresh data
            profileService.notifySubscribers('profileUpdate', freshProfile);

            return freshProfile;
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    },

    uploadProfilePicture: async (userId, imageUri) => {
        try {
            const formData = new FormData();
            const imageUriParts = imageUri.split('.');
            const fileExtension = imageUriParts[imageUriParts.length - 1];

            formData.append('profilePicture', {
                uri: imageUri,
                name: `profile-${userId}.${fileExtension}`,
                type: `image/${fileExtension}`
            });

            // First upload to API
            const response = await fetch(`${API_URL}/profile/picture`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'user-id': userId
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload profile picture');
            }

            // Get the updated profile with new picture URL
            const updatedProfile = await profileService.getProfile(userId);
            
            // Notify subscribers
            profileService.notifySubscribers('profileUpdate', updatedProfile);

            return updatedProfile;
        } catch (error) {
            console.error('Profile picture upload error:', error);
            throw error;
        }
    },

    deleteAccount: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/profile/delete-account`, {
                method: 'DELETE',
                headers: profileService.getHeaders(userId)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete account');
            }

            // Clear local storage and notify subscribers
            await AsyncStorage.removeItem('user');
            profileService.notifySubscribers('accountDeleted', { userId });

            return await response.json();
        } catch (error) {
            console.error('Account deletion error:', error);
            throw error;
        }
    },

    // Get profile QR code
    getProfileQR: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/profile/qr`, {
                headers: profileService.getHeaders(userId)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to generate QR code');
            }
            
            return response.json();
        } catch (error) {
            console.error('QR code error:', error);
            throw error;
        }
    },

    // Add subscriber methods
    subscribe: (event, callback) => {
        if (!EVENT_BUS.has(event)) {
            EVENT_BUS.set(event, new Set());
        }
        EVENT_BUS.get(event).add(callback);
        return () => EVENT_BUS.get(event).delete(callback);
    },

    notifySubscribers: (event, data) => {
        if (EVENT_BUS.has(event)) {
            EVENT_BUS.get(event).forEach(callback => callback(data));
        }
    }
};

export default profileService;
