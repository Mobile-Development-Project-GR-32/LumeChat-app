import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Share, 
    TextInput, Alert, ActivityIndicator, ScrollView, Clipboard 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { inviteService } from '../services/invite.service';
import QRCode from 'react-native-qrcode-svg';

const EXPIRATION_OPTIONS = [
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'never', label: 'Never' }
];

const ChannelInviteScreen = ({ route, navigation }) => {
    const { channelId, channelName } = route.params;
    const user = useSelector(state => state.user);
    const [inviteCode, setInviteCode] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expiry, setExpiry] = useState('7d');
    const [maxUses, setMaxUses] = useState('');

    useEffect(() => {
        generateInvite();
    }, []);

    const generateInvite = async () => {
        setIsLoading(true);
        try {
            // Convert expiry to proper format
            let expiryValue = expiry;
            if (expiry === 'never') {
                expiryValue = 0; // 0 means never expires
            }
            
            const response = await inviteService.createInvite(
                user._id, 
                'channel', 
                channelId, 
                expiryValue
            );
            
            console.log('Generated invite:', response);
            
            // Transform the response to include deep links
            const inviteWithLinks = {
                ...response,
                url: inviteService.generateShareableLink(response.code),
                deepLink: inviteService.generateDeepLink(response.code),
                channelName: channelName
            };
            
            setInviteCode(inviteWithLinks);
        } catch (error) {
            console.error('Error generating invite:', error);
            Alert.alert('Error', error.message || 'Failed to generate invite');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (!inviteCode) return;
        
        try {
            await inviteService.shareInvite({
                type: 'channel',
                channelName: channelName,
                code: inviteCode.code,
                url: inviteCode.url
            });
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share invite');
        }
    };

    const copyToClipboard = () => {
        if (inviteCode?.code) {
            Clipboard.setString(inviteCode.code);
            Alert.alert('Copied', 'Invite code copied to clipboard');
        }
    };

    const renderQRCode = () => {
        if (!inviteCode) return null;

        // Create a data object for the QR code
        const qrData = JSON.stringify({
            type: 'channelInvite',
            channelId,
            channelName,
            inviteCode: inviteCode.code,
            expiry
        });

        return (
            <View style={styles.qrContainer}>
                <QRCode
                    value={qrData}
                    size={200}
                    color="#FFFFFF"
                    backgroundColor="#7289DA"
                />
            </View>
        );
    };

    return (
        <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>{channelName}</Text>
                    <Text style={styles.subtitle}>Share this channel with others</Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7289DA" />
                        <Text style={styles.loadingText}>Generating invite...</Text>
                    </View>
                ) : (
                    <>
                        {renderQRCode()}

                        <View style={styles.infoContainer}>
                            <View style={styles.infoItem}>
                                <MaterialIcons name="link" size={24} color="#7289DA" />
                                <Text style={styles.infoLabel}>Invite Code:</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.codeContainer}
                                onPress={copyToClipboard}
                            >
                                <Text style={styles.codeText}>{inviteCode?.code}</Text>
                                <MaterialIcons name="content-copy" size={20} color="#7289DA" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.optionsContainer}>
                            <Text style={styles.optionsTitle}>Expires after</Text>
                            <View style={styles.optionsRow}>
                                {EXPIRATION_OPTIONS.map(option => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            expiry === option.value && styles.selectedOption
                                        ]}
                                        onPress={() => {
                                            setExpiry(option.value);
                                            generateInvite();
                                        }}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            expiry === option.value && styles.selectedOptionText
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.shareButton}
                            onPress={handleShare}
                        >
                            <LinearGradient
                                colors={['#7289DA', '#5865F2']}
                                style={styles.shareButtonGradient}
                            >
                                <MaterialIcons name="share" size={24} color="#FFFFFF" />
                                <Text style={styles.shareButtonText}>Share Invite</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        padding: 16,
        alignItems: 'center',
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subtitle: {
        color: '#B9BBBE',
        marginTop: 8,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#B9BBBE',
        marginTop: 16,
        fontSize: 16,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: '#7289DA',
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoContainer: {
        width: '100%',
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        color: '#B9BBBE',
        fontSize: 16,
        marginLeft: 8,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#202225',
        borderRadius: 8,
        padding: 12,
    },
    codeText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    optionsContainer: {
        width: '100%',
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    optionsTitle: {
        color: '#B9BBBE',
        fontSize: 14,
        marginBottom: 12,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    optionButton: {
        backgroundColor: '#202225',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        margin: 4,
    },
    selectedOption: {
        backgroundColor: '#7289DA',
    },
    optionText: {
        color: '#B9BBBE',
        fontSize: 14,
    },
    selectedOptionText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    shareButton: {
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 8,
    },
    shareButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    shareButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ChannelInviteScreen;
