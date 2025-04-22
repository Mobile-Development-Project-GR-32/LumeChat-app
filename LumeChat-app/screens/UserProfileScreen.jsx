import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, 
  ActivityIndicator, Linking 
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { friendService } from '../services/friend.service';

const UserProfileScreen = ({ route, navigation }) => {
    const { userId } = route.params;
    const currentUser = useSelector(state => state.user);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestStatus, setRequestStatus] = useState('none'); // none, pending, friends

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            
            // Validate both user IDs before proceeding
            if (!userId || !currentUser?._id) {
                console.error('Missing user information:', { 
                    currentUserId: currentUser?._id, 
                    targetUserId: userId 
                });
                Alert.alert(
                    'Error', 
                    'Could not load user profile. The user might not exist or the connection failed.',
                    [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]
                );
                return;
            }
            
            console.log('Fetching profile for userId:', userId, 'as currentUser:', currentUser._id);
            
            const profile = await friendService.getUserProfile(currentUser._id, userId);
            
            if (!profile || !profile._id) {
                console.error('Invalid profile data received:', profile);
                Alert.alert(
                    'Error', 
                    'Could not load user profile.',
                    [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]
                );
                return;
            }
            
            console.log('Received profile data:', profile);
            setUserProfile(profile);
            
            // Fix for "friend" status - ensure it's correctly mapped to "friends"
            let friendStatus = profile.friendshipStatus || 'none';
            
            // Map "friend" to "friends" if needed
            if (friendStatus === 'friend') {
                friendStatus = 'friends';
            }
            
            // Also check if isFriend is true, then set as "friends"
            if (profile.isFriend === true) {
                friendStatus = 'friends';
            }
            
            console.log('Setting friendship status:', friendStatus);
            setRequestStatus(friendStatus);
        } catch (error) {
            console.error('Failed to load user profile:', error);
            Alert.alert(
                'Error', 
                'Could not load user profile. The user might not exist or the connection failed.',
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async () => {
        try {
            // Validate both user IDs before proceeding
            if (!userId || !currentUser?._id) {
                throw new Error('Missing user information. Please try again.');
            }
            
            await friendService.sendFriendRequest(currentUser._id, userId);
            setRequestStatus('pending_outgoing');
            Alert.alert('Success', 'Friend request sent successfully');
        } catch (error) {
            console.error('Failed to send friend request:', error);
            Alert.alert('Error', error.message || 'Failed to send friend request');
        }
    };

    const handleRespondToRequest = async (action) => {
        try {
            await friendService.respondToFriendRequest(currentUser._id, userId, action);
            if (action === 'accept') {
                setRequestStatus('friends');
                Alert.alert('Success', `You are now friends with ${userProfile.fullName}`);
            } else {
                setRequestStatus('none');
            }
        } catch (error) {
            Alert.alert('Error', `Failed to ${action} friend request`);
        }
    };

    const handleRemoveFriend = async () => {
        Alert.alert(
            'Unfriend',
            `Are you sure you want to unfriend ${userProfile.fullName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Unfriend', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await friendService.removeFriend(currentUser._id, userId);
                            // Update local state immediately after successful API call
                            setRequestStatus('none');
                            Alert.alert('Success', 'Friend removed successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove friend');
                        }
                    }
                }
            ]
        );
    };

    const handleStartChat = () => {
        navigation.navigate('DirectMessages', {
            userId: userProfile._id,
            userName: userProfile.fullName,
            userAvatar: userProfile.profilePic
        });
    };

    const handleCall = () => {
        Alert.alert('Call Feature', 'Voice call feature coming soon!');
    };

    const handleVideoCall = () => {
        Alert.alert('Video Call Feature', 'Video call feature coming soon!');
    };

    const handleToggleNotifications = () => {
        Alert.alert('Notifications', 'Notification settings updated');
    };

    const handleMediaSearch = () => {
        Alert.alert('Search', 'Media search feature coming soon!');
    };

    const renderFriendshipButtons = () => {
        console.log("Rendering buttons for friendship status:", requestStatus);
        
        // Fix for case inconsistency - handle both "friend" and "friends"
        if (requestStatus === 'friends' || requestStatus === 'friend') {
            return (
                <>
                    <TouchableOpacity style={styles.messageButton} onPress={handleStartChat}>
                        <MaterialIcons name="message" size={24} color="white" />
                        <Text style={styles.buttonText}>Message</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFriend}>
                        <MaterialIcons name="person-remove" size={24} color="white" />
                        <Text style={styles.buttonText}>Unfriend</Text>
                    </TouchableOpacity>
                </>
            );
        } else if (requestStatus === 'pending_outgoing') {
            return (
                <View style={styles.pendingContainer}>
                    <MaterialIcons name="hourglass-empty" size={20} color="#8e9297" />
                    <Text style={styles.pendingText}>Friend request sent</Text>
                </View>
            );
        } else if (requestStatus === 'pending_incoming') {
            return (
                <View style={styles.requestButtonsContainer}>
                    <TouchableOpacity 
                        style={[styles.requestButton, styles.acceptButton]}
                        onPress={() => handleRespondToRequest('accept')}
                    >
                        <MaterialIcons name="check" size={24} color="white" />
                        <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.requestButton, styles.rejectButton]} 
                        onPress={() => handleRespondToRequest('reject')}
                    >
                        <MaterialIcons name="close" size={24} color="white" />
                        <Text style={styles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            );
        } else {
            return (
                <TouchableOpacity
                    style={styles.addFriendButton}
                    onPress={handleAddFriend}
                >
                    <MaterialIcons name="person-add" size={24} color="white" />
                    <Text style={styles.buttonText}>Add Friend</Text>
                </TouchableOpacity>
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7289DA" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!userProfile) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#F04747" />
                <Text style={styles.errorText}>Couldn't load user profile</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadUserProfile}
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Profile Header with curved bottom edge and gradient */}
            <LinearGradient
                colors={['#5865F2', '#4752C4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileHeader}
            >
                <View style={styles.profileImageSection}>
                    <Image 
                        source={userProfile.profilePic ? 
                            { uri: userProfile.profilePic } : 
                            require('../assets/default-avatar.png')
                        }
                        style={styles.profileImage}
                    />
                    <View style={styles.userInfoContainer}>
                        <Text style={styles.userName}>{userProfile.fullName}</Text>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.userStatus}>{userProfile.status || "Available"}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.headerCurve} />
            </LinearGradient>
            
            {/* Action Buttons in a card */}
            <View style={styles.actionCard}>
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                        <View style={styles.actionButtonCircle}>
                            <MaterialIcons name="call" size={22} color="#7289DA" />
                        </View>
                        <Text style={styles.actionLabel}>Call</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
                        <View style={styles.actionButtonCircle}>
                            <MaterialIcons name="videocam" size={22} color="#7289DA" />
                        </View>
                        <Text style={styles.actionLabel}>Video</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleToggleNotifications}>
                        <View style={styles.actionButtonCircle}>
                            <MaterialIcons name="notifications" size={22} color="#7289DA" />
                        </View>
                        <Text style={styles.actionLabel}>Mute</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleMediaSearch}>
                        <View style={styles.actionButtonCircle}>
                            <MaterialIcons name="search" size={22} color="#7289DA" />
                        </View>
                        <Text style={styles.actionLabel}>Search</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* User info list */}
            <ScrollView style={styles.infoContainer}>
                <View style={styles.infoSection}>
                    {userProfile.username && (
                        <View style={styles.infoCard}>
                            <MaterialIcons name="alternate-email" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Username</Text>
                                <Text style={styles.infoText}>@{userProfile.username}</Text>
                            </View>
                        </View>
                    )}
                    
                    {userProfile.phoneNumber && (
                        <View style={styles.infoCard}>
                            <MaterialIcons name="phone" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Phone</Text>
                                <Text style={styles.infoText}>{userProfile.phoneNumber}</Text>
                            </View>
                        </View>
                    )}
                    
                    {userProfile.email && (
                        <View style={styles.infoCard}>
                            <MaterialIcons name="email" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoText}>{userProfile.email}</Text>
                            </View>
                        </View>
                    )}
                    
                    {userProfile.bio && (
                        <View style={styles.bioCard}>
                            <View style={styles.bioHeader}>
                                <MaterialIcons name="info" size={24} color="#7289DA" />
                                <Text style={styles.aboutTitle}>About</Text>
                            </View>
                            <Text style={styles.bioText}>{userProfile.bio}</Text>
                        </View>
                    )}
                    
                    {userProfile.createdAt && (
                        <View style={styles.infoCard}>
                            <MaterialIcons name="event" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Joined</Text>
                                <Text style={styles.infoText}>
                                    {new Date(userProfile.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
                
                {/* Friendship action buttons */}
                <View style={styles.friendActionContainer}>
                    {renderFriendshipButtons()}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#36393F',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#36393F',
    },
    loadingText: {
        color: '#7289DA',
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#36393F',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        marginTop: 16,
        textAlign: 'center',
        color: '#DCDDDE',
    },
    retryButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#7289DA',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    profileHeader: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'relative',
    },
    headerCurve: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 20,
        backgroundColor: '#36393F',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    profileImageSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    userInfoContainer: {
        flex: 1,
        marginLeft: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#43B581', // Green for "online"
        marginRight: 6,
    },
    userStatus: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    actionCard: {
        marginTop: -10,
        marginHorizontal: 20,
        backgroundColor: '#2F3136',
        borderRadius: 16,
        padding: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
        width: 65,
    },
    actionButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(114, 137, 218, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    actionLabel: {
        color: '#DCDDDE',
        fontSize: 12,
    },
    infoContainer: {
        flex: 1,
        marginTop: 20,
    },
    infoSection: {
        padding: 16,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2F3136',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    infoLabel: {
        color: '#8e9297',
        fontSize: 13,
        marginBottom: 4,
    },
    infoText: {
        color: '#DCDDDE',
        fontSize: 16,
    },
    bioCard: {
        backgroundColor: '#2F3136',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    bioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    aboutTitle: {
        color: '#7289DA',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    bioText: {
        color: '#DCDDDE',
        fontSize: 16,
        lineHeight: 24,
    },
    friendActionContainer: {
        padding: 16,
        marginBottom: 20,
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7289DA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F04747',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7289DA',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    pendingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#36393F',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#202225',
    },
    pendingText: {
        color: '#DCDDDE',
        fontSize: 16,
        marginLeft: 8,
    },
    requestButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        flex: 0.48,
        elevation: 2,
    },
    acceptButton: {
        backgroundColor: '#43B581',
    },
    rejectButton: {
        backgroundColor: '#F04747',
    }
});

export default UserProfileScreen;
