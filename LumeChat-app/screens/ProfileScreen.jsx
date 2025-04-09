import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, Image, 
    TextInput, StyleSheet, Alert, ActivityIndicator, Animated, Easing 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { profileService } from '../services/profile.service';
import { authService } from '../services/auth.service';
import LogoutButton from '../components/LogoutButton';
import { Dialog, Portal } from 'react-native-paper';

const STATUS_OPTIONS = [
    { icon: 'sentiment-satisfied', text: 'Available', color: '#43B581' },
    { icon: 'schedule', text: 'Away', color: '#FAA61A' },
    { icon: 'do-not-disturb-on', text: 'Do Not Disturb', color: '#F04747' },
    { icon: 'remove-circle-outline', text: 'Offline', color: '#747F8D' },
    { icon: 'edit', text: 'Hey there! I am using LumeChat', color: '#7289DA' },
];

const ProfileScreen = ({ navigation }) => {
    const user = useSelector(state => state.user);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [error, setError] = useState(null);
    const [tempValues, setTempValues] = useState({});
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [statusDialogVisible, setStatusDialogVisible] = useState(false);
    const [customStatusInput, setCustomStatusInput] = useState('');

    useEffect(() => {
        const loadProfileData = async () => {
            setIsLoading(true);
            try {
                const data = await profileService.getProfile(user._id);
                setProfile(data);
                dispatch({ type: 'UPDATE_USER', payload: data });
            } catch (error) {
                console.error('Profile load error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Subscribe to profile updates
        const unsubscribe = profileService.subscribe('profileUpdate', (updatedProfile) => {
            setProfile(updatedProfile);
            dispatch({ type: 'UPDATE_USER', payload: updatedProfile });
        });

        loadProfileData();
        return () => unsubscribe();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const data = await profileService.getProfile(user._id);
            setProfile(data);
            // Update Redux store with fresh data including profilePic
            dispatch({ type: 'UPDATE_USER', payload: data });
            console.log('Profile loaded with picture:', data);
        } catch (error) {
            console.error('Profile load error:', error);
            Alert.alert('Error', error.message || 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const showError = (message) => {
        Alert.alert(
            'Error',
            message,
            [{ text: 'OK', onPress: () => setError(null) }],
            { cancelable: true }
        );
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            "Update Profile Picture",
            "Choose a source",
            [
                {
                    text: "Camera",
                    onPress: handleCameraImage,
                    icon: "camera"
                },
                {
                    text: "Gallery",
                    onPress: handleGalleryImage,
                    icon: "image"
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleCameraImage = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                await handleImageUpload(result.assets[0].uri);
            }
        } catch (error) {
            showError('Failed to take photo');
        }
    };

    const handleGalleryImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery permission is required');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                await handleImageUpload(result.assets[0].uri);
            }
        } catch (error) {
            showError('Failed to pick image');
        }
    };

    const handleImageUpload = async (imageUri) => {
        try {
            await profileService.uploadProfilePicture(user._id, imageUri);
            await loadProfile();
            Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error) {
            showError(error.message || 'Failed to upload profile picture');
        }
    };

    const handleFieldChange = (fieldKey, value) => {
        setTempValues(prev => ({ ...prev, [fieldKey]: value }));
    };

    const handleSaveField = async (fieldKey) => {
        const value = tempValues[fieldKey];
        if (!value?.trim()) {
            Alert.alert('Error', 'Field cannot be empty');
            return;
        }

        try {
            const updateData = {};
            if (fieldKey === 'fullName') {
                updateData.fullName = value;
            } else if (fieldKey === 'phoneNumber') {
                updateData.phoneNumber = value;
            } else if (fieldKey === 'status') {
                updateData.status = value;
            }

            console.log('Sending update:', updateData);
            const response = await profileService.updateProfile(user._id, updateData);

            if (response) {
                setProfile(prev => ({ ...prev, [fieldKey]: value }));
                dispatch({
                    type: 'SET_USER',
                    payload: {
                        ...user,
                        [fieldKey]: value
                    }
                });
                
                setEditingField(null);
                setTempValues(prev => ({ ...prev, [fieldKey]: '' }));
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        }
    };

    const handleStatusSelect = async (option) => {
        if (option.text === 'Custom Status...') {
            setCustomStatusInput('');
            return;
        }

        try {
            const response = await profileService.updateProfile(user._id, {
                status: option.text
            });
            setProfile(prev => ({ ...prev, status: option.text }));
            setStatusDialogVisible(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleCustomStatusSave = async () => {
        if (!customStatusInput.trim()) {
            return;
        }

        try {
            const response = await profileService.updateProfile(user._id, {
                status: customStatusInput
            });
            setProfile(prev => ({ ...prev, status: customStatusInput }));
            setStatusDialogVisible(false);
            setCustomStatusInput('');
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await profileService.deleteAccount(user._id);
                            dispatch({ type: 'CLEAR_USER' });
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'LoginScreen' }],
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const renderProfileField = (label, value, fieldKey, icon) => (
        <View style={styles.fieldContainer}>
            <MaterialIcons name={icon} size={24} color="#8e9297" />
            <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {editingField === fieldKey ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={styles.fieldInput}
                            value={tempValues[fieldKey] || value}
                            onChangeText={(text) => handleFieldChange(fieldKey, text)}
                            autoFocus
                        />
                        <TouchableOpacity 
                            style={styles.saveButton}
                            onPress={() => handleSaveField(fieldKey)}
                        >
                            <MaterialIcons name="check" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.fieldValueContainer}
                        onPress={() => setEditingField(fieldKey)}
                    >
                        <Text style={styles.fieldValue}>{value}</Text>
                        <MaterialIcons name="edit" size={20} color="#8e9297" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderStatusSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <TouchableOpacity 
                style={styles.statusCard}
                onPress={() => setStatusDialogVisible(true)}
            >
                <View style={styles.statusContent}>
                    <MaterialIcons 
                        name={STATUS_OPTIONS.find(opt => opt.text === profile?.status)?.icon || 'mood'}
                        size={24} 
                        color={STATUS_OPTIONS.find(opt => opt.text === profile?.status)?.color || '#7289DA'}
                    />
                    <Text style={styles.statusText}>
                        {profile?.status || 'Set a status'}
                    </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#72767D" />
            </TouchableOpacity>
        </View>
    );

    const renderStatusDialog = () => (
        <Portal>
            <Dialog
                visible={statusDialogVisible}
                onDismiss={() => setStatusDialogVisible(false)}
                style={styles.dialog}
            >
                <Dialog.Title style={styles.dialogTitle}>Set Status</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        {STATUS_OPTIONS.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.statusOption}
                                onPress={() => {
                                    if (option.text === 'Custom Status...') {
                                        setCustomStatusInput('');
                                        return;
                                    }
                                    handleStatusSelect(option);
                                }}
                            >
                                <MaterialIcons name={option.icon} size={24} color={option.color} />
                                <Text style={styles.statusOptionText}>{option.text}</Text>
                            </TouchableOpacity>
                        ))}
                        {customStatusInput !== null && (
                            <View style={styles.customStatusInput}>
                                <TextInput
                                    value={customStatusInput}
                                    onChangeText={setCustomStatusInput}
                                    placeholder="What's on your mind?"
                                    placeholderTextColor="#72767D"
                                    style={styles.input}
                                    maxLength={30}
                                />
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleCustomStatusSave}
                                >
                                    <MaterialIcons name="check" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </Dialog.Content>
            </Dialog>
        </Portal>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7289da" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#7289DA', '#4752C4']}
                style={styles.headerContainer}
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.profileImageContainer}
                        onPress={showImagePickerOptions}
                    >
                        {profile?.profilePic ? (
                            <Image 
                                source={{ uri: profile.profilePic }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <LinearGradient
                                colors={['#5865F2', '#4752C4']}
                                style={styles.placeholderContainer}
                            >
                                <MaterialIcons name="person" size={40} color="#fff" />
                            </LinearGradient>
                        )}
                        <LinearGradient
                            colors={['#43B581', '#3CA374']}
                            style={styles.editButton}
                        >
                            <MaterialIcons name="camera-alt" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.displayName}>{profile?.fullName}</Text>
                    <Text style={styles.username}>@{profile?.username}</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.statsContainer}>
                    {[
                        { icon: 'message', label: 'Messages', value: '2.5K' },
                        { icon: 'group', label: 'Friends', value: '342' },
                        { icon: 'folder', label: 'Files', value: '128' }
                    ].map((stat, index) => (
                        <View key={index} style={styles.statItem}>
                            <MaterialIcons name={stat.icon} size={24} color="#7289DA" />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {renderStatusSection()}
                {renderStatusDialog()}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    {[
                        { icon: 'person', label: 'Full Name', value: user?.fullName, key: 'fullName' },
                        { icon: 'phone', label: 'Phone Number', value: user?.phoneNumber || 'Add phone number', key: 'phoneNumber' },
                        { icon: 'email', label: 'Email', value: user?.email, readonly: true }
                    ].map((detail, index) => (
                        <TouchableOpacity 
                            key={index}
                            style={styles.detailCard}
                            onPress={() => !detail.readonly && setEditingField(detail.key)}
                        >
                            <MaterialIcons name={detail.icon} size={24} color="#7289DA" />
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>{detail.label}</Text>
                                {editingField === detail.key ? (
                                    <View style={styles.editContainer}>
                                        <TextInput
                                            style={styles.detailInput}
                                            value={tempValues[detail.key] || detail.value}
                                            onChangeText={(text) => handleFieldChange(detail.key, text)}
                                            onBlur={() => handleSaveField(detail.key)}
                                        />
                                    </View>
                                ) : (
                                    <Text style={styles.detailValue}>{detail.value}</Text>
                                )}
                            </View>
                            <MaterialIcons name="edit" size={20} color="#8e9297" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={handleDeleteAccount}
                >
                    <MaterialIcons name="delete-forever" size={24} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#36393F',
    },
    headerContainer: {
        paddingTop: 60,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        padding: 20,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        elevation: 8,
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 12,
    },
    username: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2F3136',
        borderRadius: 16,
        padding: 16,
        marginTop: -30,
        elevation: 4,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabel: {
        color: '#8e9297',
        fontSize: 12,
        marginTop: 2,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7289DA',
        marginBottom: 12,
    },
    bioCard: {
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
        minHeight: 100,
    },
    bioInput: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    bioText: {
        color: '#8e9297',
        fontSize: 16,
    },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    detailContent: {
        flex: 1,
        marginLeft: 12,
    },
    detailLabel: {
        color: '#8e9297',
        fontSize: 12,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: 4,
    },
    detailInput: {
        color: '#FFFFFF',
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#7289DA',
    },
    statusCard: {
        backgroundColor: '#2F3136',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 12,
    },
    dialog: {
        backgroundColor: '#2F3136',
        borderRadius: 12,
    },
    dialogTitle: {
        color: '#FFFFFF',
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    statusOptionText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 12,
    },
    customStatusInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202225',
        borderRadius: 8,
        marginTop: 12,
        padding: 8,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: '#43B581',
        borderRadius: 8,
        padding: 8,
        marginLeft: 8,
    },
    deleteButton: {
        backgroundColor: '#f04747',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 32,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    }
});

export default ProfileScreen;
