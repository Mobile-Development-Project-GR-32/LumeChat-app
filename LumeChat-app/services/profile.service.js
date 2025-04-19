import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '../config/api.config';
import { friendService } from './friend.service'; // Add import for friend service

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
            
            // Try multiple approaches to get complete profile data
            try {
                // First try: Get profile from API
                const response = await fetch(`${API_URL}/profile`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'user-id': userId
                    }
                });

                if (!response.ok) {
                    console.warn('API profile fetch failed, status:', response.status);
                    throw new Error('Failed to fetch profile from API');
                }

                const profile = await response.json();
                console.log('Profile retrieved from API:', profile);

                // If profile is incomplete, throw error to try fallback
                if (!profile.fullName || profile.isFallback) {
                    console.warn('API returned incomplete profile:', profile);
                    throw new Error('API returned incomplete profile');
                }

                // Ensure profile has consistent ID format
                const completeProfile = {
                    ...profile,
                    _id: profile._id || userId,
                    id: profile.id || userId
                };

                // Update AsyncStorage with complete data
                await AsyncStorage.setItem('user', JSON.stringify(completeProfile));
                return completeProfile;
            } catch (apiError) {
                console.warn('API profile fetch failed:', apiError.message);
                
                // Second try: Use friend service as fallback
                try {
                    console.log('Trying to get profile via friend service...');
                    const friendProfile = await friendService.getUserProfile(userId, userId);
                    
                    // Check if friendProfile has required fields
                    if (friendProfile && friendProfile.fullName && !friendProfile.isFallback) {
                        console.log('Successfully retrieved profile from friend service');
                        
                        // Ensure profile has consistent ID format
                        const completeProfile = {
                            ...friendProfile,
                            _id: friendProfile._id || userId,
                            id: friendProfile.id || userId
                        };
                        
                        // Update AsyncStorage
                        await AsyncStorage.setItem('user', JSON.stringify(completeProfile));
                        return completeProfile;
                    } else {
                        console.warn('Friend service returned incomplete profile:', friendProfile);
                        throw new Error('Friend service returned incomplete profile');
                    }
                } catch (friendError) {
                    console.error('Friend service profile fetch failed:', friendError.message);
                    
                    // Final try: Load from AsyncStorage as last resort
                    const cachedUserData = await AsyncStorage.getItem('user');
                    if (cachedUserData) {
                        const parsedData = JSON.parse(cachedUserData);
                        if (parsedData.fullName && !parsedData.isFallback) {
                            console.log('Using cached profile data from AsyncStorage');
                            return parsedData;
                        }
                    }
                    
                    // If all attempts fail, create a minimal profile with ID
                    console.warn('Creating minimal profile as fallback');
                    return {
                        _id: userId,
                        id: userId,
                        fullName: 'User ' + userId.substring(0, 6),
                        username: 'user_' + userId.substring(0, 6),
                        status: 'Available',
                        isFallback: true
                    };
                }
            }
        } catch (error) {
            console.error('Profile fetch completely failed:', error);
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
