import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const friendService = {
    getHeaders: (userId) => {
        if (!userId) {
            // Return default headers even without userId to prevent immediate crashes
            return {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'user-id': userId
        };
    },

    // Get user profile with friendship status
    getUserProfileWithFriendshipStatus: async (userId, targetUserId) => {
        try {
            // Validate inputs first
            if (!userId) throw new Error('User ID is required');
            if (!targetUserId) throw new Error('Target user ID is required');
            
            // Make sure the URL is properly encoded
            const url = `${API_URL}/friends/profile/${encodeURIComponent(targetUserId)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: friendService.getHeaders(userId)
            });

            // Check for non-OK status codes
            if (!response.ok) {
                // Get more detailed error information if possible
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    throw new Error(error.error || `Failed with status: ${response.status}`);
                } else {
                    throw new Error(`Failed with status: ${response.status}`);
                }
            }

            const profile = await response.json();
            
            // Special case: If this is our own profile, no need for friendship status
            if (userId === targetUserId) {
                // For own profile, we don't need friendship status
                // Ensure all fields have proper defaults
                return {
                    ...profile,
                    _id: profile._id || profile.id || targetUserId,
                    id: profile.id || profile._id || targetUserId,
                    fullName: profile.fullName || `User ${targetUserId.substring(0, 6)}`,
                    username: profile.username || `user_${targetUserId.substring(0, 6)}`,
                    status: profile.status || "Hey there! I am using LumeChat",
                    profilePic: profile.profilePic || null,
                    friendshipStatus: 'self',
                    isFriend: false,
                    isSelf: true
                };
            }
            
            // Normalize friendship status - handle both 'friend' and 'friends'
            let normalizedStatus = profile.friendshipStatus || 'none';
            if (normalizedStatus === 'friend') {
                normalizedStatus = 'friends';
            }
            
            // Ensure the profile has consistent IDs and proper defaults for all fields
            return {
                ...profile,
                _id: profile._id || profile.id || targetUserId,
                id: profile.id || profile._id || targetUserId,
                fullName: profile.fullName || `User ${targetUserId.substring(0, 6)}`,
                username: profile.username || `user_${targetUserId.substring(0, 6)}`,
                status: profile.status || "Hey there! I am using LumeChat",
                profilePic: profile.profilePic || null,
                // Normalize the friendshipStatus property
                friendshipStatus: normalizedStatus,
                // Set isFriend flag for compatibility with older code
                isFriend: normalizedStatus === 'friends' || normalizedStatus === 'friend'
            };
        } catch (error) {
            // Try a different API endpoint as fallback specifically for self-profile
            if (userId === targetUserId) {
                try {
                    const response = await fetch(`${API_URL}/profile`, {
                        method: 'GET', 
                        headers: friendService.getHeaders(userId)
                    });
                    
                    if (response.ok) {
                        const profile = await response.json();
                        return {
                            ...profile,
                            _id: profile._id || profile.id || targetUserId,
                            id: profile.id || profile._id || targetUserId,
                            fullName: profile.fullName || `User ${targetUserId.substring(0, 6)}`,
                            username: profile.username || `user_${targetUserId.substring(0, 6)}`,
                            status: profile.status || "Hey there! I am using LumeChat",
                            profilePic: profile.profilePic || null,
                            friendshipStatus: 'self',
                            isFriend: false,
                            isSelf: true
                        };
                    }
                } catch (fallbackError) {
                    // Continue to fallback
                }
            }
            
            // Return a minimal profile if all else fails
            return {
                _id: targetUserId,
                id: targetUserId,
                fullName: `User ${targetUserId.substring(0, 6)}`,
                username: `user_${targetUserId.substring(0, 6)}`,
                status: 'Available',
                profilePic: null,
                friendshipStatus: userId === targetUserId ? 'self' : 'none',
                isFriend: false,
                isSelf: userId === targetUserId,
                isFallback: true
            };
        }
    },

    // Get user profile using the friendship status API
    getUserProfile: async (userId, targetUserId) => {
        try {
            // If we're fetching our own profile, use a direct approach
            if (userId === targetUserId) {
                try {
                    console.log('Fetching own profile directly from /profile endpoint');
                    const response = await fetch(`${API_URL}/profile`, {
                        method: 'GET',
                        headers: friendService.getHeaders(userId)
                    });
                    
                    if (response.ok) {
                        const profile = await response.json();
                        return {
                            ...profile,
                            _id: profile._id || userId,
                            id: profile.id || userId,
                            friendshipStatus: 'self',
                            isFriend: false,
                            isSelf: true
                        };
                    } else {
                        console.warn(`Profile endpoint returned ${response.status}, falling back to friends/profile`);
                    }
                } catch (directError) {
                    console.error('Direct profile fetch failed:', directError);
                }
            }
            
            // Add validation here too
            if (!userId) throw new Error('User ID is required');
            if (!targetUserId) throw new Error('Target user ID is required');
            
            console.log(`Getting user profile: userId=${userId}, targetId=${targetUserId}`);
            
            // Fall back to friendship status method
            return await friendService.getUserProfileWithFriendshipStatus(userId, targetUserId);
        } catch (error) {
            console.error('User profile fetch error:', error);
            return {
                _id: targetUserId,
                id: targetUserId,
                fullName: 'User ' + targetUserId.substring(0, 6),
                username: 'user_' + targetUserId.substring(0, 6),
                status: 'Available',
                friendshipStatus: userId === targetUserId ? 'self' : 'none',
                isFriend: false,
                isSelf: userId === targetUserId,
                isFallback: true
            };
        }
    },

    // Get all friends
    getFriends: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/friends`, {
                headers: friendService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch friends');
            }

            return response.json();
        } catch (error) {
            console.error('Friend fetch error:', error);
            throw error;
        }
    },

    // Get friend requests (pending)
    getFriendRequests: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/friends/requests`, {
                headers: friendService.getHeaders(userId)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch friend requests');
            }

            const data = await response.json();
            console.log("Raw friend requests data:", data);
            
            // Transform the requests format to what the app expects
            if (data && data.incoming) {
                // Extract incoming requests and format them properly
                const transformedRequests = data.incoming.map(request => {
                    // Extract the user data from the nested object
                    const userData = request.user || {};
                    
                    return {
                        _id: userData._id || request.senderId,
                        fullName: userData.fullName || "Unknown User",
                        username: userData.username || "unknown",
                        profilePic: userData.profilePic || null, // Make sure profile pic is included
                        status: userData.status || "Unknown",
                        requestId: request._id,
                        createdAt: request.createdAt
                    };
                });
                
                console.log("Transformed friend requests:", transformedRequests);
                return transformedRequests;
            }
            
            return [];
        } catch (error) {
            console.error('Friend requests fetch error:', error);
            return []; // Return empty array on error
        }
    },

    // Send friend request
    sendFriendRequest: async (userId, targetUserId) => {
        try {
            // Validate both IDs before making the request
            if (!userId || !targetUserId) {
                throw new Error(userId ? 'Target user ID is required' : 'User ID is required');
            }
            
            console.log('Sending friend request:', { userId, targetUserId });
            
            const response = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: friendService.getHeaders(userId),
                body: JSON.stringify({ targetUserId })
            });

            const responseData = await response.json();
            console.log('Friend request response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to send friend request');
            }

            return responseData;
        } catch (error) {
            console.error('Send friend request error:', error);
            throw error;
        }
    },

    // Respond to friend request (accept/reject)
    respondToFriendRequest: async (userId, friendId, action) => {
        try {
            const response = await fetch(`${API_URL}/friends/request/${friendId}/respond`, {
                method: 'POST',
                headers: friendService.getHeaders(userId),
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to ${action} friend request`);
            }

            return response.json();
        } catch (error) {
            console.error('Friend request response error:', error);
            throw error;
        }
    },

    // Remove friend
    removeFriend: async (userId, friendId) => {
        try {
            const response = await fetch(`${API_URL}/friends/${friendId}`, {
                method: 'DELETE',
                headers: friendService.getHeaders(userId)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove friend');
            }

            return response.json();
        } catch (error) {
            console.error('Friend removal error:', error);
            throw error;
        }
    },

    // Get user online status
    getUserStatus: async (userId, targetUserIds) => {
        try {
            // Validate required parameters
            if (!userId || !targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
                throw new Error('Valid user ID and target user IDs array are required');
            }
            
            console.log('Fetching online status for users:', targetUserIds);
            
            const response = await fetch(`${API_URL}/friends/status`, {
                method: 'POST',
                headers: friendService.getHeaders(userId),
                body: JSON.stringify({ targetUserIds })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch user status');
            }

            const statusData = await response.json();
            console.log('Status response:', statusData);
            
            return statusData;
        } catch (error) {
            console.error('User status fetch error:', error);
            // Return an empty object instead of throwing to avoid UI disruption
            return { onlineUsers: [], offlineUsers: [] };
        }
    },

    // Add this new function to check friendship status
    checkFriendshipStatus: async (userId, targetUserId) => {
        try {
            const response = await fetch(
                `${API_URL}/friends/status?targetUserId=${targetUserId}`, 
                {
                    headers: friendService.getHeaders(userId)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to check friendship status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking friendship status:', error);
            return { status: 'none' }; // Default to not friends if there's an error
        }
    },

    // Add this function to check if two users are friends
    getFriendshipStatus: async (userId, targetUserId) => {
        try {
            const response = await fetch(
                `${API_URL}/friends/status/${targetUserId}`, 
                {
                    headers: friendService.getHeaders(userId)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to check friendship status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking friendship status:', error);
            return { status: 'none' }; // Default to not friends if there's an error
        }
    },

    // Subscribe to user status updates using WebSocket
    subscribeToUserStatus: (userId, callback) => {
        try {
            // Create WebSocket URL from API URL but replacing http/https with ws/wss
            const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/status';
            console.log('Connecting to WebSocket:', wsUrl);
            
            const socket = new WebSocket(wsUrl);
            
            socket.onopen = () => {
                console.log('WebSocket connection opened for status updates');
                // Send authentication message
                socket.send(JSON.stringify({ 
                    type: 'auth', 
                    userId 
                }));
            };
            
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'status_update') {
                        callback(data);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };
            
            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            socket.onclose = () => {
                console.log('WebSocket connection closed');
            };
            
            // Return methods to manage the connection
            return {
                close: () => {
                    socket.close();
                },
                updatePresence: (status) => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'presence',
                            status // 'online', 'away', 'offline', etc.
                        }));
                    }
                }
            };
        } catch (error) {
            console.error('Failed to subscribe to user status:', error);
            return {
                close: () => {},
                updatePresence: () => {}
            };
        }
    }
};

export default friendService;