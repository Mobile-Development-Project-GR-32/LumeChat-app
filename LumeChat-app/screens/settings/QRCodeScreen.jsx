import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Share, Image, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { profileService } from '../../services/profile.service';  // Fixed import path

const QRCodeScreen = () => {
    const user = useSelector(state => state.user);
    const [qrData, setQrData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadQRCode();
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const loadQRCode = async () => {
        try {
            setIsLoading(true);
            const data = await profileService.getProfileQR(user._id);
            setQrData(data.qrCode);
        } catch (error) {
            console.error('Failed to load QR code:', error);
            Alert.alert('Error', 'Failed to load QR code');
        } finally {
            setIsLoading(false);
        }
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleShare = async () => {
        try {
            const shareData = {
                userId: user?._id,
                username: user?.username,
                fullName: user?.fullName,
                profilePic: user?.profilePic
            };
            
            await Share.share({
                message: `Connect with me on LumeChat!\n\nName: ${shareData.fullName}\nUsername: @${shareData.username}\n\nOpen LumeChat to connect!`,
                title: 'Connect on LumeChat'
            });
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'Failed to share profile');
        }
    };

    return (
        <LinearGradient
            colors={['#1a237e', '#000000']}
            style={styles.container}
        >
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.qrContainer,
                        {
                            transform: [
                                { scale: scaleAnim },
                                { rotate: rotation }
                            ]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#7289DA', '#4752C4']}
                        style={styles.qrWrapper}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        ) : (
                            <Image 
                                source={{ uri: qrData }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        )}
                    </LinearGradient>
                </Animated.View>

                <View style={styles.infoContainer}>
                    <Text style={styles.username}>@{user?.username}</Text>
                    <Text style={styles.subtitle}>Scan to connect with me</Text>
                </View>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                >
                    <LinearGradient
                        colors={['#43B581', '#3CA374']}
                        style={styles.shareGradient}
                    >
                        <MaterialIcons name="share" size={24} color="#FFFFFF" />
                        <Text style={styles.shareText}>Share Profile</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionTitle}>How to use:</Text>
                    <Text style={styles.instruction}>
                        1. Ask your friend to scan this QR code
                    </Text>
                    <Text style={styles.instruction}>
                        2. Their LumeChat app will open
                    </Text>
                    <Text style={styles.instruction}>
                        3. You'll be connected instantly!
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    qrContainer: {
        padding: 20,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 8,
    },
    qrWrapper: {
        padding: 20,
        borderRadius: 20,
        elevation: 4,
    },
    qrImage: {
        width: 250,
        height: 250,
    },
    infoContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#B9BBBE',
    },
    shareButton: {
        marginTop: 32,
        width: '80%',
        borderRadius: 25,
        overflow: 'hidden',
        elevation: 4,
    },
    shareGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    shareText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    instructionsContainer: {
        marginTop: 32,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        width: '100%',
    },
    instructionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    instruction: {
        color: '#B9BBBE',
        fontSize: 14,
        marginBottom: 8,
    }
});

export default QRCodeScreen;
