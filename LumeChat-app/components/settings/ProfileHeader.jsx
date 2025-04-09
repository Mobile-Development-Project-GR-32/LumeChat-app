import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Text, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const ProfileHeader = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const user = useSelector(state => state.user);
    
    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity 
                style={styles.profileSection}
                onPress={() => navigation.navigate('EditProfile')}
            >
                <Avatar.Image 
                    size={80} 
                    source={user?.profilePic ? { uri: user.profilePic } : require('../../assets/default-avatar.png')} 
                />
                <View style={styles.userInfo}>
                    <Text style={styles.name}>{user?.fullName || 'User Name'}</Text>
                    <Text style={styles.status}>{user?.bio || 'Hey there! I am using LumeChat'}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.qrCode}
                    onPress={() => navigation.navigate('QRCode')}
                >
                    <Avatar.Icon 
                        size={40} 
                        icon="qrcode" 
                        color={theme.colors.primary}
                        style={{ backgroundColor: 'transparent' }}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        elevation: 1,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    status: {
        marginTop: 4,
        opacity: 0.7,
    },
    qrCode: {
        marginLeft: 8,
    }
});

export default ProfileHeader;
