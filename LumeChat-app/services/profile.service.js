import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '../config/api.config';
import { friendService } from './friend.service';

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
            // Validate userId first
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            // First check AsyncStorage cache to have something to show immediately
            let cachedProfile = null;
            try {
                const cachedUserData = await AsyncStorage.getItem('user');
                if (cachedUserData) {
                    cachedProfile = JSON.parse(cachedUserData);
                }
            } catch (cacheError) {
                // Continue without cache
            }
            
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
                    throw new Error('Failed to fetch profile from API');
                }

                const profile = await response.json();

                // Special safety check for basic API response 
                if (!profile || typeof profile !== 'object') {
                    throw new Error('API returned invalid profile format');
                }

                // MODIFIED LOGIC: Don't reject profiles with empty string values
                // Only reject if the profile is missing critical fields entirely
                if (profile._id === undefined || profile.username === undefined) {
                    throw new Error('API returned incomplete profile');
                }

                // Set default values for empty fields
                const completeProfile = {
                    ...profile,
                    _id: profile._id || userId,
                    id: profile.id || userId,
                    fullName: profile.fullName || `User ${userId.substring(0, 6)}`,
                    username: profile.username || `user_${userId.substring(0, 6)}`,
                    status: profile.status || "Hey there! I am using LumeChat",
                    profilePic: profile.profilePic || null  // Ensure profilePic is never undefined
                };

                // Update AsyncStorage with complete data
                await AsyncStorage.setItem('user', JSON.stringify(completeProfile));
                return completeProfile;
            } catch (apiError) {
                // Second try: Use friend service as fallback but bypass if it's the issue
                if (!apiError.message.includes('Friend service')) {
                    try {
                        // We're fetching our own profile, so userId is both the requester and target
                        const friendProfile = await friendService.getUserProfile(userId, userId);
                        
                        // Check if friendProfile has required fields (allowing empty strings)
                        if (friendProfile && friendProfile._id) {
                            // Ensure profile has consistent ID format and default values for empty fields
                            const completeProfile = {
                                ...friendProfile,
                                _id: friendProfile._id || userId,
                                id: friendProfile.id || userId,
                                fullName: friendProfile.fullName || `User ${userId.substring(0, 6)}`,
                                username: friendProfile.username || `user_${userId.substring(0, 6)}`,
                                status: friendProfile.status || "Hey there! I am using LumeChat",
                                profilePic: friendProfile.profilePic || null  // Ensure profilePic is never undefined
                            };
                            
                            // Update AsyncStorage
                            await AsyncStorage.setItem('user', JSON.stringify(completeProfile));
                            return completeProfile;
                        }
                        
                        throw new Error('Friend service returned incomplete profile');
                    } catch (friendError) {
                        // If we have cached data, use it as a fallback
                        if (cachedProfile && cachedProfile._id) {
                            // Ensure cached profile has all required fields with defaults
                            const completeProfile = {
                                ...cachedProfile,
                                fullName: cachedProfile.fullName || `User ${userId.substring(0, 6)}`,
                                username: cachedProfile.username || `user_${userId.substring(0, 6)}`,
                                status: cachedProfile.status || "Hey there! I am using LumeChat",
                                profilePic: cachedProfile.profilePic || null  // Ensure profilePic is never undefined
                            };
                            
                            await AsyncStorage.setItem('user', JSON.stringify(completeProfile));
                            return completeProfile;
                        }
                        
                        // If all attempts fail, create a minimal profile with ID
                        const fallbackProfile = {
                            _id: userId,
                            id: userId,
                            fullName: `User ${userId.substring(0, 6)}`,
                            username: `user_${userId.substring(0, 6)}`,
                            status: 'Available',
                            profilePic: null,  // Explicitly set to null, not undefined
                            isFallback: true
                        };
                        
                        // Still save this fallback to AsyncStorage to prevent repeated failures
                        await AsyncStorage.setItem('user', JSON.stringify(fallbackProfile));
                        
                        return fallbackProfile;
                    }
                } else {
                    // If friend service is the source of the error, use cached data if available
                    if (cachedProfile && cachedProfile._id) {
                        // Ensure cached profile has all required fields
                        const completeProfile = {
                            ...cachedProfile,
                            fullName: cachedProfile.fullName || `User ${userId.substring(0, 6)}`,
                            username: cachedProfile.username || `user_${userId.substring(0, 6)}`,
                            status: cachedProfile.status || "Hey there! I am using LumeChat",
                            profilePic: cachedProfile.profilePic || null  // Ensure profilePic is never undefined
                        };
                        
                        await AsyncStorage.setItem('user', JSON.stringify(completeProfile));
                        return completeProfile;
                    }
                    
                    // Last resort fallback
                    const fallbackProfile = {
                        _id: userId,
                        id: userId,
                        fullName: `User ${userId.substring(0, 6)}`,
                        username: `user_${userId.substring(0, 6)}`,
                        status: 'Available',
                        profilePic: null,  // Explicitly set to null, not undefined
                        isFallback: true
                    };
                    
                    await AsyncStorage.setItem('user', JSON.stringify(fallbackProfile));
                    return fallbackProfile;
                }
            }
        } catch (error) {
            // Return a minimal fallback profile even on complete failure
            const emergencyFallback = {
                _id: userId || 'unknown',
                id: userId || 'unknown',
                fullName: `User ${userId ? userId.substring(0, 6) : 'Unknown'}`,
                username: `user_${userId ? userId.substring(0, 6) : 'unknown'}`,
                status: 'Available',
                profilePic: null,  // Explicitly set to null, not undefined
                isFallback: true,
                isEmergencyFallback: true
            };
            
            try {
                await AsyncStorage.setItem('user', JSON.stringify(emergencyFallback));
            } catch (storageError) {
                // Cannot store emergency fallback
            }
            
            return emergencyFallback;
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
