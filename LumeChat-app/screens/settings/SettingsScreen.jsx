import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Avatar, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import LogoutButton from '../../components/LogoutButton';
import { profileService } from '../../services/profile.service';  // Fixed import path

const MenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={styles.menuItemContainer}
    >
        <LinearGradient
            colors={['#2F3136', '#36393F']}
            style={styles.menuItem}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={24} color="#7289DA" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#72767D" />
        </LinearGradient>
    </TouchableOpacity>
);

const SettingsScreen = () => {
    const [localUser, setLocalUser] = useState(useSelector(state => state.user));

    useEffect(() => {
        const unsubscribe = profileService.subscribe('profileUpdate', (updatedProfile) => {
            setLocalUser(prev => ({ ...prev, ...updatedProfile }));
        });

        return () => unsubscribe();
    }, []);

    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={['#202225', '#36393F']}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView}>
                <LinearGradient
                    colors={['#7289DA', '#4752C4']}
                    style={styles.profileCard}
                >
                    <View style={styles.profileContent}>
                        <Avatar.Image 
                            size={60}
                            source={localUser?.profilePic ? { uri: localUser.profilePic } : require('../../assets/default-avatar.png')}
                            style={styles.avatar}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{localUser?.fullName}</Text>
                            <Text style={styles.profileUsername}>@{localUser?.username}</Text>
                            <View style={styles.statusContainer}>
                                <MaterialIcons 
                                    name="chat" 
                                    size={16} 
                                    color="#B9BBBE" 
                                    style={styles.statusIcon}
                                />
                                <Text style={styles.statusText}>
                                    {localUser?.status || 'Hey there! I am using LumeChat'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.qrButton}
                            onPress={() => navigation.navigate('QRCode')}
                        >
                            <MaterialIcons name="qr-code" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>User Settings</List.Subheader>
                    <MenuItem
                        icon="account-circle"
                        title="My Account"
                        subtitle="Profile, Email"
                        onPress={() => navigation.navigate('Profile')}
                    />
                    <MenuItem
                        icon="privacy-tip"
                        title="Privacy & Safety"
                        onPress={() => navigation.navigate('Privacy')}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>App Settings</List.Subheader>
                    <MenuItem
                        icon="notifications"
                        title="Notifications"
                        onPress={() => navigation.navigate('Notifications')}
                    />
                    <MenuItem
                        icon="color-lens"
                        title="Appearance"
                        subtitle="Theme, Font size"
                        onPress={() => navigation.navigate('Theme')}
                    />
                    <MenuItem
                        icon="security"
                        title="Security"
                        onPress={() => navigation.navigate('Security')}
                    />
                </List.Section>

                <View style={styles.logoutContainer}>
                    <LogoutButton />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    profileCard: {
        margin: 16,
        borderRadius: 16,
        padding: 16,
        elevation: 8,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    profileName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileUsername: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    qrButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 8,
        borderRadius: 12,
    },
    menuItemContainer: {
        marginHorizontal: 16,
        marginVertical: 6,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(114, 137, 218, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    menuTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    menuSubtitle: {
        color: '#72767D',
        fontSize: 13,
        marginTop: 2,
    },
    sectionHeader: {
        color: '#7289DA',
        fontSize: 13,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    logoutContainer: {
        margin: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusIcon: {
        marginRight: 4,
    },
    statusText: {
        color: '#B9BBBE',
        fontSize: 13,
        flex: 1,
    },
});

export default SettingsScreen;
