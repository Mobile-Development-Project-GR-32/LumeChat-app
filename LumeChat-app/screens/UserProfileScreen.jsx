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
                throw new Error('Missing user information. Please try again.');
            }
            
            console.log('Fetching user profile for userId:', userId, 'Current user:', currentUser._id);
            
            // Use currentUser._id as the requesting user and userId as the target user
            const profile = await friendService.getUserProfile(currentUser._id, userId);
            console.log('Profile received:', profile);
            
            if (!profile || !profile._id) {
                throw new Error('Invalid profile data received');
            }
            
            setUserProfile(profile);
            setRequestStatus(profile.friendshipStatus || 'none');
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
            'Remove Friend',
            `Are you sure you want to remove ${userProfile.fullName} from your friends?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await friendService.removeFriend(currentUser._id, userId);
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
        navigation.navigate('ChatScreen', {
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

    // Update the UI based on friendship status
    const renderFriendshipButtons = () => {
        if (requestStatus === 'friends') {
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
            {/* Profile Header */}
            <View style={styles.profileHeader}>
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
                        <Text style={styles.userStatus}>{userProfile.status || "Available"}</Text>
                    </View>
                </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                    <MaterialIcons name="call" size={24} color="#7289DA" />
                    <Text style={styles.actionLabel}>Call</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
                    <MaterialIcons name="videocam" size={24} color="#7289DA" />
                    <Text style={styles.actionLabel}>Video</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleToggleNotifications}>
                    <MaterialIcons name="notifications" size={24} color="#7289DA" />
                    <Text style={styles.actionLabel}>Mute</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleMediaSearch}>
                    <MaterialIcons name="search" size={24} color="#7289DA" />
                    <Text style={styles.actionLabel}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* User info list */}
            <ScrollView style={styles.infoContainer}>
                <View style={styles.infoSection}>
                    {userProfile.username && (
                        <View style={styles.infoItem}>
                            <MaterialIcons name="alternate-email" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Username</Text>
                                <Text style={styles.infoText}>@{userProfile.username}</Text>
                            </View>
                        </View>
                    )}
                    
                    {userProfile.phoneNumber && (
                        <View style={styles.infoItem}>
                            <MaterialIcons name="phone" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Phone</Text>
                                <Text style={styles.infoText}>{userProfile.phoneNumber}</Text>
                            </View>
                        </View>
                    )}
                    
                    {userProfile.email && (
                        <View style={styles.infoItem}>
                            <MaterialIcons name="email" size={24} color="#7289DA" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoText}>{userProfile.email}</Text>
                            </View>
                        </View>
                    )}
                    
                    {userProfile.bio && (
                        <View style={styles.bioContainer}>
                            <Text style={styles.aboutTitle}>About</Text>
                            <Text style={styles.bioText}>{userProfile.bio}</Text>
                        </View>
                    )}
                    
                    {userProfile.createdAt && (
                        <View style={styles.infoItem}>
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
        backgroundColor: '#7289DA',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
    },
    profileImageSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    userInfoContainer: {
        flex: 1,
        marginLeft: 20,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userStatus: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2F3136',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#202225',
    },
    actionButton: {
        alignItems: 'center',
        width: 70,
    },
    actionLabel: {
        marginTop: 4,
        color: '#DCDDDE',
        fontSize: 12,
    },
    infoContainer: {
        flex: 1,
    },
    infoSection: {
        padding: 16,
        backgroundColor: '#36393F',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2F3136',
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    infoLabel: {
        color: '#8e9297',
        fontSize: 14,
    },
    infoText: {
        color: '#DCDDDE',
        fontSize: 16,
        marginTop: 2,
    },
    bioContainer: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2F3136',
    },
    aboutTitle: {
        color: '#7289DA',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    bioText: {
        color: '#DCDDDE',
        fontSize: 16,
        lineHeight: 24,
    },
    friendActionContainer: {
        padding: 16,
        backgroundColor: '#2F3136',
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7289DA',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F04747',
        padding: 16,
        borderRadius: 8,
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7289DA',
        padding: 16,
        borderRadius: 8,
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
        borderRadius: 8,
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
        borderRadius: 8,
        flex: 0.48,
    },
    acceptButton: {
        backgroundColor: '#43B581',
    },
    rejectButton: {
        backgroundColor: '#F04747',
    }
});

export default UserProfileScreen;
