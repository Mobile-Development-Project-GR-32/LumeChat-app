import apiConfig from '../config/api.config';

const API_URL = apiConfig.API_URL;

export const friendService = {
    getHeaders: (userId) => {
        if (!userId) {
            console.error('Missing userId in getHeaders');
        }
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'user-id': userId
        };
    },

    // Get user profile
    getUserProfile: async (userId, targetUserId) => {
        try {
            console.log(`Fetching profile for targetUserId: ${targetUserId} as userId: ${userId}`);
            
            // Make sure both IDs are provided
            if (!userId || !targetUserId) {
                console.error('Missing user IDs for profile fetch:', { userId, targetUserId });
                throw new Error('Missing required user IDs');
            }
            
            // Special case: if requesting own profile, use more complete endpoint
            if (userId === targetUserId) {
                console.log('Getting own profile, using self-profile endpoint');
                try {
                    const response = await fetch(
                        `${API_URL}/profile`, 
                        {
                            method: 'GET',
                            headers: friendService.getHeaders(userId)
                        }
                    );
        
                    if (!response.ok) {
                        throw new Error(`Failed with status: ${response.status}`);
                    }
        
                    const data = await response.json();
                    
                    // If we didn't receive a proper profile, throw an error
                    if (!data || typeof data !== 'object') {
                        throw new Error('Invalid profile data received');
                    }
                    
                    // Ensure the returned data has an ID field
                    return {
                        ...data,
                        _id: data._id || data.id || targetUserId,
                        id: data.id || data._id || targetUserId
                    };
                } catch (selfProfileError) {
                    console.warn('Self-profile endpoint failed:', selfProfileError.message);
                    // Fall back to the regular profile endpoint
                }
            }
            
            // Regular profile endpoint - get user details
            const response = await fetch(
                `${API_URL}/users/${targetUserId}/profile`, 
                {
                    method: 'GET',
                    headers: friendService.getHeaders(userId)
                }
            );

            // Log response status and content type for debugging
            console.log(`Profile response status: ${response.status}`);
            console.log(`Content-Type: ${response.headers.get('content-type')}`);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Profile fetch error response:', errorBody);
                throw new Error(`Failed to fetch user profile: ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Error parsing profile JSON:', jsonError);
                throw new Error('Invalid JSON in profile response');
            }
            
            console.log('Raw profile data received:', data);
            
            // If we didn't receive a proper profile, throw an error
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid profile data received');
            }
            
            // If profile is missing key information, add fallback indicator
            if (!data.fullName || !data.username) {
                console.warn('Incomplete profile data received');
                data.isFallback = true;
                data.fullName = data.fullName || 'Unknown User';
                data.username = data.username || 'user';
                data.status = data.status || 'Status unavailable';
            }
            
            // Ensure the returned data has consistent ID fields
            return {
                ...data,
                _id: data._id || data.id || targetUserId,
                id: data.id || data._id || targetUserId
            };
        } catch (error) {
            console.error('User profile fetch error:', error);
            
            // Return a fallback profile with the target user ID
            return {
                _id: targetUserId,
                id: targetUserId,
                fullName: 'Unknown User',
                username: 'user',
                status: 'Status unavailable',
                isFallback: true,
                friendshipStatus: 'none'
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