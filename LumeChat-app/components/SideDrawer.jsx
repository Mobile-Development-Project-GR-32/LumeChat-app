import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { friendService } from '../services/friend.service';
import { useNavigation } from '@react-navigation/native';
import { userStatusManager } from '../utils/userStatusManager';

const ContactItem = ({ contact, onPress, onAccept, onReject, onRemove, isPending = false }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Determine status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online': return '#43B581';
      case 'away': return '#FAA61A';
      case 'do not disturb': return '#F04747';
      default: return '#747F8D'; // Offline/invisible
    }
  };

  // Get status from userStatusManager instead of contact.status
  const status = isPending ? null : userStatusManager.getUserStatus(contact._id);

  return (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => onPress(contact)}
      disabled={isPending} // Disable navigation for pending requests
    >
      <View style={styles.avatarContainer}>
        {contact.profilePic ? (
          <Image 
            source={{ uri: contact.profilePic }} 
            style={styles.avatar}
            defaultSource={require('../assets/default-avatar.png')}
          />
        ) : (
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(contact.fullName)}</Text>
          </LinearGradient>
        )}
        {!isPending && (
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: getStatusColor(status) }
            ]} 
          />
        )}
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {contact.fullName}
        </Text>
        
        {isPending ? (
          <Text style={styles.pendingText}>Pending Request</Text>
        ) : (
          <Text style={styles.statusText} numberOfLines={1}>
            {status || 'Offline'}
          </Text>
        )}
      </View>
      
      {isPending ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onAccept(contact)}
          >
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReject(contact)}
          >
            <MaterialIcons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(contact)}
        >
          <MaterialIcons name="more-vert" size={20} color="#8E9297" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const SideDrawer = ({ isOpen, drawerWidth }) => {
  const user = useSelector(state => state.user);
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('contacts');
  const [onlineContacts, setOnlineContacts] = useState([]);
  const [offlineContacts, setOfflineContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactId, setNewContactId] = useState('');
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const slideAnim = React.useRef(new Animated.Value(-drawerWidth)).current;

  const fetchData = async () => {
    if (!user?._id) return;
    
    setIsLoading(true);
    try {
      // Get friends list
      const friends = await friendService.getFriends(user._id);
      
      // Save globally for status simulation
      global.friendsList = friends || [];
      
      // Now properly separate online and offline friends
      const online = [];
      const offline = [];
      
      if (Array.isArray(friends)) {
        friends.forEach(friend => {
          // Check if the friend is online using userStatusManager
          if (userStatusManager.isOnline(friend._id)) {
            online.push(friend);
          } else {
            offline.push(friend);
          }
        });
        
        console.log(`Categorized friends: ${online.length} online, ${offline.length} offline`);
      }
      
      setOnlineContacts(online);
      setOfflineContacts(offline);
      
      // Get pending friend requests
      try {
        console.log("Fetching friend requests for user:", user._id);
        const requests = await friendService.getFriendRequests(user._id);
        console.log("Received friend requests:", requests);
        
        // Make sure we're properly handling the response - it should be an array
        if (Array.isArray(requests)) {
          setPendingRequests(requests);
        } else {
          console.warn("Friend requests not in expected format:", requests);
          setPendingRequests([]);
        }
      } catch (requestError) {
        console.error("Error fetching friend requests:", requestError);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchData();
      
      // Initialize status manager
      const initStatusManager = async () => {
        try {
          const statusTools = await userStatusManager.initialize(user._id);
          
          // Subscribe to status updates
          const unsubscribe = userStatusManager.subscribe((statuses) => {
            console.log("Status update received in SideDrawer");
            
            // Get the current friends list
            const allFriends = global.friendsList || [];
            
            if (allFriends.length > 0) {
              // Re-categorize friends based on updated statuses
              const online = [];
              const offline = [];
              
              allFriends.forEach(friend => {
                if (userStatusManager.isOnline(friend._id)) {
                  online.push(friend);
                } else {
                  offline.push(friend);
                }
              });
              
              console.log(`After status update: ${online.length} online, ${offline.length} offline`);
              
              // Update state with new categorized lists
              setOnlineContacts(online);
              setOfflineContacts(offline);
            }
          });
          
          return () => {
            unsubscribe();
            if (statusTools && typeof statusTools.cleanup === 'function') {
              statusTools.cleanup();
            }
          };
        } catch (error) {
          console.error("Error initializing status manager:", error);
          return () => {}; // Return empty cleanup function on error
        }
      };
      
      const cleanupPromise = initStatusManager();
      
      return () => {
        cleanupPromise.then(cleanup => {
          if (cleanup && typeof cleanup === 'function') {
            cleanup();
          }
        }).catch(err => console.error('Error during cleanup:', err));
      };
    }
  }, [isOpen, user?._id]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -drawerWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen, drawerWidth]);

  const handleContactPress = (contact) => {
    // Navigate to direct message with this contact
    navigation.navigate('ChatScreen', { 
      userId: contact._id,
      userName: contact.fullName,
      userAvatar: contact.profilePic
    });
  };

  const handleAcceptRequest = async (contact) => {
    try {
      setIsLoading(true);
      console.log("Accepting friend request from:", contact._id);
      await friendService.respondToFriendRequest(user._id, contact._id, 'accept');
      console.log("Request accepted, refreshing data");
      await fetchData(); // Refresh all data after accepting
      Alert.alert('Success', `You are now friends with ${contact.fullName}`);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (contact) => {
    try {
      setIsLoading(true);
      console.log("Rejecting friend request from:", contact._id);
      await friendService.respondToFriendRequest(user._id, contact._id, 'reject');
      console.log("Request rejected, refreshing data");
      await fetchData(); // Refresh all data after rejecting
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveContact = (contact) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contact.fullName} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await friendService.removeFriend(user._id, contact._id);
              fetchData(); // Refresh data
            } catch (error) {
              console.error('Error removing contact:', error);
              Alert.alert('Error', 'Failed to remove contact');
            }
          }
        }
      ]
    );
  };

  const handleAddContact = async () => {
    try {
      if (!newContactId) {
        Alert.alert('Error', 'Please enter a user ID');
        return;
      }
      
      await friendService.sendFriendRequest(user._id, newContactId);
      setIsAddingContact(false);
      setNewContactId('');
      fetchData(); // Refresh data
      Alert.alert('Success', 'Friend request sent');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const showAddContactModal = () => {
    Alert.prompt(
      'Add Friend',
      'Enter user ID',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', onPress: (id) => {
          if (id) {
            friendService.sendFriendRequest(user._id, id)
              .then(() => {
                fetchData();
                Alert.alert('Success', 'Friend request sent');
              })
              .catch(error => {
                Alert.alert('Error', error.message || 'Failed to send friend request');
              });
          }
        }}
      ],
      'plain-text'
    );
  };

  const renderContactList = () => {
    return (
      <>
        {pendingRequests && pendingRequests.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={[styles.sectionTitle, styles.pendingSectionTitle]}>
              FRIEND REQUESTS — {pendingRequests.length}
            </Text>
            {pendingRequests.map((request) => (
              <ContactItem
                key={request._id || request.id || Math.random().toString()}
                contact={request}  // This now contains profilePic from our transform
                isPending={true}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onPress={() => {}} // Disable navigation for pending requests
              />
            ))}
            <View style={styles.sectionDivider} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ONLINE — {onlineContacts.length}</Text>
          {onlineContacts.map((contact) => (
            <ContactItem
              key={contact._id || contact.id}
              contact={contact}
              onPress={handleContactPress}
              onRemove={handleRemoveContact}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OFFLINE — {offlineContacts.length}</Text>
          {offlineContacts.map((contact) => (
            <ContactItem
              key={contact._id}
              contact={contact}
              onPress={handleContactPress}
              onRemove={handleRemoveContact}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          width: drawerWidth,
          transform: [{ translateX: slideAnim }],
        }
      ]}
    >
      <LinearGradient
        colors={['#2F3136', '#202225']}
        style={styles.header}
      >
        <Text style={styles.headerText}>Direct Messages</Text>
        <TouchableOpacity style={styles.addButton} onPress={showAddContactModal}>
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.addButtonGradient}
          >
            <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#7289DA" />
          <Text style={styles.loaderText}>Loading contacts...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {renderContactList()}
          
          {onlineContacts.length === 0 && offlineContacts.length === 0 && pendingRequests.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={48} color="#72767D" />
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyText}>Add friends to start chatting</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={showAddContactModal}
              >
                <LinearGradient
                  colors={['#7289DA', '#5865F2']}
                  style={styles.emptyButtonGradient}
                >
                  <MaterialIcons name="person-add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Add Friend</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2F3136',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#8E9297',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2F3136',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#DCDDDE',
    fontSize: 16,
  },
  statusText: {
    color: '#8E9297',
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#43B581',
  },
  rejectButton: {
    backgroundColor: '#F04747',
  },
  pendingText: {
    color: '#FAA61A',
    fontSize: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#B9BBBE',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: '#B9BBBE',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  pendingSection: {
    marginBottom: 16,
  },
  pendingSectionTitle: {
    color: '#FAA61A',
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(114, 137, 218, 0.2)',
    marginHorizontal: 16,
    marginTop: 8,
  }
});

export default SideDrawer;
