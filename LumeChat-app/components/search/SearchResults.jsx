import React from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SearchResults = ({ results, isLoading }) => {
    const navigation = useNavigation();

    const handleUserPress = (item) => {
        // Make sure we're passing a valid user ID to UserProfile screen
        if (item) {
            // Handle different user data structures
            const userId = item._id || item.userId || item.id;
            
            if (userId) {
                console.log('Navigating to UserProfile with userId:', userId);
                navigation.navigate('UserProfile', { userId });
            } else {
                console.error('Invalid user data:', item);
                Alert.alert('Error', 'Cannot view this user profile');
            }
        } else {
            console.error('Invalid user item:', item);
            Alert.alert('Error', 'Cannot view this user profile');
        }
    };

    const renderUserItem = ({ item }) => {
        console.log('Rendering user item:', item); // Debug log
        return (
            <TouchableOpacity 
                style={styles.itemContainer}
                onPress={() => handleUserPress(item)}
            >
                {item.profilePic ? (
                    <Image 
                        source={{ uri: item.profilePic }}
                        style={styles.userAvatar}
                        defaultSource={require('../../assets/default-avatar.png')}
                    />
                ) : (
                    <View style={[styles.iconContainer, styles.userIcon]}>
                        <Text style={styles.userInitial}>
                            {item.fullName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.fullName}</Text>
                    <Text style={styles.itemUsername}>@{item.username}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#8e9297" />
            </TouchableOpacity>
        );
    };

    const sections = [
        {
            title: 'Users',
            data: results.users || []
        },
        {
            title: 'Your Channels',
            data: results.channels?.member || []
        },
        {
            title: 'Public Channels',
            data: results.channels?.public || []
        },
        {
            title: 'Recommended',
            data: results.channels?.recommended || []
        }
    ].filter(section => section.data.length > 0);

    const renderItem = ({ item, section }) => {
        if (section.title === 'Users') {
            return renderUserItem({ item });
        }
        const isUser = section.title === 'Users';
        return (
            <TouchableOpacity style={styles.itemContainer}>
                <View style={[styles.iconContainer, isUser ? styles.userIcon : styles.channelIcon]}>
                    {isUser ? (
                        <Text style={styles.userInitial}>
                            {item.displayName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    ) : (
                        <MaterialIcons 
                            name={item.isPublic ? "tag" : "lock"} 
                            size={20} 
                            color="#8e9297" 
                        />
                    )}
                </View>
                <View style={styles.itemContent}>
                    <Text style={styles.itemName}>
                        {isUser ? item.displayName : item.name}
                    </Text>
                    {item.description && (
                        <Text style={styles.itemDescription} numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#8e9297" />
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7289da" />
            </View>
        );
    }

    return (
        <SectionList
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionCount}>{section.data.length}</Text>
                </View>
            )}
            keyExtractor={(item) => item.id || item._id || item.userId}
            stickySectionHeadersEnabled={true}
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 20,
        backgroundColor: '#2f3136',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8e9297',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionCount: {
        fontSize: 12,
        color: '#8e9297',
        fontWeight: '600',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: '#36393f',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userIcon: {
        backgroundColor: '#7289da',
    },
    channelIcon: {
        backgroundColor: '#2f3136',
    },
    userInitial: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    itemDescription: {
        fontSize: 13,
        color: '#8e9297',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    itemUsername: {
        color: '#72767d',
        fontSize: 14,
        marginTop: 2,
    },
});

export default SearchResults;
