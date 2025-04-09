import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';

const LogoutButton = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.signOut();
                            dispatch({ type: 'CLEAR_USER' });
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'LoginScreen' }],
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleLogout}
        >
            <MaterialIcons name="logout" size={24} color="#f04747" />
            <Text style={styles.dangerButtonText}>Logout</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 71, 71, 0.1)',
        padding: 16,
        borderRadius: 12,
    },
    dangerButtonText: {
        color: '#f04747',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
});

export default LogoutButton;
