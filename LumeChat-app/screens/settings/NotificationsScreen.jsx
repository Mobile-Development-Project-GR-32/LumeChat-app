import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Switch } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { settingsHelpers } from '../../services/settings.service';

const NotificationsScreen = () => {
    const user = useSelector(state => state.user);
    const [settings, setSettings] = useState({
        messagePreview: true,
        sound: true,
        vibrateMode: true,
        useHighPriority: true
    });

    const updateNotificationSetting = async (key, value) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            await settingsHelpers.updateNotifications(user._id, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Notification update error:', error);
        }
    };

    return (
        <LinearGradient colors={['#202225', '#36393F']} style={styles.container}>
            <ScrollView>
                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>Message Notifications</List.Subheader>
                    <List.Item
                        title="Message Previews"
                        description="Show message content in notifications"
                        left={props => <MaterialIcons {...props} name="message" size={24} color="#7289DA" />}
                        right={() => <Switch value={settings.messagePreview} onValueChange={value => updateNotificationSetting('messagePreview', value)} />}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <List.Item
                        title="Sound"
                        description="Play sound for new messages"
                        left={props => <MaterialIcons {...props} name="volume-up" size={24} color="#7289DA" />}
                        right={() => <Switch value={settings.sound} onValueChange={value => updateNotificationSetting('sound', value)} />}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <List.Item
                        title="Vibration"
                        description="Vibrate on notifications"
                        left={props => <MaterialIcons {...props} name="vibration" size={24} color="#7289DA" />}
                        right={() => <Switch value={settings.vibrateMode} onValueChange={value => updateNotificationSetting('vibrateMode', value)} />}
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

export default NotificationsScreen;
