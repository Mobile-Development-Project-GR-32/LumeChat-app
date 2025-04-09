import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { settingsHelpers } from '../../services/settings.service';

const ThemeScreen = () => {
    const user = useSelector(state => state.user);
    const [settings, setSettings] = useState({
        mode: 'dark',
        fontSize: 'medium',
        messageLayout: 'cozy'
    });

    const updateThemeSetting = async (key, value) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            await settingsHelpers.updateTheme(user._id, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Theme update error:', error);
        }
    };

    return (
        <LinearGradient colors={['#202225', '#36393F']} style={styles.container}>
            <ScrollView>
                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>Theme</List.Subheader>
                    <List.Item
                        title="Dark"
                        description={settings.mode === 'dark' ? 'Currently selected' : ''}
                        left={props => <MaterialIcons {...props} name="nights-stay" size={24} color="#7289DA" />}
                        right={props => settings.mode === 'dark' && <MaterialIcons {...props} name="check" size={24} color="#43B581" />}
                        onPress={() => updateThemeSetting('mode', 'dark')}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <List.Item
                        title="Light"
                        description={settings.mode === 'light' ? 'Currently selected' : ''}
                        left={props => <MaterialIcons {...props} name="wb-sunny" size={24} color="#7289DA" />}
                        right={props => settings.mode === 'light' && <MaterialIcons {...props} name="check" size={24} color="#43B581" />}
                        onPress={() => updateThemeSetting('mode', 'light')}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>Font Size</List.Subheader>
                    {['small', 'medium', 'large'].map((size) => (
                        <List.Item
                            key={size}
                            title={size.charAt(0).toUpperCase() + size.slice(1)}
                            description={settings.fontSize === size ? 'Currently selected' : ''}
                            left={props => <MaterialIcons {...props} name="format-size" size={24} color="#7289DA" />}
                            right={props => settings.fontSize === size && <MaterialIcons {...props} name="check" size={24} color="#43B581" />}
                            onPress={() => updateThemeSetting('fontSize', size)}
                            style={styles.menuItem}
                            titleStyle={styles.menuTitle}
                            descriptionStyle={styles.menuSubtitle}
                        />
                    ))}
                </List.Section>

                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>Chat Layout</List.Subheader>
                    <List.Item
                        title="Cozy"
                        description="Comfortable spacing between messages"
                        left={props => <MaterialIcons {...props} name="view-agenda" size={24} color="#7289DA" />}
                        right={props => settings.messageLayout === 'cozy' && <MaterialIcons {...props} name="check" size={24} color="#43B581" />}
                        onPress={() => updateThemeSetting('messageLayout', 'cozy')}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <List.Item
                        title="Compact"
                        description="Minimal spacing between messages"
                        left={props => <MaterialIcons {...props} name="view-list" size={24} color="#7289DA" />}
                        right={props => settings.messageLayout === 'compact' && <MaterialIcons {...props} name="check" size={24} color="#43B581" />}
                        onPress={() => updateThemeSetting('messageLayout', 'compact')}
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

export default ThemeScreen;
