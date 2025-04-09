import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Switch } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { settingsHelpers } from '../../services/settings.service';

const SecurityScreen = () => {
    const user = useSelector(state => state.user);
    const [settings, setSettings] = useState({
        screenLock: false,
        fingerprintLock: false,
        twoFactorAuth: false
    });

    const updateSecuritySetting = async (key, value) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            await settingsHelpers.updateSecurity(user._id, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Security update error:', error);
        }
    };

    return (
        <LinearGradient colors={['#202225', '#36393F']} style={styles.container}>
            <ScrollView>
                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>App Security</List.Subheader>
                    <List.Item
                        title="Screen Lock"
                        description="Lock app with device PIN or pattern"
                        left={props => <MaterialIcons {...props} name="screen-lock-portrait" size={24} color="#7289DA" />}
                        right={() => <Switch value={settings.screenLock} onValueChange={value => updateSecuritySetting('screenLock', value)} />}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <List.Item
                        title="Fingerprint Lock"
                        description="Use biometric authentication"
                        left={props => <MaterialIcons {...props} name="fingerprint" size={24} color="#7289DA" />}
                        right={() => <Switch value={settings.fingerprintLock} onValueChange={value => updateSecuritySetting('fingerprintLock', value)} />}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>Account Security</List.Subheader>
                    <List.Item
                        title="Two-Factor Authentication"
                        description="Add an extra layer of security"
                        left={props => <MaterialIcons {...props} name="security" size={24} color="#7289DA" />}
                        right={() => <Switch value={settings.twoFactorAuth} onValueChange={value => updateSecuritySetting('twoFactorAuth', value)} />}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                </List.Section>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    menuItem: {
        backgroundColor: '#2F3136',
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 8,
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
    }
});

export default SecurityScreen;
