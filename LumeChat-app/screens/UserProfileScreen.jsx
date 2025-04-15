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

    const handleShareProfile = async () => {
        try {
            await Share.share({
                message: `Chat with me on LumeChat! Username: @${userProfile.username}`,
                title: 'Connect on LumeChat'
            });
        } catch (error) {
            console.error('Error sharing profile:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#128C7E" />
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
            {/* Large profile picture header */}
            <View style={styles.profileHeader}>
                <Image 
                    source={userProfile.profilePic ? 
                        { uri: userProfile.profilePic } : 
                        require('../assets/default-avatar.png')
                    }
                    style={styles.profileImage}
                />
                
                <View style={styles.nameContainer}>
                    <Text style={styles.userName}>{userProfile.fullName}</Text>
                    <Text style={styles.userStatus}>{userProfile.status || "Available"}</Text>
                </View>
            </View>

            {/* Action buttons */}
            {requestStatus === 'friends' ? (
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleStartChat}>
                        <MaterialIcons name="message" size={24} color="white" />
                        <Text style={styles.actionText}>Message</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleRemoveFriend}>
                        <MaterialIcons name="person-remove" size={24} color="white" />
                        <Text style={styles.actionText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ) : requestStatus === 'pending_outgoing' ? (
                <View style={styles.pendingContainer}>
                    <MaterialIcons name="hourglass-empty" size={20} color="#888" />
                    <Text style={styles.pendingText}>Friend request sent</Text>
                </View>
            ) : requestStatus === 'pending_incoming' ? (
                <View style={styles.actionContainer}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleRespondToRequest('accept')}
                    >
                        <MaterialIcons name="check" size={24} color="white" />
                        <Text style={styles.actionText}>Accept</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]} 
                        onPress={() => handleRespondToRequest('reject')}
                    >
                        <MaterialIcons name="close" size={24} color="white" />
                        <Text style={styles.actionText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.addFriendButton}
                    onPress={handleAddFriend}
                >
                    <MaterialIcons name="person-add" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Friend</Text>
                </TouchableOpacity>
            )}

            {/* User info list */}
            <ScrollView style={styles.infoContainer}>
                <View style={styles.infoSection}>
                    {userProfile.username && (
                        <View style={styles.infoItem}>
                            <MaterialIcons name="alternate-email" size={24} color="#128C7E" />
                            <Text style={styles.infoText}>@{userProfile.username}</Text>
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
                            <MaterialIcons name="event" size={24} color="#128C7E" />
                            <Text style={styles.infoText}>
                                Joined {new Date(userProfile.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        color: '#128C7E',
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        marginTop: 16,
        textAlign: 'center',
        color: '#333',
    },
    retryButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#128C7E',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    profileHeader: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#128C7E',
        paddingTop: 40,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    nameContainer: {
        alignItems: 'center',
        marginTop: 12,
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
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        backgroundColor: '#F5F5F5',
    },
    actionButton: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#128C7E',
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#25D366',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    },
    addFriendButton: {
        flexDirection: 'row',
        backgroundColor: '#128C7E',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginVertical: 16,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    pendingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        paddingVertical: 16,
    },
    pendingText: {
        color: '#888',
        fontSize: 16,
        marginLeft: 8,
    },
    infoContainer: {
        flex: 1,
    },
    infoSection: {
        padding: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    infoText: {
        color: '#333',
        fontSize: 16,
        marginLeft: 16,
    },
    bioContainer: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    aboutTitle: {
        color: '#128C7E',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    bioText: {
        color: '#333',
        fontSize: 16,
        lineHeight: 24,
    }
});

export default UserProfileScreen;
