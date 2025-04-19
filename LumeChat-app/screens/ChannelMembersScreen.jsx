import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image, 
  ActivityIndicator, Alert, TextInput, Animated 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { channelService } from '../services/channel.service';

const ChannelMembersScreen = ({ route, navigation }) => {
  const { channelId, channelName } = route.params;
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const user = useSelector(state => state.user);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadMembers();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members.filter(member => 
        (member.displayName || member.fullName || '').toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const memberData = await channelService.getChannelMembers(user._id, channelId);
      console.log('Channel members data:', memberData);
      
      if (Array.isArray(memberData)) {
        setMembers(memberData);
        setFilteredMembers(memberData);
      } else if (memberData && typeof memberData === 'object') {
        const membersArray = Array.isArray(memberData.members) ? memberData.members : [];
        setMembers(membersArray);
        setFilteredMembers(membersArray);
      } else {
        console.warn('Members data is not in expected format:', memberData);
        setMembers([]);
        setFilteredMembers([]);
      }
    } catch (error) {
      console.error('Error loading channel members:', error);
      Alert.alert('Error', 'Failed to load channel members');
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const isUserAdmin = await channelService.isChannelAdmin(user._id, channelId);
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleMemberPress = (member) => {
    if (member && (member.userId || member._id)) {
      navigation.navigate('UserProfile', { 
        userId: member.userId || member._id,
        userName: member.displayName || member.fullName || 'Unknown User'
      });
    } else {
      console.error('Invalid member data:', member);
      Alert.alert('Error', 'Cannot view this user profile');
    }
  };

  const handleManageMember = (member) => {
    if (!isAdmin) return;
    
    // Check if the member is the channel creator
    if (member.isCreator || member.role === 'creator') {
      setActionError('Cannot modify the channel creator');
      // Show error message briefly then clear it
      setTimeout(() => setActionError(null), 3000);
      return;
    }
    
    Alert.alert(
      'Manage Member',
      `What would you like to do with ${member.displayName || member.fullName || 'this member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove from Channel', 
          style: 'destructive',
          onPress: () => removeMember(member)
        },
        { 
          text: 'Make Admin', 
          onPress: () => promoteToAdmin(member)
        }
      ]
    );
  };

  const removeMember = async (member) => {
    try {
      setActionError(null);
      await channelService.manageMember(
        user._id, 
        channelId, 
        member.userId || member._id,
        'remove'
      );
      loadMembers(); // Refresh the list
      Alert.alert('Success', 'Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      if (error.message && error.message.includes('creator')) {
        setActionError('Cannot remove the channel creator');
      } else {
        setActionError(error.message || 'Failed to remove member');
      }
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const promoteToAdmin = async (member) => {
    try {
      setActionError(null);
      await channelService.manageMember(
        user._id, 
        channelId, 
        member.userId || member._id,
        'updateRole',
        'admin'
      );
      loadMembers(); // Refresh the list
      Alert.alert('Success', 'Member promoted to admin');
    } catch (error) {
      console.error('Error promoting member:', error);
      if (error.message && error.message.includes('creator')) {
        setActionError('Cannot modify the channel creator');
      } else {
        setActionError(error.message || 'Failed to promote member');
      }
      setTimeout(() => setActionError(null), 3000);
    }
  };

  // Add a helper function to format role text consistently with capitalization
  const formatRoleText = (role) => {
    if (!role) return 'Member';
    // Capitalize first letter, lowercase the rest
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const renderMember = ({ item }) => (
    <TouchableOpacity 
      style={styles.memberItem}
      onPress={() => handleMemberPress(item)}
      onLongPress={() => isAdmin && !item.isCreator && handleManageMember(item)}
    >
      {item.photoURL || item.profilePic ? (
        <Image 
          source={{ uri: item.photoURL || item.profilePic }} 
          style={styles.memberAvatar} 
        />
      ) : (
        <View style={styles.memberAvatarPlaceholder}>
          <Text style={styles.memberInitial}>
            {(item.displayName || item.fullName || item.username || '?')[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.displayName || item.fullName || item.username || 'Unknown User'}
          {item.isCreator && (
            <Text style={styles.ownerBadge}> • Owner</Text>
          )}
        </Text>
        <Text style={styles.memberRole}>{formatRoleText(item.role)}</Text>
      </View>
      {isAdmin && !item.isCreator ? (
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => handleManageMember(item)}
        >
          <MaterialIcons 
            name="more-vert" 
            size={20} 
            color="#72767D" 
          />
        </TouchableOpacity>
      ) : item.isCreator ? (
        <View style={styles.creatorBadge}>
          <MaterialIcons name="stars" size={20} color="#FAA61A" />
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#36393F', '#202225']} style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#72767D" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor="#72767D"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={24} color="#72767D" />
          </TouchableOpacity>
        )}
      </View>
      
      {actionError && (
        <Animated.View style={styles.errorContainer}>
          <LinearGradient
            colors={['#F04747', '#D03D3D']}
            style={styles.errorContent}
          >
            <MaterialIcons name="error-outline" size={20} color="#FFFFFF" />
            <Text style={styles.errorText}>{actionError}</Text>
          </LinearGradient>
        </Animated.View>
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7289DA" />
        </View>
      ) : filteredMembers.length > 0 ? (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item, index) => (item.userId || item._id || index.toString())}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="group-off" size={48} color="#72767D" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No members found matching your search' : 'No members found'}
          </Text>
        </View>
      )}
      
      {isAdmin && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('InviteMembers', { channelId, channelName })}
        >
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.addButtonGradient}
          >
            <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F3136',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7289DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  ownerBadge: {
    color: '#FAA61A',
    fontWeight: '500',
  },
  memberRole: {
    color: '#B9BBBE',
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#B9BBBE',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  creatorBadge: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 166, 26, 0.1)',
  },
});

export default ChannelMembersScreen;
