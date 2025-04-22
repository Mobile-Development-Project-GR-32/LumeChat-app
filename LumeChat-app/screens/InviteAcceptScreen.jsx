import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Image, 
    ActivityIndicator, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { inviteService } from '../services/invite.service';

const InviteAcceptScreen = ({ route, navigation }) => {
    const { code } = route.params;
    const user = useSelector(state => state.user);
    const [loading, setLoading] = useState(true);
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInviteDetails();
    }, []);

    const fetchInviteDetails = async () => {
        try {
            setLoading(true);
            const details = await inviteService.getInviteDetails(code);
            console.log('Invite details:', details);
            setInvite(details);
        } catch (error) {
            console.error('Error fetching invite details:', error);
            setError(error.message || 'Invalid or expired invite code');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvite = async () => {
        try {
            setLoading(true);
            await inviteService.acceptInvite(user._id, code);
            
            // Navigate based on invite type
            if (invite.type === 'channel') {
                Alert.alert(
                    'Success', 
                    `You've joined ${invite.channelName}`,
                    [
                        { 
                            text: 'View Channel', 
                            onPress: () => navigation.replace('ChannelChat', { 
                                channel: {
                                    _id: invite.targetId,
                                    name: invite.channelName
                                }
                            })
                        }
                    ]
                );
            } else {
                // For platform invites
                Alert.alert(
                    'Success', 
                    'You have accepted the invitation',
                    [
                        { text: 'OK', onPress: () => navigation.navigate('HomeScreen') }
                    ]
                );
            }
        } catch (error) {
            console.error('Error accepting invite:', error);
            Alert.alert('Error', error.message || 'Failed to accept invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    if (loading) {
        return (
            <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7289DA" />
                    <Text style={styles.loadingText}>Loading invitation...</Text>
                </View>
            </LinearGradient>
        );
    }

    if (error) {
        return (
            <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color="#F04747" />
                    <Text style={styles.errorTitle}>Invalid Invite</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.errorButton}
                        onPress={() => navigation.navigate('HomeScreen')}
                    >
                        <Text style={styles.errorButtonText}>Return Home</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.inviteHeader}>
                    <Text style={styles.inviteTitle}>
                        {invite.type === 'channel' 
                            ? `Join ${invite.channelName}`
                            : 'You have been invited to join LumeChat'
                        }
                    </Text>
                </View>

                <View style={styles.inviteInfo}>
                    <View style={styles.inviteCard}>
                        {invite.type === 'channel' && (
                            <>
                                <View style={styles.channelIcon}>
                                    <MaterialIcons name="group" size={36} color="#FFFFFF" />
                                </View>
                                <Text style={styles.channelName}>{invite.channelName}</Text>
                                {invite.memberCount && (
                                    <View style={styles.memberInfo}>
                                        <MaterialIcons name="person" size={16} color="#B9BBBE" />
                                        <Text style={styles.memberCount}>
                                            {invite.memberCount} members
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                        
                        <View style={styles.inviterInfo}>
                            <Text style={styles.inviterText}>
                                Invited by {invite.inviterName}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={handleAcceptInvite}
                    >
                        <LinearGradient
                            colors={['#43B581', '#3CA374']}
                            style={styles.acceptGradient}
                        >
                            <Text style={styles.acceptText}>Accept Invite</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
    errorText: {
        color: '#B9BBBE',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    errorButton: {
        backgroundColor: '#4F545C',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 4,
        marginTop: 24,
    },
    errorButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inviteHeader: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 32,
    },
    inviteTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    inviteInfo: {
        flex: 1,
    },
    inviteCard: {
        backgroundColor: '#2F3136',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    channelIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#7289DA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    channelName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberCount: {
        color: '#B9BBBE',
        marginLeft: 4,
    },
    inviterInfo: {
        marginTop: 24,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#202225',
        width: '100%',
        alignItems: 'center',
    },
    inviterText: {
        color: '#B9BBBE',
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 32,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#4F545C',
        borderRadius: 4,
        paddingVertical: 12,
        marginRight: 8,
        alignItems: 'center',
    },
    cancelText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    acceptButton: {
        flex: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    acceptGradient: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    acceptText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default InviteAcceptScreen;
