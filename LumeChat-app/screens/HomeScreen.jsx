import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput } from 'react-native'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { MaterialIcons } from '@expo/vector-icons';

const ChannelCategory = ({ name }) => (
  <View style={styles.categoryContainer}>
    <MaterialIcons name="arrow-drop-down" size={24} color="#8e9297" />
    <Text style={styles.categoryText}>{name}</Text>
  </View>
);

const HomeScreen = ({ route, navigation }) => {
  const user = useSelector((state) => state.user);
  const [selectedTab, setSelectedTab] = useState('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const dummyChannels = {
    public: [
      {
        category: "INFORMATION",
        channels: [
          { name: "announcements", unreadCount: 2 },
          { name: "rules", unreadCount: 0 },
          { name: "welcome", unreadCount: 0 }
        ]
      },
      {
        category: "GENERAL",
        channels: [
          { name: "general-chat", unreadCount: 5 },
          { name: "memes", unreadCount: 12 },
          { name: "off-topic", unreadCount: 3 }
        ]
      },
      {
        category: "STUDY GROUPS",
        channels: [
          { name: "mobile-dev", unreadCount: 8 },
          { name: "web-dev", unreadCount: 0 },
          { name: "algorithms", unreadCount: 1 }
        ]
      }
    ],
    private: [
      {
        category: "PROJECTS",
        channels: [
          { name: "team-alpha", unreadCount: 4 },
          { name: "project-planning", unreadCount: 2 },
          { name: "resources", unreadCount: 0 }
        ]
      },
      {
        category: "VOICE CHANNELS",
        channels: [
          { name: "study-room-1", unreadCount: 0 },
          { name: "gaming", unreadCount: 0 },
          { name: "music", unreadCount: 0 }
        ]
      }
    ]
  };

  const [channels, setChannels] = useState(dummyChannels);
  
  console.log("Current user data:", user); // Debug log

  const getProfileImage = () => {
    if (user?.profilePic) {
      return { uri: user.profilePic };
    }
    // Return default avatar from assets
    return require('../assets/default-avatar.png');
  };

  // Handle new channel creation with better error handling and logging
  React.useEffect(() => {
    if (route.params?.newChannel) {
      const { newChannel } = route.params;
      const channelType = newChannel.isPublic ? 'public' : 'private';
      
      console.log('Creating new channel:', {
        name: newChannel.name,
        category: newChannel.category,
        type: channelType,
        timestamp: new Date().toISOString()
      });

      setChannels(prevChannels => {
        const updatedChannels = { ...prevChannels };
        const categoryIndex = updatedChannels[channelType].findIndex(
          cat => cat.category === newChannel.category
        );

        const newChannelData = {
          id: `${channelType}-${newChannel.name}-${Date.now()}`,
          name: newChannel.name,
          unreadCount: 0,
          description: newChannel.description,
          coverImage: newChannel.coverImage,
          isPublic: channelType === 'public',
          category: newChannel.category,
          createdAt: Date.now()
        };

        if (categoryIndex !== -1) {
          // Add to existing category
          updatedChannels[channelType][categoryIndex].channels = [
            ...updatedChannels[channelType][categoryIndex].channels,
            newChannelData
          ];
        } else {
          // Create new category if it doesn't exist
          if (!Array.isArray(updatedChannels[channelType])) {
            updatedChannels[channelType] = [];
          }
          updatedChannels[channelType].push({
            category: newChannel.category,
            channels: [newChannelData]
          });
        }

        console.log(`Updated channels:`, updatedChannels);
        return updatedChannels;
      });
    }
  }, [route.params?.newChannel]);

  // Update ChannelItem to show privacy indicator
  const ChannelItem = ({ channel }) => (
    <TouchableOpacity 
      style={[styles.channelItem, channel.isActive && styles.activeChannel]}
    >
      <View style={styles.channelIconContainer}>
        <MaterialIcons 
          name={channel.isPublic ? "tag" : "lock"} 
          size={20} 
          color="#8e9297" 
        />
      </View>
      {channel.coverImage && (
        <Image 
          source={{ uri: channel.coverImage }} 
          style={styles.channelCover}
        />
      )}
      <View style={styles.channelContent}>
        <Text style={styles.channelName}>{channel.name}</Text>
        {channel.description && (
          <Text style={styles.channelDescription} numberOfLines={2}>
            {channel.description}
          </Text>
        )}
        {channel.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{channel.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Update renderChannels to properly filter channels
  const renderChannels = () => {
    const currentChannels = channels[selectedTab] || [];
    return currentChannels.map((category, categoryIndex) => (
      <View key={`category-${categoryIndex}`}>
        <ChannelCategory name={category.category} />
        {category.channels
          .map((channel, channelIndex) => (
            <ChannelItem 
              key={`${category.category}-${channel.name}-${channelIndex}`}
              channel={{
                ...channel,
                isPublic: selectedTab === 'public'
              }}
            />
          ))}
      </View>
    ));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {!isSearching ? (
        <>
          <Image 
            source={require('../assets/LumeChatApp-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => setIsSearching(true)}
            >
              <MaterialIcons name="search" size={24} color="#8e9297" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Image 
                source={getProfileImage()}
                style={styles.profilePic}
              />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#8e9297" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels..."
            placeholderTextColor="#8e9297"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity 
            onPress={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
          >
            <MaterialIcons name="close" size={24} color="#8e9297" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
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

      <TouchableOpacity 
        style={styles.createChannelButton}
        onPress={() => navigation.navigate('CreateChannel', { existingChannels: channels })}
      >
        <MaterialIcons name="add-circle" size={24} color="#fff" />
        <Text style={styles.createChannelText}>Create Channel</Text>
      </TouchableOpacity>
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
    padding: 10,
    paddingLeft: 8,
    backgroundColor: '#2f3136',
  },
  logo: {
    width: 200, // Increased from 120
    height: 70,  // Increased from 40
    marginLeft: -75,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#202225', // Added background color for empty state
  },
  profilePic: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  tab: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedTab: {
    backgroundColor: '#404349',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
  },
  channelList: {
    flex: 1,
  },
  createChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7289da',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  createChannelText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    borderRadius: 4,
  },
  activeChannel: {
    backgroundColor: '#404349',
  },
  channelName: {
    color: '#8e9297',
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryText: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  unreadBadge: {
    backgroundColor: '#f04747',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 8,
  },
  channelDescription: {
    color: '#8e9297',
    fontSize: 12,
    marginTop: 2,
  },
  channelCategory: {
    fontSize: 12,
    color: '#8e9297',
    fontStyle: 'italic'
  },
  channelIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  channelContent: {
    flex: 1,
    marginLeft: 8,
  },
  channelCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
});

export default HomeScreen;