import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  SafeAreaView, Animated, ScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { messageService } from '../services/message.service';
import { THEME_COLORS } from '../utils/constants';

const DirectMessagesScreen = ({ route, navigation }) => {
  const { userId, userName, userAvatar } = route.params;
  const currentUser = useSelector(state => state.user);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const renderReceiverAvatar = useCallback(() => {
    if (userAvatar) {
      return (
        <Image
          source={{ uri: userAvatar }}
          style={styles.avatar}
          onError={(e) => {
            console.log("Error loading avatar:", e.nativeEvent.error);
          }}
          defaultSource={require('../assets/default-avatar.png')}
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

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Loading messages between ${currentUser._id} and ${userId}`);
      
      const messageData = await messageService.getDirectMessages(
        currentUser._id, 
        userId, 
        50
      );
      
      console.log('API returned message data:', messageData);
      
      let messagesToProcess = [];
      if (messageData && Array.isArray(messageData)) {
        messagesToProcess = messageData;
      } else if (messageData && messageData.messages && Array.isArray(messageData.messages)) {
        messagesToProcess = messageData.messages;
      } else {
        console.error('Invalid message data format:', messageData);
        setError('Invalid message data received');
        setMessages([]);
        return;
      }
      
      console.log(`Processing ${messagesToProcess.length} messages`);
      const formattedMessages = formatMessages(messagesToProcess);
      console.log(`Formatted ${formattedMessages.length} messages`);
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Could not load messages. Please try again.');
      setMessages([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 300);
    }
  };

  const formatMessages = (messagesArray) => {
    if (!messagesArray || !Array.isArray(messagesArray) || messagesArray.length === 0) {
      return [];
    }
    
    return messagesArray.map(msg => {
      const id = msg.id || msg._id || `local-${Date.now()}-${Math.random()}`;
      const text = msg.content || msg.text || msg.message || '';
      const timestamp = msg.timestamp || msg.createdAt || Date.now();
      const senderId = msg.senderId || msg.sender || msg.userId || 'unknown';
      const senderName = msg.senderName || msg.userName || 'Unknown User';
      const avatar = msg.senderPhoto || msg.senderAvatar || msg.userAvatar || undefined;
      
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
    loadMessages();
    
    const callback = (newMessage) => {
      if (newMessage) {
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
        
        setMessages(prevMessages => {
          if (!prevMessages.find(msg => msg.id === formattedMessage.id)) {
            return [...prevMessages, formattedMessage];
          }
          return prevMessages;
        });
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };
    
    callback.userId = currentUser._id;
    
    const unsubscribe = messageService.createDirectMessagesListener(
      currentUser._id,
      userId,
      callback
    );
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser._id, userId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isTyping ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTyping, fadeAnim]);

  const simulateTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
    
    try {
      console.log(`Sending message to ${userId}: ${messageText}`);
      
      const sentMessage = await messageService.postDirectMessage(
        currentUser._id,
        userId,
        messageText
      );
      
      console.log('Message sent successfully:', sentMessage);
      
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
      
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = () => {
    console.log(`Rendering ${messages.length} messages`);
    if (messages.length > 0) {
      return messages.map((msg, index) => {
        const isCurrentUser = msg.user._id === currentUser._id;
        const messageTime = new Date(msg.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        return (
          <View 
            key={msg.id || `msg-${index}`} 
            style={{
              flexDirection: 'row',
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              marginBottom: 12,
              alignItems: 'flex-end'
            }}
          >
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
              backgroundColor: isCurrentUser ? THEME_COLORS.primary : '#2F3136',
              padding: 12,
              borderRadius: 18,
              borderBottomLeftRadius: isCurrentUser ? 18 : 4,
              borderBottomRightRadius: isCurrentUser ? 4 : 18,
            }}>
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
                {messageTime}
              </Text>
            </View>
            
            {isCurrentUser && <View style={{width: 32}} />}
          </View>
        );
      });
    }
    return null;
  };

  const renderChatContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
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
            onPress={loadMessages}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="chat-bubble-outline" size={48} color="#72767D" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Send a message to start chatting</Text>
        </View>
      );
    }
    
    return (
      <ScrollView 
        ref={flatListRef}
        contentContainerStyle={styles.messagesContainer}
      >
        <View style={{padding: 16}}>
          {renderMessageItem()}
        </View>
      </ScrollView>
    );
  };

  const renderHeader = () => (
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
        style={styles.headerTitle}
        onPress={() => navigation.navigate('UserProfile', { userId })}
      >
        {renderReceiverAvatar()}
        <View style={styles.headerUserInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {userName}
          </Text>
          
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
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {renderHeader()}
        
        <View style={styles.content}>
          {renderChatContent()}
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <MaterialIcons name="add" size={24} color={THEME_COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#72767D"
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                if (text.length > 0) {
                  simulateTyping();
                }
              }}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="send" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  content: {
    flex: 1,
    backgroundColor: THEME_COLORS.background.darker,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    justifyContent: 'center',
  },
  headerUserInfo: {
    flex: 1,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  headerName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statusText: {
    fontSize: 12,
    color: '#E2F8E6',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  typingText: {
    fontSize: 12,
    color: '#FCFF54',
    fontStyle: 'italic',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  avatarContainer: {
    backgroundColor: THEME_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2F3136',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#40444B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    color: '#FFFFFF',
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: '#F04747',
    fontSize: 18,
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
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
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default DirectMessagesScreen;