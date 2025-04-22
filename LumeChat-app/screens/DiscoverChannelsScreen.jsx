import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    FlatList, Image, ActivityIndicator, TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { channelService } from '../services/channel.service';

const ChannelCard = ({ channel, onPress }) => (
    <TouchableOpacity style={styles.channelCard} onPress={onPress}>
        <View style={styles.channelImageContainer}>
            {channel.coverPhoto ? (
                <Image source={{ uri: channel.coverPhoto }} style={styles.channelImage} />
            ) : (
                <View style={[styles.channelImagePlaceholder, {
                    backgroundColor: channel.isPublic ? '#7289DA' : '#4F545C'
                }]}>
                    <MaterialIcons 
                        name={channel.isPublic ? "group" : "lock"} 
                        size={28} 
                        color="#FFFFFF" 
                    />
                </View>
            )}
        </View>
        <View style={styles.channelInfo}>
            <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
            <Text style={styles.channelDescription} numberOfLines={2}>
                {channel.description || "No description available"}
            </Text>
            <View style={styles.channelStats}>
                <View style={styles.statItem}>
                    <MaterialIcons name="person" size={14} color="#B9BBBE" />
                    <Text style={styles.statText}>{channel.memberCount || 0}</Text>
                </View>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{channel.category}</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

const DiscoverChannelsScreen = ({ navigation }) => {
    const user = useSelector(state => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [trendingChannels, setTrendingChannels] = useState([]);
    const [recommendedChannels, setRecommendedChannels] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState({
        trending: true,
        recommended: true,
        search: false
    });

    useEffect(() => {
        fetchTrendingChannels();
        fetchRecommendedChannels();
    }, []);

    const fetchTrendingChannels = async () => {
        setLoading(prev => ({ ...prev, trending: true }));
        try {
            const data = await channelService.getTrendingChannels(user._id, 10);
            console.log('Trending channels:', data);
            setTrendingChannels(data.trending || []);
        } catch (error) {
            console.error('Error fetching trending channels:', error);
        } finally {
            setLoading(prev => ({ ...prev, trending: false }));
        }
    };

    const fetchRecommendedChannels = async () => {
        setLoading(prev => ({ ...prev, recommended: true }));
        try {
            const data = await channelService.getRecommendedChannels(user._id, 5);
            console.log('Recommended channels:', data);
            setRecommendedChannels(data.recommendations || []);
        } catch (error) {
            console.error('Error fetching recommended channels:', error);
        } finally {
            setLoading(prev => ({ ...prev, recommended: false }));
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        
        setLoading(prev => ({ ...prev, search: true }));
        
        try {
            const data = await channelService.searchChannels(user._id, searchQuery);
            setSearchResults(data.results || []);
        } catch (error) {
            console.error('Error searching channels:', error);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    const handleChannelPress = (channel) => {
        navigation.navigate('ChannelProfile', {
            channelId: channel.id,
            channelName: channel.name
        });
    };

    const renderChannelSection = (title, channels, isLoading, emptyText) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#7289DA" />
                </View>
            ) : channels.length > 0 ? (
                <FlatList
                    data={channels}
                    renderItem={({ item }) => (
                        <ChannelCard 
                            channel={item} 
                            onPress={() => handleChannelPress(item)} 
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.channelList}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
            )}
        </View>
    );

    return (
        <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#72767D" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search channels..."
                    placeholderTextColor="#72767D"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity 
                        onPress={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                        }}
                    >
                        <MaterialIcons name="clear" size={24} color="#72767D" />
                    </TouchableOpacity>
                )}
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {searchQuery.length > 0 ? (
                    renderChannelSection(
                        `Search Results (${searchResults.length})`,
                        searchResults,
                        loading.search,
                        `No channels found for "${searchQuery}"`
                    )
                ) : (
                    <>
                        {renderChannelSection(
                            'Trending Channels',
                            trendingChannels,
                            loading.trending,
                            'No trending channels available'
                        )}
                        
                        {renderChannelSection(
                            'Recommended for You',
                            recommendedChannels,
                            loading.recommended,
                            'No recommendations available'
                        )}
                        
                        <TouchableOpacity 
                            style={styles.createChannelButton}
                            onPress={() => navigation.navigate('CreateChannel')}
                        >
                            <LinearGradient
                                colors={['#7289DA', '#5865F2']}
                                style={styles.createButtonGradient}
                            >
                                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                                <Text style={styles.createButtonText}>Create a New Channel</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202225',
        borderRadius: 24,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    loadingContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    channelList: {
        paddingLeft: 16,
    },
    channelCard: {
        width: 240,
        backgroundColor: '#2F3136',
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
        marginBottom: 4,
    },
    channelImageContainer: {
        height: 100,
    },
    channelImage: {
        width: '100%',
        height: '100%',
    },
    channelImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    channelInfo: {
        padding: 12,
    },
    channelName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    channelDescription: {
        color: '#B9BBBE',
        fontSize: 12,
        marginBottom: 8,
        minHeight: 30,
    },
    channelStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        color: '#B9BBBE',
        fontSize: 12,
        marginLeft: 4,
    },
    categoryBadge: {
        backgroundColor: '#4F545C',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 10,
    },
    emptyContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    emptyText: {
        color: '#72767D',
        fontSize: 14,
        textAlign: 'center',
    },
    createChannelButton: {
        marginHorizontal: 16,
        marginBottom: 40,
        borderRadius: 8,
        overflow: 'hidden',
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    }
});

export default DiscoverChannelsScreen;
