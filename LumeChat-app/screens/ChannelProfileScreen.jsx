import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, 
  TouchableOpacity, Alert, ActivityIndicator, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { Portal } from 'react-native-paper';
import { channelService } from '../services/channel.service';

const ChannelProfileScreen = ({ route, navigation }) => {
  const { channelId, channelName } = route.params || {};
  const [channel, setChannel] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionError, setActionError] = useState(null);
  const user = useSelector(state => state.user);

  useEffect(() => {
    loadChannelData();
  }, [channelId, route.params?.refresh]);

  useEffect(() => {
    if (route.params?.refresh) {
      console.log('Channel profile refreshing data after member change, refresh token:', route.params.refresh);
      loadChannelData();
    }
  }, [route.params?.refresh]);

  const loadChannelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!channelId || !user?._id) {
        console.error('Missing data:', { channelId, userId: user?._id });
        throw new Error('Missing channel ID or user ID');
      }

      console.log('Loading data for channel:', channelId);
      
      const channelData = await channelService.getChannelProfile(user._id, channelId);
      console.log('Received channel data:', channelData);
      
      if (channelData) {
        setChannel(channelData);
      } else {
        setChannel({
          _id: channelId,
          name: channelName,
          description: 'Channel description',
          createdAt: new Date().toISOString()
        });
      }
      
      try {
        const memberData = await channelService.getChannelMembers(user._id, channelId);
        console.log('Channel members:', memberData);
        
        if (Array.isArray(memberData)) {
          setMembers(memberData);
        } else if (memberData && typeof memberData === 'object') {
          setMembers(Array.isArray(memberData.members) ? memberData.members : []);
        } else {
          console.warn('Members data is not in expected format:', memberData);
          setMembers([]);
        }
      } catch (memberError) {
        console.error('Error loading channel members:', memberError);
        setMembers([]);
      }
      
    } catch (error) {
      console.error('Error loading channel profile:', error);
      setError(error.message || 'Failed to load channel information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async () => {
    try {
      Alert.alert('Join Channel', 'Feature coming soon');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join channel');
    }
  };

  const handleLeaveChannel = async () => {
    Alert.alert(
      'Leave Channel',
      'Are you sure you want to leave this channel? You will no longer receive messages from this channel.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave Channel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await channelService.leaveChannel(user._id, channelId);
              Alert.alert(
                'Success', 
                'You have left the channel successfully',
                [
                  { 
                    text: 'OK', 
                    onPress: () => navigation.navigate('HomeScreen', { refresh: true })
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to leave channel');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleInviteUsers = () => {
    navigation.navigate('ChannelInvite', { 
      channelId, 
      channelName: channel?.name 
    });
  };

  const handleAddFriends = () => {
    navigation.navigate('InviteFriends', {
      channelId,
      channelName: channel?.name
    });
  };

  const handleDiscoverChannels = () => {
    navigation.navigate('DiscoverChannels');
  };

  const handleEditChannel = () => {
    navigation.navigate('EditChannel', { 
      channelId, 
      channelName: channel?.name 
    });
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

  const handleMemberLongPress = (member) => {
    if (!isAdmin()) return;
    
    if (member.isCreator || member.role === 'creator') {
      setActionError('Cannot modify channel creator');
      setTimeout(() => setActionError(null), 3000);
      return;
    }
    
    setSelectedMember(member);
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
    setSelectedMember(null);
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await channelService.manageMember(
        user._id, 
        channelId, 
        selectedMember.userId || selectedMember._id,
        'remove'
      );
      
      setMembers(prev => prev.filter(m => 
        (m.userId || m._id) !== (selectedMember.userId || selectedMember._id)
      ));
      
      Alert.alert('Success', `${selectedMember.displayName || selectedMember.fullName || 'Member'} removed from channel`);
    } catch (error) {
      console.error('Error removing member:', error);
      if (error.message && error.message.includes('creator')) {
        setActionError('Cannot remove the channel creator');
      } else {
        setActionError(error.message || 'Failed to remove member');
      }
      setTimeout(() => setActionError(null), 3000);
    } finally {
      handleMenuClose();
    }
  };

  const handleChangeRole = async (newRole) => {
    if (!selectedMember) return;
    
    try {
      await channelService.manageMember(
        user._id, 
        channelId, 
        selectedMember.userId || selectedMember._id,
        'updateRole',
        newRole
      );
      
      setMembers(prev => prev.map(m => {
        if ((m.userId || m._id) === (selectedMember.userId || selectedMember._id)) {
          return { ...m, role: newRole };
        }
        return m;
      }));
      
      Alert.alert('Success', `${selectedMember.displayName || selectedMember.fullName || 'Member'}'s role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating member role:', error);
      if (error.message && error.message.includes('creator')) {
        setActionError('Cannot modify the channel creator');
      } else {
        setActionError(error.message || 'Failed to update member role');
      }
      setTimeout(() => setActionError(null), 3000);
    } finally {
      handleMenuClose();
    }
  };

  const renderMemberMenu = () => {
    if (!menuVisible || !selectedMember) return null;
    
    return (
      <Portal>
        <TouchableWithoutFeedback onPress={handleMenuClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>Manage Member</Text>
                  <Text style={styles.memberName}>
                    {selectedMember.displayName || selectedMember.fullName || 'Unknown User'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleChangeRole('admin')}
                >
                  <MaterialIcons name="star" size={24} color="#FAA61A" />
                  <Text style={styles.menuItemText}>Make Admin</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleChangeRole('moderator')}
                >
                  <MaterialIcons name="shield" size={24} color="#7289DA" />
                  <Text style={styles.menuItemText}>Make Moderator</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleChangeRole('member')}
                >
                  <MaterialIcons name="person" size={24} color="#43B581" />
                  <Text style={styles.menuItemText}>Set as Member</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity
                  style={[styles.menuItem, styles.dangerItem]}
                  onPress={handleRemoveMember}
                >
                  <MaterialIcons name="person-remove" size={24} color="#F04747" />
                  <Text style={[styles.menuItemText, styles.dangerText]}>Remove from Channel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Portal>
    );
  };

  const isAdmin = () => {
    return channel?.isCreator || channel?.isAdmin;
  };

  const formatRoleText = (role) => {
    if (!role) return 'Member';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7289DA" />
        <Text style={styles.loadingText}>Loading channel...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#F04747" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChannelData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <LinearGradient
          colors={['#7289DA', '#4752C4']}
          style={styles.header}
        >
          <View style={styles.channelInfo}>
            {channel?.profilePic ? (
              <Image 
                source={{ uri: channel.profilePic }} 
                style={styles.channelImage} 
              />
            ) : (
              <View style={styles.imageHolder}>
                <MaterialIcons name="groups" size={40} color="#FFFFFF" />
              </View>
            )}
            <Text style={styles.channelName}>{channel?.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="person" size={16} color="#FFFFFF" />
                <Text style={styles.statText}>
                  {members.length} members
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons 
                  name={channel?.isPublic !== false ? "public" : "lock"} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text style={styles.statText}>
                  {channel?.isPublic !== false ? "Public" : "Private"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {actionError && (
          <View style={styles.errorContainer}>
            <LinearGradient
              colors={['#F04747', '#D03D3D']}
              style={styles.errorContent}
            >
              <MaterialIcons name="error-outline" size={20} color="#FFFFFF" />
              <Text style={styles.errorText}>{actionError}</Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.card}>
              <Text style={styles.description}>
                {channel?.description || "No description provided."}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.card}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {channel?.category || "GENERAL"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members</Text>
            <View style={styles.membersCard}>
              {!members || members.length === 0 ? (
                <Text style={styles.noMembers}>No members found</Text>
              ) : (
                members.slice(0, 5).map((member, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.memberItem}
                    onPress={() => handleMemberPress(member)}
                    onLongPress={() => !member.isCreator && handleMemberLongPress(member)}
                  >
                    {member.photoURL || member.profilePic ? (
                      <Image 
                        source={{ uri: member.photoURL || member.profilePic }} 
                        style={styles.memberAvatar} 
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberInitial}>
                          {(member.displayName || member.fullName || member.username || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.displayName || member.fullName || member.username || 'Unknown User'}
                        {member.isCreator && (
                          <Text style={styles.ownerBadge}> • Owner</Text>
                        )}
                      </Text>
                      <Text style={styles.memberRole}>{formatRoleText(member.role)}</Text>
                    </View>
                    
                    {isAdmin() && !member.isCreator ? (
                      <TouchableOpacity
                        style={styles.memberMenuButton}
                        onPress={() => handleMemberLongPress(member)}
                      >
                        <MaterialIcons name="more-vert" size={20} color="#72767D" />
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
              {members && members.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('ChannelMembers', { 
                    channelId, 
                    channelName: channel?.name 
                  })}
                >
                  <Text style={styles.viewAllText}>View all {members.length} members</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Channel Tools</Text>
            <View style={styles.toolsContainer}>
              {isAdmin() && (
                <TouchableOpacity 
                  style={styles.toolButton}
                  onPress={handleEditChannel}
                >
                  <MaterialIcons name="edit" size={24} color="#FFFFFF" />
                  <Text style={styles.toolButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.toolButton}
                onPress={handleInviteUsers}
              >
                <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
                <Text style={styles.toolButtonText}>Invite</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.toolButton}
                onPress={handleDiscoverChannels}
              >
                <MaterialIcons name="explore" size={24} color="#FFFFFF" />
                <Text style={styles.toolButtonText}>Discover</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.toolButton}
                onPress={handleAddFriends}
              >
                <MaterialIcons name="group-add" size={24} color="#FFFFFF" />
                <Text style={styles.toolButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {channel?.isMember === false ? (
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={handleJoinChannel}
              >
                <LinearGradient
                  colors={['#43B581', '#3CA374']}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Join Channel</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.leaveButtonContainer}
                onPress={handleLeaveChannel}
              >
                <View style={styles.leaveButtonContent}>
                  <MaterialIcons name="exit-to-app" size={28} color="#F04747" />
                  <View style={styles.leaveTextContainer}>
                    <Text style={styles.leaveButtonText}>Leave This Channel</Text>
                    <Text style={styles.leaveButtonSubtext}>You will no longer receive messages from this channel</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {renderMemberMenu()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#36393f',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  retryButton: {
    marginTop: 20,
    backgroundColor: '#7289DA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  channelInfo: {
    alignItems: 'center',
  },
  channelImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  imageHolder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#B9BBBE',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#2F3136',
    borderRadius: 8,
    padding: 16,
  },
  description: {
    color: '#DCDDDE',
    fontSize: 16,
    lineHeight: 24,
  },
  categoryBadge: {
    backgroundColor: '#4F545C',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  membersCard: {
    backgroundColor: '#2F3136',
    borderRadius: 8,
    padding: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 84, 92, 0.3)',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7289DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 16,
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
  noMembers: {
    color: '#B9BBBE',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: '#7289DA',
    fontSize: 14,
    fontWeight: '500',
  },
  toolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  toolButton: {
    backgroundColor: '#4F545C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    margin: 4,
    minWidth: 100,
  },
  leaveToolButton: {
    backgroundColor: 'rgba(240, 71, 71, 0.15)',
  },
  toolButtonText: {
    color: '#FFFFFF',
    marginTop: 4,
    fontSize: 14,
  },
  joinButton: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  leaveButtonContainer: {
    backgroundColor: 'rgba(240, 71, 71, 0.1)',
    borderWidth: 1,
    borderColor: '#F04747',
    borderRadius: 8,
    marginVertical: 16,
    overflow: 'hidden',
  },
  leaveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leaveTextContainer: {
    marginLeft: 12,
  },
  leaveButtonText: {
    color: '#F04747',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaveButtonSubtext: {
    color: '#B9BBBE',
    fontSize: 12,
    marginTop: 4,
  },
  memberMenuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#36393F',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    elevation: 8,
    overflow: 'hidden',
  },
  menuHeader: {
    backgroundColor: '#2F3136',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 84, 92, 0.3)',
  },
  menuItemText: {
    color: '#DCDDDE',
    fontSize: 16,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#202225',
    marginVertical: 8,
  },
  dangerItem: {
    backgroundColor: 'rgba(240, 71, 71, 0.1)',
  },
  dangerText: {
    color: '#F04747',
  },
});

export default ChannelProfileScreen;
