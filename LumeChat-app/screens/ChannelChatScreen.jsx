import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Image, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView, Animated, Alert, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { messageService } from '../services/message.service';
import { channelService } from '../services/channel.service';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

// Helper function to format dates
const formatDate = (date) => {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

// Helper function to check if a date is today
const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  return compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear();
};

// Helper function to check if a date is yesterday
const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const compareDate = new Date(date);
  return compareDate.getDate() === yesterday.getDate() &&
    compareDate.getMonth() === yesterday.getMonth() &&
    compareDate.getFullYear() === yesterday.getFullYear();
};

// Helper to format time
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChannelChatScreen = ({ route, navigation }) => {
  const { channel } = route.params;
  const currentUser = useSelector(state => state.user);
  const streamClient = useStreamVideoClient()
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [membersCount, setMembersCount] = useState(0);
  const flatListRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [isMembersVisible, setIsMembersVisible] = useState(false);

  // Extract channel ID, handling both id and _id formats
  const getChannelId = () => {
    if (!channel) return null;
    
    // Handle both id and _id formats
    const channelId = channel._id || channel.id;
    
    if (!channelId) {
      console.error('Channel object is missing both id and _id properties:', channel);
      return null;
    }
    
    // Make sure we're returning a string, not an object
    return String(channelId);
  };

  useEffect(() => {
    const channelId = getChannelId();
    console.log('Using channelId:', channelId);
    
    if (channelId) {
      loadMessages(channelId);
      loadChannelMembers(channelId);
    } else {
      setError('Invalid channel information');
    }
    
    // Set up reconnection timer
    const reconnectionTimer = setInterval(() => {
      if (!isLoading) {
        const currentChannelId = getChannelId();
        if (currentChannelId && messages.length === 0) {
          loadMessages(currentChannelId);
        }
      }
    }, 10000);
    
    return () => {
      clearInterval(reconnectionTimer);
    };
  }, [channel]);
  
  useEffect(() => {
    // Animation for sliding members panel
    Animated.timing(slideAnim, {
      toValue: isMembersVisible ? 0 : 300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMembersVisible]);
  
  const loadChannelMembers = async (channelId) => {
    try {
      console.log('Loading channel members for:', channelId);
      
      // Add validation to check if channelId is valid
      if (!channelId) {
        console.error('Invalid channel ID');
        setMembers([]);
        setMembersCount(0);
        return;
      }
      
      try {
        const memberData = await channelService.getChannelMembers(
          currentUser._id,
          channelId
        );
        
        console.log('Channel members response:', memberData);
        
        if (Array.isArray(memberData)) {
          setMembers(memberData);
          setMembersCount(memberData.length);
        } else if (memberData && Array.isArray(memberData.members)) {
          setMembers(memberData.members);
          setMembersCount(memberData.members.length);
        } else {
          console.warn('Members data is not in expected format:', memberData);
          setMembers([]);
          setMembersCount(0);
        }
      } catch (error) {
        console.error('Failed to load channel members:', error);
        setMembers([]);
        setMembersCount(0);
      }
    } catch (error) {
      console.error('Error in loadChannelMembers:', error);
      setMembers([]);
      setMembersCount(0);
    }
  };

  const loadMessages = async (channelId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate channel ID
      if (!channelId) {
        console.error('Invalid channel ID');
        setMessages([]);
        setError('Invalid channel. Please try again.');
        return;
      }
      
      try {
        console.log('Loading messages for channel:', channelId);
        const messageData = await messageService.getChannelMessages(
          currentUser._id,
          channelId,
          50
        );
        
        // Detailed console logging to diagnose the issue
        console.log('Raw message data type:', typeof messageData);
        console.log('Message data keys:', messageData ? Object.keys(messageData) : 'null');
        console.log('Messages array exists:', messageData && messageData.messages ? `Yes (${messageData.messages.length} items)` : 'No');
        
        // Try to extract messages in various ways
        let messagesToProcess = [];
        if (messageData && Array.isArray(messageData)) {
          console.log('Message data is an array with', messageData.length, 'items');
          messagesToProcess = messageData;
        } else if (messageData && messageData.messages && Array.isArray(messageData.messages)) {
          console.log('Message data has messages array with', messageData.messages.length, 'items');
          messagesToProcess = messageData.messages;
        } else {
          console.error('Could not extract messages from response:', messageData);
          setError('Invalid message data received');
          setMessages([]);
          return;
        }
        
        // Format messages
        const formattedMessages = formatMessages(messagesToProcess);
        console.log('Formatted messages:', formattedMessages.length);
        
        if (formattedMessages.length > 0) {
          console.log('Sample message:', JSON.stringify(formattedMessages[0]));
        }
        
        setMessages(formattedMessages);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 300);
      } catch (msgError) {
        console.error('Failed to load messages:', msgError);
        setError(msgError.message || 'Could not load messages. Please try again later.');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
      setError('Could not load messages. Please try again later.');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatMessages = (messagesArray) => {
    // Make sure we have a valid array to work with
    if (!messagesArray || !Array.isArray(messagesArray) || messagesArray.length === 0) {
      console.warn('formatMessages received invalid or empty messages array');
      return [];
    }
    
    console.log('Processing', messagesArray.length, 'messages for formatting');
    
    // Let's log the first message to see its structure
    console.log('First message in array:', JSON.stringify(messagesArray[0]));
    
    return messagesArray.map(msg => {
      // Extract required fields with fallbacks
      const id = msg.id || msg._id || `local-${Date.now()}-${Math.random()}`;
      const text = msg.content || msg.text || msg.message || '';
      const timestamp = msg.timestamp || msg.createdAt || Date.now();
      const senderId = msg.senderId || msg.sender || msg.userId || 'unknown';
      const senderName = msg.senderName || msg.userName || 'Unknown User';
      const avatar = msg.senderPhoto || msg.senderAvatar || msg.userAvatar || undefined;
      
      // Check if this is the current user's message
      const isMine = senderId === currentUser._id;
      
      return {
        id,
        text,
        createdAt: new Date(timestamp),
        user: {
          _id: senderId,
          name: senderName,
          avatar
        },
        isMine
      };
    }).sort((a, b) => a.createdAt - b.createdAt);
  };

  useEffect(() => {
    const channelId = getChannelId();
    
    if (channelId) {
      // Set up real-time listener for new messages
      // Pass current user ID in the callback for polling fallback
      const callback = (newMessage) => {
        if (newMessage) {
          // Format and add the new message
          const formattedMessage = {
            id: newMessage.id,
            text: newMessage.content,
            createdAt: new Date(newMessage.timestamp),
            user: {
              _id: newMessage.senderId,
              name: newMessage.senderName,
              avatar: newMessage.senderPhoto
            },
            isMine: newMessage.senderId === currentUser._id
          };
          
          // Add to messages if not already present
          setMessages(prevMessages => {
            if (!prevMessages.find(msg => msg.id === formattedMessage.id)) {
              return [...prevMessages, formattedMessage];
            }
            return prevMessages;
          });
          
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      };
      
      // Attach user ID to callback function for polling fallback
      callback.userId = currentUser._id;
      
      const unsubscribe = messageService.createChannelMessagesListener(
        channelId,
        callback
      );
      
      // Clean up listener on unmount
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [currentUser._id, getChannelId]);
  
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const messageText = inputText.trim();
    setInputText('');
    
    const channelId = getChannelId();
    if (!channelId) {
      Alert.alert('Error', 'Cannot send message to invalid channel');
      return;
    }
    
    try {
      console.log('Sending message to channel ID:', channelId);
      
      const sentMessage = await messageService.postChannelMessage(
        currentUser._id,
        channelId,
        messageText
      );
      
      // Add manually to UI for immediate feedback
      const tempMessage = {
        id: sentMessage.id || `local-${Date.now()}`,
        text: messageText,
        createdAt: new Date(),
        user: {
          _id: currentUser._id,
          name: currentUser.fullName,
          avatar: currentUser.profilePic
        },
        isMine: true
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };
  
  const toggleMembersList = () => {
    setIsMembersVisible(!isMembersVisible);
  };
  
  const handleChannelOptions = () => {
    const channelId = getChannelId();
    if (!channelId) {
      Alert.alert('Error', 'Invalid channel information');
      return;
    }
    
    navigation.navigate('ChannelProfile', {
      channelId: channelId,
      channelName: channel.name
    });
  };
  
  const renderMember = ({ item }) => {
    const isOnline = item.status === 'online' || item.isOnline;
    
    return (
      <TouchableOpacity 
        style={styles.memberItem}
        onPress={() => navigation.navigate('UserProfile', { 
          userId: item._id || item.userId,
          userName: item.fullName || item.displayName  
        })}
      >
        <View style={styles.memberAvatarContainer}>
          <Image 
            source={{ uri: item.profilePic || item.photoURL }}
            style={styles.memberAvatar}
            defaultSource={require('../assets/default-avatar.png')}
          />
          <View style={[
            styles.memberStatus,
            { backgroundColor: isOnline ? '#43B581' : '#747F8D' }
          ]} />
        </View>
        <Text style={styles.memberName}>
          {item.fullName || item.displayName || 'Unknown User'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = () => {
    if (messages.length > 0) {
      return (
        <View style={{padding: 16}}>
          {messages.map((msg, index) => {
            const isCurrentUser = msg.user._id === currentUser._id;
            
            return (
              <View 
                key={msg.id || index} 
                style={{
                  flexDirection: 'row',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                  alignItems: 'flex-end'
                }}
              >
                {/* Show avatar for other users' messages */}
                {!isCurrentUser && (
                  <Image 
                    source={{ uri: msg.user.avatar }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      marginRight: 8,
                      backgroundColor: '#2F3136',
                    }}
                    defaultSource={require('../assets/default-avatar.png')}
                  />
                )}
                
                <View style={{
                  maxWidth: '70%',
                  backgroundColor: isCurrentUser ? '#7289DA' : '#2F3136',
                  padding: 12,
                  borderRadius: 18,
                  borderBottomLeftRadius: isCurrentUser ? 18 : 4,
                  borderBottomRightRadius: isCurrentUser ? 4 : 18,
                }}>
                  {/* Show username only for others' messages */}
                  {!isCurrentUser && (
                    <Text style={{
                      color: '#FFFFFF', 
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      {msg.user.name}
                    </Text>
                  )}
                  
                  <Text style={{color: '#FFFFFF'}}>{msg.text}</Text>
                  
                  <Text style={{
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: 10,
                    marginTop: 4,
                    textAlign: isCurrentUser ? 'right' : 'left'
                  }}>
                    {formatTime(msg.createdAt)}
                  </Text>
                </View>
                
                {/* Add spacing after our messages (where avatar would be on the other side) */}
                {isCurrentUser && <View style={{width: 32}} />}
              </View>
            );
          })}
        </View>
      );
    }
    return null;
  };

  const renderChatContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7289DA" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#F04747" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadMessages(getChannelId())}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (messages.length === 0) {
      return emptyContainer;
    }
    
    return (
      <ScrollView 
        ref={flatListRef}
        contentContainerStyle={styles.messagesList}
      >
        {renderMessageItem()}
      </ScrollView>
    );
  };

  const emptyContainer = (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="forum" size={48} color="#7289DA" />
      <Text style={styles.emptyText}>Welcome to #{channel.name}!</Text>
      <Text style={styles.emptySubtext}>This is the beginning of the channel</Text>
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => loadMessages(getChannelId())}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.retryButton, { marginLeft: 8, backgroundColor: '#43B581' }]}
          onPress={() => {
            const channelId = getChannelId();
            Alert.alert(
              'Debug Info',
              `Channel ID: ${channelId}\nUser ID: ${currentUser._id}\nMessages: ${messages.length}`
            );
          }}
        >
          <Text style={styles.retryText}>Debug</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const startChannelMeeting = async () => {
    const callId = 'call-'+channel.name+'-'+Math.floor(Math.random() * 1000000).toString()
    navigation.navigate('Call', {callId: callId})
  }

  const joinChannelMeeting = async () => {
    
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Chat Header */}
      <LinearGradient
        colors={['#7289DA', '#4752C4']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.channelInfoContainer}
          onPress={() => handleChannelOptions()}
        >
          <View style={styles.channelIconContainer}>
            <MaterialIcons name="tag" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.channelName}>{channel.name}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => startChannelMeeting()}
          >
            <MaterialIcons name="video-chat" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => joinChannelMeeting()}
          >
            <MaterialIcons name="video-call" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => toggleMembersList()}
          >
            <MaterialIcons name="people" size={24} color="#FFFFFF" />
            {membersCount > 0 && (
              <View style={styles.memberCountBadge}>
                <Text style={styles.memberCountText}>{membersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => handleChannelOptions()}
          >
            <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Overlay when sidebar is open */}
      {isMembersVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={0.5}
          onPress={() => toggleMembersList()}
        />
      )}
      
      {/* Members Sidebar */}
      <Animated.View 
        style={[
          styles.membersSidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Members</Text>
          <TouchableOpacity onPress={() => toggleMembersList()}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={item => item._id || item.userId}
          contentContainerStyle={styles.membersList}
        />
      </Animated.View>
      
      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {renderChatContent()}
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialIcons name="add" size={24} color="#7289DA" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={`Message #${channel.name}`}
            placeholderTextColor="#72767D"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <MaterialIcons name="send" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393F',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  channelInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  memberCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F04747',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  memberCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  membersSidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 240,
    height: '100%',
    backgroundColor: '#2F3136',
    zIndex: 3,
    borderLeftWidth: 1,
    borderLeftColor: '#202225',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  membersTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  membersList: {
    paddingVertical: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 4,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#36393F',
  },
  memberStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2F3136',
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#DCDDDE',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#DCDDDE',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7289DA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#72767D',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  messagesList: {
    paddingBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(114, 137, 218, 0.2)',
  },
  dateHeaderTextContainer: {
    paddingHorizontal: 10,
  },
  dateHeaderText: {
    color: '#72767D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  myMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  theirMessageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  groupedMessage: {
    marginVertical: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#2F3136',
  },
  avatarSpacer: {
    width: 40,
  },
  myMessageContent: {
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  theirMessageContent: {
    maxWidth: '80%',
  },
  messageSender: {
    color: '#7289DA',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
    marginLeft: 8,
  },
  myMessageBubble: {
    padding: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '100%',
  },
  theirMessageBubble: {
    backgroundColor: '#2F3136',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: '100%',
  },
  groupedBubble: {
    marginTop: 2,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 4,
    marginRight: 4,
  },
  theirMessageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 8,
  },
  typingContainer: {
    padding: 8,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingBubble: {
    backgroundColor: '#2F3136',
    padding: 12,
    borderRadius: 18,
    width: 64,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#72767D',
    marginHorizontal: 2,
  },
  typingText: {
    color: '#72767D',
    fontSize: 12,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#2F3136',
    borderTopWidth: 1,
    borderTopColor: '#202225',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202225',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#40444B',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#DCDDDE',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7289DA',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#4E5D94',
    opacity: 0.5,
  },
});

export default ChannelChatScreen;