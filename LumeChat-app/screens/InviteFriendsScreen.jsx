import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, Image, TextInput 
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { friendService } from '../services/friend.service';
import { inviteService } from '../services/invite.service';

const InviteFriendsScreen = ({ route, navigation }) => {
  const { channelId, channelName } = route.params;
  const user = useSelector(state => state.user);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchFriends();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = friends.filter(
        friend => friend.fullName.toLowerCase().includes(query) || 
                  (friend.username && friend.username.toLowerCase().includes(query))
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);
  
  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const friendsList = await friendService.getFriends(user._id);
      console.log('Friends list:', friendsList);
      setFriends(Array.isArray(friendsList) ? friendsList : []);
      setFilteredFriends(Array.isArray(friendsList) ? friendsList : []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prevSelected => {
      if (prevSelected.includes(friendId)) {
        return prevSelected.filter(id => id !== friendId);
      } else {
        return [...prevSelected, friendId];
      }
    });
  };

  const handleInviteFriends = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to invite');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await inviteService.addFriendsToChannel(user._id, channelId, selectedFriends);
      
      Alert.alert(
        'Success', 
        `${selectedFriends.length} friend(s) added to the channel`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('ChannelProfile', {
              channelId,
              channelName,
              refresh: Date.now() // Add a timestamp to ensure it's always a new value
            })
          }
        ]
      );
    } catch (error) {
      console.error('Error inviting friends:', error);
      Alert.alert('Error', error.message || 'Failed to invite friends');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => toggleFriendSelection(item._id)}
    >
      <View style={styles.checkboxContainer}>
        <View style={[
          styles.checkbox,
          selectedFriends.includes(item._id) && styles.checkboxSelected
        ]}>
          {selectedFriends.includes(item._id) && (
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>
      
      {item.profilePic ? (
        <Image source={{ uri: item.profilePic }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.fullName ? item.fullName[0].toUpperCase() : '?'}
          </Text>
        </View>
      )}
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.fullName}</Text>
        {item.username && (
          <Text style={styles.friendUsername}>@{item.username}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Invite Friends to</Text>
        <Text style={styles.channelName}>{channelName}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#72767D" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor="#72767D"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={24} color="#72767D" />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7289DA" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : filteredFriends.length > 0 ? (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={item => item._id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="people-outline" size={48} color="#72767D" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No friends match your search' : 'No friends found'}
          </Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity 
          style={[
            styles.inviteButton,
            (selectedFriends.length === 0 || isSubmitting) && styles.inviteButtonDisabled
          ]}
          onPress={handleInviteFriends}
          disabled={selectedFriends.length === 0 || isSubmitting}
        >
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.inviteButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.inviteButtonText}>Add to Channel</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  channelName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7289DA',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#DCDDDE',
    marginTop: 16,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F3136',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7289DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7289DA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7289DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendInfo: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  friendUsername: {
    color: '#B9BBBE',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#DCDDDE',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#2F3136',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#202225',
  },
  selectedCount: {
    color: '#B9BBBE',
    fontSize: 14,
    marginBottom: 12,
  },
  inviteButton: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default InviteFriendsScreen;
