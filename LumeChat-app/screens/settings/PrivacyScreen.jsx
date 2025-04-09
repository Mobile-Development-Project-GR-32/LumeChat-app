import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { List, Switch, Text, Divider, Dialog, Portal, RadioButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { settingsHelpers } from '../../services/settings.service';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const PrivacyOptionCard = ({ title, value, icon, options, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const rotateAnim = new Animated.Value(0);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
        Animated.spring(rotateAnim, {
            toValue: isExpanded ? 0 : 1,
            useNativeDriver: true,
        }).start();
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    return (
        <View style={styles.optionCard}>
            <TouchableOpacity onPress={toggleExpand}>
                <LinearGradient
                    colors={['#40444B', '#2F3136']}
                    style={styles.optionHeader}
                >
                    <MaterialIcons name={icon} size={24} color="#7289DA" />
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>{title}</Text>
                        <Text style={styles.optionValue}>{value}</Text>
                    </View>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <MaterialIcons name="expand-more" size={24} color="#FFFFFF" />
                    </Animated.View>
                </LinearGradient>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionItem}
                            onPress={() => {
                                onSelect(option);
                                toggleExpand();
                            }}
                        >
                            <Text style={[
                                styles.optionItemText,
                                value === option && styles.selectedOption
                            ]}>
                                {option}
                            </Text>
                            {value === option && (
                                <MaterialIcons name="check" size={20} color="#43B581" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const PrivacyScreen = () => {
    const user = useSelector(state => state.user);
    const [settings, setSettings] = useState({
        lastSeen: 'everyone',
        profilePhoto: 'everyone',
        about: 'everyone',
        status: 'contacts',
        readReceipts: true
    });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [activeOption, setActiveOption] = useState(null);

    const updatePrivacySetting = async (key, value) => {
        try {
            const updatedSettings = { ...settings, [key]: value };
            await settingsHelpers.updatePrivacy(user._id, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Privacy update error:', error);
        }
    };

    const showDialog = (option) => {
        setActiveOption(option);
        setDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
        setActiveOption(null);
    };

    const handleOptionSelect = (value) => {
        updatePrivacySetting(activeOption, value);
        hideDialog();
    };

    const options = ['everyone', 'contacts', 'nobody'];

    return (
        <LinearGradient colors={['#202225', '#36393F']} style={styles.container}>
            <ScrollView>
                <List.Section>
                    <List.Subheader style={styles.sectionHeader}>Privacy Settings</List.Subheader>
                    <List.Item
                        title="Last Seen"
                        description={settings.lastSeen}
                        left={props => <MaterialIcons {...props} name="visibility" size={24} color="#7289DA" />}
                        right={props => <MaterialIcons {...props} name="chevron-right" size={24} color="#72767D" />}
                        onPress={() => showDialog('lastSeen')}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <Divider />
                    <List.Item
                        title="Profile Photo"
                        description={settings.profilePhoto}
                        left={props => <MaterialIcons {...props} name="photo" size={24} color="#7289DA" />}
                        right={props => <MaterialIcons {...props} name="chevron-right" size={24} color="#72767D" />}
                        onPress={() => showDialog('profilePhoto')}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                    <Divider />
                    <List.Item
                        title="Read Receipts"
                        description="Show when you've read messages"
                        left={props => <MaterialIcons {...props} name="done-all" size={24} color="#7289DA" />}
                        right={() => (
                            <Switch
                                value={settings.readReceipts}
                                onValueChange={(value) => updatePrivacySetting('readReceipts', value)}
                            />
                        )}
                        style={styles.menuItem}
                        titleStyle={styles.menuTitle}
                        descriptionStyle={styles.menuSubtitle}
                    />
                </List.Section>
            </ScrollView>

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={hideDialog} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Who can see this?</Dialog.Title>
                    <Dialog.Content>
                        <RadioButton.Group 
                            onValueChange={handleOptionSelect} 
                            value={settings[activeOption]}
                        >
                            {options.map((option) => (
                                <RadioButton.Item
                                    key={option}
                                    label={option.charAt(0).toUpperCase() + option.slice(1)}
                                    value={option}
                                    style={styles.radioItem}
                                    labelStyle={styles.radioLabel}
                                    color="#7289DA"
                                />
                            ))}
                        </RadioButton.Group>
                    </Dialog.Content>
                </Dialog>
            </Portal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#36393F',
    },
    optionValue: {
        color: '#72767D',
        marginRight: 8,
    },
    optionCard: {
        marginVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    optionContent: {
        flex: 1,
        marginLeft: 16,
    },
    optionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    optionsContainer: {
        backgroundColor: '#2F3136',
        paddingVertical: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    optionItemText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    selectedOption: {
        color: '#43B581',
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
    },
    dialog: {
        backgroundColor: '#2F3136',
    },
    dialogTitle: {
        color: '#FFFFFF',
    },
    radioItem: {
        paddingVertical: 8,
    },
    radioLabel: {
        color: '#FFFFFF',
    }
});

export default PrivacyScreen;
