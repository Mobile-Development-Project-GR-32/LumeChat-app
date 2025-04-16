import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { MaterialIcons } from '@expo/vector-icons';
import { channelService } from '../services/channel.service';
import BottomNavBar from '../components/BottomNavBar';
import SideDrawer from '../components/SideDrawer';
import SearchScreen from './SearchScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { userStatusManager } from '../utils/userStatusManager';

const ChannelItem = ({ channel, navigation }) => (
  <TouchableOpacity 
    onPress={() => navigation.navigate('ChannelChat', {channel: channel})}
    style={[styles.channelItem, channel.isActive && styles.activeChannel]}
  >
    <View style={styles.channelIconContainer}>
      <MaterialIcons 
        name={channel.isPublic ? "tag" : "lock"} 
        size={20} 
        color="#8e9297" 
      />
    </View>
    <View style={styles.channelContent}>
      <Text style={styles.channelName}>{channel.name}</Text>
      {channel.description && (
        <Text style={styles.channelMeta}>
          {channel.members?.length || 0} members • {
            new Date(channel.createdAt).toLocaleDateString()
          }
        </Text>
      )}
    </View>
    {channel.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadCount}>{channel.unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

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
  const [selectedTab, setSelectedTab] = useState('public');
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      console.log('Current user:', user);

      const publicData = await channelService.getPublicChannels(user._id);
      const privateData = await channelService.getPrivateChannels(user._id);

      console.log('Fetched public channels:', publicData);
      console.log('Fetched private channels:', privateData);

      setChannels({
        public: publicData || [],
        private: privateData || []
      });
    } catch (error) {
      console.error('Error fetching channels:', error);
      Alert.alert('Error', 'Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchChannels();
    } else {
      console.log('No user ID found, user state:', user);
      navigation.replace('LoginScreen');
    }
  }, [user]);

  // Refresh channels when coming back from create channel
  useEffect(() => {
    if (route.params?.refresh) {
      fetchChannels();
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
        // Already on home
        break;
      case 'notifications':
        Alert.alert('Coming Soon', 'Notifications feature is coming soon!');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const handleScreenPress = () => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
    }
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

    // Group channels by category if they're not already grouped
    const groupedChannels = currentChannels.reduce((acc, channel) => {
      const category = channel.category || 'GENERAL';
      if (!acc[category]) {
        acc[category] = { category, channels: [] };
      }
      acc[category].channels.push(channel);
      return acc;
    }, {});

    // Convert grouped channels object to array
    const categorizedChannels = Object.values(groupedChannels);

    return categorizedChannels.map((category, categoryIndex) => (
      <View key={`category-${categoryIndex}`}>
        <CategoryHeader name={category.category} count={category.channels.length} />
        {Array.isArray(category.channels) && category.channels.map((channel, channelIndex) => (
          <ChannelItem 
            key={`${category.category}-${channel.name}-${channelIndex}`}
            channel={{
              ...channel,
              isPublic: selectedTab === 'public'
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
            style={[styles.tab, selectedTab === 'public' && styles.selectedTab]}
            onPress={() => setSelectedTab('public')}
          >
            <Text style={styles.tabText}>Public Channels</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'private' && styles.selectedTab]}
            onPress={() => setSelectedTab('private')}
          >
            <Text style={styles.tabText}>Private Channels</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.channelList}>
          {renderChannels()}
        </ScrollView>

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
  channelList: {
    flex: 1,
    paddingTop: 8,
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
  channelIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202225',
    borderRadius: 12,
    marginRight: 12,
  },
  channelContent: {
    flex: 1,
  },
  channelName: {
    color: '#dcddde',
    fontSize: 15,
    fontWeight: '500',
  },
  channelMeta: {
    color: '#8e9297',
    fontSize: 12,
    marginTop: 2,
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
    color: '#8e9297',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
  },
  dimmedBackground: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default HomeScreen;