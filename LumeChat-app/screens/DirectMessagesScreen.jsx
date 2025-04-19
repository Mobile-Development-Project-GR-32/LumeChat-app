import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, 
  Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  SafeAreaView, Keyboard, Animated 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { messageService } from '../services/message.service';
import { THEME_COLORS } from '../utils/constants';
import eventBus from '../utils/eventBus';

const ChatMessage = ({ messageData, receiverAvatar, userName }) => {
  const user = useSelector((state) => state.user);
  const isSender = messageData.user === user._id;
  return (
    <View
      style={[
        styles.messageContainer,
        isSender ? styles.senderMessage : styles.repicientMessage,
      ]}
    >
      {!isSender && (
        receiverAvatar ? (
          <Image
            source={{ uri: receiverAvatar }}
            style={styles.botAvatar}
            onError={(e) => {
              console.log("Error loading avatar:", e.nativeEvent.error);
            }}
          />
        ) : (
          <View style={[styles.botAvatarContainer, styles.botAvatar]}>
            <Text style={styles.userInitial}>
              {userName.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )
      )}
      <View
        style={[
          styles.messageBubble,
          isSender ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={[styles.messageText, styles.userText]}>
          {messageData.messageContent}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(messageData.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const DirectMessagesScreen = ({ route, navigation }) => {
  const { userId, userName, userAvatar } = route.params;
  const currentUser = useSelector(state => state.user);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Render receiver avatar with error handling
  const renderReceiverAvatar = useCallback(() => {
    if (userAvatar) {
      return (
        <Image
          source={{ uri: userAvatar }}
          style={styles.avatar}
          onError={(e) => {
            console.log("Error loading avatar:", e.nativeEvent.error);
          }}
        />
      );
    } else {
      return (
        <View style={[styles.avatarContainer, styles.avatar]}>
          <Text style={styles.avatarText}>
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      );
    }
  }, [userAvatar, userName]);

  // Load messages with proper error handling
  const loadMessages = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    
    try {
      if (!userId || !currentUser?._id) {
        throw new Error('Missing user information');
      }
      
      const data = await messageService.getDirectMessages(currentUser._id, userId);
      
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        console.warn('Unexpected data format:', data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert(
        'Error',
        'Failed to load messages. Please try again.',
        [{ text: 'Retry', onPress: () => loadMessages() }]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [userId, currentUser?._id]);

  // Handle refreshing
  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages(false);
  };

  // Send message with error handling
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    
    try {
      const tempId = `temp_${Date.now()}`;
      
      // Add optimistic message
      const tempMessage = {
        _id: tempId,
        text: messageText,
        sender: currentUser._id,
        receiver: userId,
        createdAt: new Date().toISOString(),
        status: 'sending',
        isTemp: true
      };
      
      setMessages(prev => [tempMessage, ...prev]);
      
      const result = await messageService.sendDirectMessage(
        currentUser._id, 
        userId, 
        messageText
      );
      
      // Replace temp message with actual one
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? {...result, status: 'sent'} : msg
      ));
      
      // Scroll to bottom
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update temp message to show error
      setMessages(prev => prev.map(msg => 
        msg.isTemp ? {...msg, status: 'failed'} : msg
      ));
      
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Delete message with confirmation
  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await messageService.deleteMessage(currentUser._id, messageId);
              setMessages(prev => prev.filter(msg => msg._id !== messageId));
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  // Setup subscription for real-time messages
  useEffect(() => {
    loadMessages();
    
    // Subscribe to new messages
    const unsubscribe = eventBus.subscribe('newDirectMessage', (message) => {
      if ((message.sender === userId && message.receiver === currentUser._id) || 
          (message.sender === currentUser._id && message.receiver === userId)) {
        setMessages(prev => [message, ...prev.filter(m => m._id !== message._id)]);
      }
    });
    
    return () => unsubscribe();
  }, [loadMessages, userId, currentUser?._id]);

  // Handle typing animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isTyping ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTyping, fadeAnim]);

  // Simulate typing indicator
  const simulateTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  // Render message bubble
  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === currentUser._id;
    const messageDate = new Date(item.createdAt);
    const formattedTime = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {renderReceiverAvatar()}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          item.status === 'failed' && styles.failedMessage
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTime}>{formattedTime}</Text>
          
          {item.status === 'sending' && (
            <View style={styles.statusIndicator}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
          
          {item.status === 'failed' && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {/* Implement retry logic */}}
            >
              <MaterialIcons name="refresh" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {isMyMessage && (
          <TouchableOpacity 
            style={styles.messageActions}
            onPress={() => handleDeleteMessage(item._id)}
          >
            <MaterialIcons name="more-vert" size={20} color="#72767D" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render the header with user info
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerTitle}
        onPress={() => navigation.navigate('UserProfile', { userId })}
      >
        {renderReceiverAvatar()}
        <View>
          <Text style={styles.headerName}>{userName}</Text>
          
          <Animated.View style={{
            opacity: fadeAnim,
            height: 20,
          }}>
            {isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : (
              <Text style={styles.statusText}>Online</Text>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // If loading is in progress
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[THEME_COLORS.background.darker, THEME_COLORS.background.darkest]} style={styles.container}>
        {renderHeader()}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesContainer}
          inverted
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={48} color="#72767D" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send a message to start chatting</Text>
            </View>
          }
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              if (text.length > 0) {
                simulateTyping();
              }
            }}
            placeholder="Type a message..."
            placeholderTextColor="#72767D"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: THEME_COLORS.background.darkest,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME_COLORS.text.primary,
  },
  statusText: {
    fontSize: 12,
    color: THEME_COLORS.accent,
  },
  typingText: {
    fontSize: 12,
    color: THEME_COLORS.warning,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarContainer: {
    backgroundColor: THEME_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: THEME_COLORS.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  myMessageBubble: {
    backgroundColor: THEME_COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: THEME_COLORS.background.darker,
    borderBottomLeftRadius: 4,
  },
  failedMessage: {
    backgroundColor: 'rgba(240, 71, 71, 0.7)',
  },
  messageText: {
    color: THEME_COLORS.text.primary,
    fontSize: 16,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  statusIndicator: {
    position: 'absolute',
    right: -8,
    bottom: -8,
  },
  retryButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: THEME_COLORS.danger,
    borderRadius: 10,
    padding: 4,
  },
  messageActions: {
    padding: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: THEME_COLORS.background.darker,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: THEME_COLORS.background.darkest,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: THEME_COLORS.text.primary,
  },
  sendButton: {
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background.dark,
  },
  loadingText: {
    color: THEME_COLORS.text.primary,
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: THEME_COLORS.text.secondary,
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: THEME_COLORS.text.muted,
    fontSize: 14,
    marginTop: 8,
  }
});

export default DirectMessagesScreen;