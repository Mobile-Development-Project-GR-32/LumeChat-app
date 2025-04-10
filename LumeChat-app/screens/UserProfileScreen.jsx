import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { userService } from '../services/user.service';

const UserProfileScreen = ({ route, navigation }) => {
    const { userId } = route.params;
    const currentUser = useSelector(state => state.user);
    const [userProfile, setUserProfile] = useState(null);
    const [requestStatus, setRequestStatus] = useState('none'); // none, pending, friends

    useEffect(() => {
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        try {
            const profile = await userService.getUserProfile(userId);
            setUserProfile(profile);
            // Check friendship status
            const status = await userService.checkFriendshipStatus(currentUser._id, userId);
            setRequestStatus(status);
        } catch (error) {
            Alert.alert('Error', 'Failed to load user profile');
        }
    };

    const handleAddFriend = async () => {
        try {
            await userService.sendFriendRequest(currentUser._id, userId);
            setRequestStatus('pending');
            Alert.alert('Success', 'Friend request sent successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to send friend request');
        }
    };

    if (!userProfile) return null;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#7289DA', '#4752C4']}
                style={styles.header}
            >
                <View style={styles.profileSection}>
                    <Image 
                        source={userProfile.profilePic ? 
                            { uri: userProfile.profilePic } : 
                            require('../assets/default-avatar.png')
                        }
                        style={styles.profileImage}
                    />
                    <Text style={styles.userName}>{userProfile.fullName}</Text>
                    <Text style={styles.userTag}>@{userProfile.username}</Text>
                    <Text style={styles.userStatus}>{userProfile.status}</Text>
                </View>

                {requestStatus === 'none' && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddFriend}
                    >
                        <LinearGradient
                            colors={['#43B581', '#3CA374']}
                            style={styles.buttonGradient}
                        >
                            <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Add Friend</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {requestStatus === 'pending' && (
                    <View style={styles.pendingButton}>
                        <MaterialIcons name="hourglass-bottom" size={24} color="#FAA61A" />
                        <Text style={styles.pendingText}>Request Pending</Text>
                    </View>
                )}

                {requestStatus === 'friends' && (
                    <View style={styles.friendsSection}>
                        <MaterialIcons name="check-circle" size={24} color="#43B581" />
                        <Text style={styles.friendsText}>Friends</Text>
                    </View>
                )}
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.statsContainer}>
                    {[
                        { icon: 'chat', label: 'Messages', value: userProfile.messageCount || '0' },
                        { icon: 'group', label: 'Friends', value: userProfile.friendCount || '0' },
                        { icon: 'event', label: 'Joined', value: new Date(userProfile.createdAt).toLocaleDateString() }
                    ].map((stat, index) => (
                        <View key={index} style={styles.statItem}>
                            <MaterialIcons name={stat.icon} size={24} color="#7289DA" />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.aboutCard}>
                        <Text style={styles.aboutText}>
                            {userProfile.bio || 'No bio available'}
                        </Text>
                    </View>
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
    header: {
        padding: 20,
        paddingTop: 40,
        alignItems: 'center',
    },
    profileSection: {
        alignItems: 'center',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: 12,
    },
    userTag: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    userStatus: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.6,
        marginTop: 4,
    },
    addButton: {
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    pendingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(250, 166, 26, 0.1)',
        padding: 8,
        borderRadius: 20,
        marginTop: 16,
    },
    pendingText: {
        color: '#FAA61A',
        marginLeft: 8,
        fontSize: 16,
    },
    friendsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 181, 129, 0.1)',
        padding: 8,
        borderRadius: 20,
        marginTop: 16,
    },
    friendsText: {
        color: '#43B581',
        marginLeft: 8,
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
        marginTop: -30,
        elevation: 4,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        color: '#8E9297',
        fontSize: 12,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#7289DA',
        fontWeight: 'bold',
        marginBottom: 12,
    },
    aboutCard: {
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
    },
    aboutText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
    },
});

export default UserProfileScreen;
