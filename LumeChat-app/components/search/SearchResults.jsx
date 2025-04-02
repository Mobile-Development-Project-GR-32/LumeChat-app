import React from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SearchResults = ({ results, isLoading }) => {
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
    }
});

export default SearchResults;
