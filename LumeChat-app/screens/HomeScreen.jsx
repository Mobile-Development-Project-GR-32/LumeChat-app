import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Add this import
import { channelService } from '../services/channel.service';
import { conversationService } from '../services/conversation.service';
import BottomNavBar from '../components/BottomNavBar';
import SideDrawer from '../components/SideDrawer';
import SearchScreen from './SearchScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { userStatusManager } from '../utils/userStatusManager';

// Conversation Item component for direct messages and channels
const ConversationItem = ({ conversation, navigation }) => (
  <TouchableOpacity 
    onPress={() => {
      if (conversation.isChannel) {
        navigation.navigate('ChannelChat', { channel: conversation });
      } else {
        navigation.navigate('DirectMessages', { 
          userId: conversation.userId, 
          userName: conversation.name,
          userAvatar: conversation.photo || null
        });
      }
    }}
    style={[
      styles.conversationItem, 
      conversation.isChannel && styles.channelConversationItem,
      conversation.unreadCount > 0 && styles.unreadConversationItem
    ]}
  >
    <View style={styles.avatarContainer}>
      {conversation.isChannel ? (
        <View style={[styles.channelIconContainer, { backgroundColor: conversation.isPublic ? '#7289da' : '#747f8d' }]}>
          <MaterialIcons 
            name={conversation.isPublic ? "tag" : "lock"} 
            size={20} 
            color="#ffffff" 
          />
        </View>
      ) : (
        <>
          {conversation.photo ? (
            <Image source={{ uri: conversation.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#43b581' }]}>
              <Text style={styles.avatarInitial}>
                {conversation.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.statusIndicator, { backgroundColor: '#43b581' }]} />
        </>
      )}
    </View>
    
    <View style={styles.conversationContent}>
      <View style={styles.conversationHeader}>
        <Text style={[
          styles.conversationName,
          conversation.unreadCount > 0 && styles.unreadText
        ]}>
          {conversation.isChannel ? `# ${conversation.name}` : conversation.name}
        </Text>
        <Text style={[
          styles.timeStamp,
          conversation.unreadCount > 0 && styles.unreadTimeStamp
        ]}>
          {conversation.lastMessage?.time || ''}
        </Text>
      </View>
      
      <View style={styles.messageInfoContainer}>
        {conversation.isChannel && (
          <Text style={styles.channelTypeTag}>
            {conversation.isPublic ? 'Public' : 'Private'}
          </Text>
        )}
        <Text 
          style={[
            styles.lastMessageText, 
            conversation.isChannel && styles.channelMessageText,
            conversation.unreadCount > 0 && styles.unreadText
          ]} 
          numberOfLines={1}
        >
          {conversation.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
    </View>
    
    {conversation.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadCount}>
          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// Channel Item component for channels list
const ChannelItem = ({ channel, navigation }) => {
  // Ensure unreadCount is treated as a number
  const unreadCount = parseInt(channel.unreadCount || 0);
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ChannelChat', {channel: channel})}
      style={[
        styles.channelItem, 
        channel.isActive && styles.activeChannel,
        unreadCount > 0 && styles.unreadChannelItem
      ]}
    >
      <View style={[
        styles.channelIconContainer,
        unreadCount > 0 && styles.unreadChannelIconContainer
      ]}>
        <MaterialIcons 
          name={channel.isPublic ? "tag" : "lock"} 
          size={20} 
          color={unreadCount > 0 ? "#ffffff" : "#8e9297"} 
        />
      </View>
      <View style={styles.channelContent}>
        <Text style={[
          styles.channelName,
          unreadCount > 0 && styles.unreadText
        ]}>
          {channel.name}
        </Text>
        {channel.description && (
          <Text style={[
            styles.channelDescription,
            unreadCount > 0 && styles.unreadChannelDescription
          ]} numberOfLines={1}>
            {channel.description}
          </Text>
        )}
      </View>
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const CategoryHeader = ({ name, count }) => (
  <View style={styles.categoryHeader}>
    <View style={styles.categoryLeft}>
      <MaterialIcons name="arrow-drop-down" size={24} color="#8e9297" />
      <Text style={styles.categoryText}>{name}</Text>
    </View>
    <Text style={styles.categoryCount}>{count}</Text>
  </View>
);

const HomeScreen = ({ route, navigation }) => {
  const user = useSelector((state) => state.user);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const DRAWER_WIDTH = 250;

  const mockContacts = [
    { name: 'John Doe', isOnline: true, color: '#7289da' },
    { name: 'Jane Smith', isOnline: true, color: '#43b581' },
    { name: 'Mike Johnson', isOnline: false, color: '#faa61a' },
  ];

  const [channels, setChannels] = useState({
    public: [],
    private: []
  });

  // Fetch conversations and channels
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch conversations
      if (user?._id) {
        const conversationsData = await conversationService.getAllConversations(user._id);
        
        if (conversationsData && conversationsData.conversations) {
          // Format conversations for display
          const formattedConversations = conversationsData.conversations.map(
            conversation => conversationService.formatForDisplay(conversation)
          );
          setConversations(formattedConversations);
        }
        
        // Fetch channels
        const publicData = await channelService.getPublicChannels(user._id);
        const privateData = await channelService.getPrivateChannels(user._id);

        setChannels({
          public: publicData || [],
          private: privateData || []
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load conversations and channels');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab('home');
      console.log('HomeScreen is in focus, refreshing data...');
      if (user?._id) {
        fetchData();
      }
      return () => {
        // Cleanup function when screen loses focus (optional)
      };
    }, [user?._id])
  );

  useEffect(() => {
    if (user?._id) {
      fetchData();
      
      // Set up real-time listener for conversation updates
      const cleanupListener = conversationService.setupRealtimeListener(
        user._id,
        (update) => {
          if (update.type === 'update') {
            // Refresh the conversation list when we get an update
            fetchData();
          }
        }
      );
      
      return () => {
        // Clean up the listener when component unmounts
        if (cleanupListener) cleanupListener();
      };
    } else {
      console.log('No user ID found, user state:', user);
      navigation.replace('LoginScreen');
    }
  }, [user]);

  // Refresh data when coming back from other screens
  useEffect(() => {
    if (route.params?.refresh) {
      fetchData();
      // Clear the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  useEffect(() => {
    let statusTools = null;
    
    const initializeStatusManager = async () => {
      if (user?._id) {
        try {
          // Initialize the status manager and store the returned tools
          statusTools = await userStatusManager.initialize(user._id);
          console.log('Status manager initialized successfully');
        } catch (error) {
          console.error('Failed to initialize status manager:', error);
        }
      }
    };
    
    initializeStatusManager();
    
    // Clean up on unmount
    return () => {
      if (statusTools) {
        statusTools.setStatus('offline');
        statusTools.cleanup();
      }
    };
  }, [user?._id]);

  const getProfileImage = () => {
    if (user?.profilePic) {
      return { uri: user.profilePic };
    }
    return require('../assets/default-avatar.png');
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'home':
        // Already on home, do nothing or refresh
        break;
      case 'notifications':
        navigation.navigate('Notifications_Screen');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
    }
  };

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const handleScreenPress = () => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  };

  // Get filtered data based on selected tab
  const getFilteredData = () => {
    switch (selectedTab) {
      case 'public':
      case 'private':
        // For channel tabs, we'll use the channel data from renderChannels
        return [];
      case 'all':
      default:
        return conversations;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color="#8e9297" />
      <Text style={styles.emptyText}>
        {selectedTab === 'all' ? 'No conversations yet' : 
         selectedTab === 'public' ? 'No public channels yet' : 'No private channels yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {selectedTab === 'all' ? 'Start chatting with someone or join a channel' : 
         'Join or create a new channel'}
      </Text>
    </View>
  );

  const renderConversations = () => {
    const filteredData = getFilteredData();
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7289da" />
        </View>
      );
    }
    
    if (filteredData.length === 0 && selectedTab === 'all') {
      return renderEmptyState();
    }
    
    // Show all conversations in a flat list, similar to WhatsApp
    return (
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem 
            conversation={item}
            navigation={navigation}
          />
        )}
        contentContainerStyle={styles.conversationsList}
      />
    );
  };

  const renderChannels = () => {
    const currentChannels = channels[selectedTab] || [];
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7289da" />
        </View>
      );
    }

    // Check if currentChannels is an array and has data
    if (!Array.isArray(currentChannels) || currentChannels.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedTab === 'public' ? 'No public channels found' : 'No private channels found'}
          </Text>
        </View>
      );
    }

    // Debug the channels to see if they have unreadCount
    console.log('Channels for tab', selectedTab, currentChannels.map(c => ({
      name: c.name,
      unreadCount: c.unreadCount,
      id: c.id
    })));

    // Group channels by category if they're not already grouped
    const groupedChannels = currentChannels.reduce((acc, channel) => {
      const category = channel.category || 'GENERAL';
      if (!acc[category]) {
        acc[category] = { category, channels: [] };
      }
      acc[category].channels.push({
        ...channel,
        unreadCount: parseInt(channel.unreadCount || 0) // Ensure unreadCount is a number
      });
      return acc;
    }, {});

    // Convert grouped channels object to array
    const categorizedChannels = Object.values(groupedChannels);

    return categorizedChannels.map((category, categoryIndex) => (
      <View key={`category-${categoryIndex}`}>
        <CategoryHeader name={category.category} count={category.channels.length} />
        {Array.isArray(category.channels) && category.channels.map((channel, channelIndex) => (
          <ChannelItem 
            key={`${category.category}-${channel.id || channel.name}-${channelIndex}`}
            channel={{
              ...channel,
              isPublic: selectedTab === 'public',
              isChannel: true
            }}
            navigation={navigation}
          />
        ))}
      </View>
    ));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
        <MaterialIcons name="menu" size={24} color="#8e9297" />
      </TouchableOpacity>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setIsSearchVisible(true)}
        >
          <MaterialIcons name="search" size={24} color="#8e9297" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateChannel', { existingChannels: channels })}
        >
          <MaterialIcons name="add-circle" size={24} color="#7289da" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SideDrawer 
        isOpen={isDrawerOpen}
        drawerWidth={DRAWER_WIDTH}
        contacts={mockContacts}
      />
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleScreenPress}
        style={[
          styles.mainContent,
          isDrawerOpen && styles.dimmedBackground
        ]}
      >
        {renderHeader()}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'all' && styles.selectedTab]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={styles.tabText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'public' && styles.selectedTab]}
            onPress={() => setSelectedTab('public')}
          >
            <Text style={styles.tabText}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'private' && styles.selectedTab]}
            onPress={() => setSelectedTab('private')}
          >
            <Text style={styles.tabText}>Private</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Show correct content based on selected tab */}
          {selectedTab === 'public' || selectedTab === 'private' 
            ? renderChannels() 
            : renderConversations()}
        </View>

        <BottomNavBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </TouchableOpacity>
      <SearchScreen 
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
        userId={user._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2f3136',
    borderBottomColor: '#202225',
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#202225',
    borderRadius: 20,
  },
  createButton: {
    padding: 8,
    backgroundColor: '#202225',
    borderRadius: 20,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#2f3136',
    borderBottomColor: '#202225',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  selectedTab: {
    backgroundColor: '#454950',
  },
  tabText: {
    color: '#dcddde',
    fontWeight: '600',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  conversationsList: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#2f3136',
  },
  channelConversationItem: {
    backgroundColor: '#36393f',
    borderLeftWidth: 3,
    borderLeftColor: '#7289da',
  },
  unreadConversationItem: {
    backgroundColor: '#383b40', // Slightly brighter background for unread items
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#36393f',
  },
  channelIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 4,
  },
  unreadChannelIconContainer: {
    backgroundColor: '#4f545c', // Brighter background for unread items
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  timeStamp: {
    color: '#8e9297',
    fontSize: 12,
  },
  unreadTimeStamp: {
    color: '#ffffff',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelTypeTag: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#4f545c',
    borderRadius: 10,
    color: '#ffffff',
    marginRight: 6,
  },
  lastMessageText: {
    color: '#b9bbbe',
    fontSize: 14,
    flex: 1,
  },
  channelMessageText: {
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#202225',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sectionCount: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  categoryCount: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '500',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#2f3136',
    marginVertical: 1,
  },
  activeChannel: {
    backgroundColor: '#454950',
  },
  unreadChannelItem: {
    backgroundColor: '#383b40', // Slightly brighter background for unread items
    borderLeftWidth: 3,
    borderLeftColor: '#f04747',
  },
  channelContent: {
    flex: 1,
  },
  channelName: {
    color: '#dcddde',
    fontSize: 15,
    fontWeight: '500',
  },
  channelDescription: {
    color: '#8e9297',
    fontSize: 12,
    marginTop: 2,
    maxWidth: '90%',
  },
  unreadChannelDescription: {
    color: '#b9bbbe',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#f04747',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#dcddde',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#8e9297',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  dimmedBackground: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default HomeScreen;