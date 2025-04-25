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
import { useNavigation, useRoute } from '@react-navigation/core';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

const DirectMessagesScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
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
  const videoClient = useStreamVideoClient()
  
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
      
      const messageData = await messageService.getDirectMessages(
        currentUser._id, 
        userId, 
        50
      );
      
      let messagesToProcess = [];
      if (messageData && Array.isArray(messageData)) {
        messagesToProcess = messageData;
      } else if (messageData && messageData.messages && Array.isArray(messageData.messages)) {
        messagesToProcess = messageData.messages;
      } else if (messageData && typeof messageData === 'object') {
        // Try to extract messages from other possible formats
        const possibleMessageArrays = Object.values(messageData).filter(val => Array.isArray(val));
        if (possibleMessageArrays.length > 0) {
          // Use the largest array found
          messagesToProcess = possibleMessageArrays.reduce((a, b) => a.length > b.length ? a : b, []);
        } else {
          setMessages([]);
          setError('Could not parse message data');
          return;
        }
      } else {
        setError('Invalid message data received');
        setMessages([]);
        return;
      }
      
      if (!messagesToProcess || messagesToProcess.length === 0) {
        setMessages([]);
        return;
      }
      
      const formattedMessages = formatMessages(messagesToProcess);
      
      setMessages(formattedMessages);
    } catch (error) {
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
    // Add comprehensive validation
    if (!messagesArray) {
      return [];
    }
    
    if (!Array.isArray(messagesArray)) {
      return [];
    }
    
    if (messagesArray.length === 0) {
      return [];
    }
    
    try {
      const formatted = messagesArray.map(msg => {
        if (!msg) {
          return null;
        }
        
        // Extract fields with fallbacks
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
      })
      .filter(Boolean) // Remove any null items from the map
      .sort((a, b) => a.createdAt - b.createdAt);
      
      return formatted;
    } catch (error) {
      return [];
    }
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
        
        // Check if the message already exists in the state
        // Using a more robust check with both ID and content
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => 
            (msg.id === formattedMessage.id) || 
            (msg.text === formattedMessage.text && 
             Math.abs(new Date(msg.createdAt) - new Date(formattedMessage.createdAt)) < 5000)
          );
          
          if (!messageExists) {
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
    
    // Generate a temporary ID for local message tracking
    const tempMessageId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      console.log(`Sending message to ${userId}: ${messageText}`);
      
      // Add message to state immediately for better UX
      const tempMessage = {
        id: tempMessageId,
        text: messageText,
        createdAt: new Date(),
        user: {
          _id: currentUser._id,
          name: currentUser.fullName,
          avatar: currentUser.profilePic
        },
        isMine: true,
        pending: true // Mark as pending until confirmed
      };
      
      // Add temporary message to state
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Send to server
      const sentMessage = await messageService.sendDirectMessage(
        currentUser._id,
        userId,
        messageText
      );
      
      console.log('Message sent successfully:', sentMessage);
      
      // Update the temporary message with server details
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === tempMessageId ? {
          ...msg,
          id: sentMessage.id || msg.id,
          pending: false
        } : msg
      ));
      
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Mark the message as failed
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.id === tempMessageId ? { ...msg, failed: true, pending: false } : msg
      ));
      
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateObj) => {
    const now = new Date();
    const messageDate = new Date(dateObj);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      return `${messageDate.toLocaleDateString([], { weekday: 'short' })}, ${
        messageDate.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      }`;
    }
    
    return `${messageDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    })}, ${
      messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }`;
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    
    return currentDate !== prevDate;
  };

  const renderMessageItem = () => {
    console.log(`Rendering ${messages.length} messages`);
    if (messages.length > 0) {
      const uniqueMessages = messages.reduce((acc, current) => {
        const isDuplicate = acc.some(item => 
          (item.id === current.id) || 
          (item.text === current.text && 
           Math.abs(new Date(item.createdAt) - new Date(current.createdAt)) < 5000 &&
           item.user._id === current.user._id)
        );
        
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      let messageComponents = [];
      
      uniqueMessages.forEach((msg, index) => {
        const isCurrentUser = msg.user._id === currentUser._id;
        const prevMessage = index > 0 ? uniqueMessages[index - 1] : null;
        
        if (shouldShowDateSeparator(msg, prevMessage)) {
          const messageDate = new Date(msg.createdAt);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          
          let dateText;
          if (messageDate.toDateString() === today.toDateString()) {
            dateText = "Today";
          } else if (messageDate.toDateString() === yesterday.toDateString()) {
            dateText = "Yesterday";
          } else {
            dateText = messageDate.toLocaleDateString([], {
              weekday: 'long',
              month: 'long', 
              day: 'numeric',
              year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
          }
          
          messageComponents.push(
            <View key={`date-${msg.id}`} style={styles.dateSeparator}>
              <View style={styles.dateLine} />
              <Text style={styles.dateText}>{dateText}</Text>
              <View style={styles.dateLine} />
            </View>
          );
        }
        
        const messageTime = formatMessageTime(msg.createdAt);
        
        messageComponents.push(
          <View 
            key={msg.id || `msg-${index}`} 
            style={{
              flexDirection: 'row',
              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
              marginBottom: 12,
              alignItems: 'flex-end',
              opacity: msg.pending ? 0.7 : 1
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
              backgroundColor: isCurrentUser ? 
                (msg.failed ? '#f04747' : THEME_COLORS.primary) : 
                '#2F3136',
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
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 4
              }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: 11,
                  textAlign: 'right',
                  fontStyle: 'italic'
                }}>
                  {messageTime}
                </Text>
                
                {msg.pending && (
                  <Text style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    marginLeft: 4
                  }}>
                    sending...
                  </Text>
                )}
                
                {msg.failed && (
                  <TouchableOpacity 
                    onPress={() => {
                      const failedText = msg.text;
                      setMessages(prev => prev.filter(m => m.id !== msg.id));
                      setInputText(failedText);
                    }}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 10,
                      marginLeft: 4
                    }}>
                      retry
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {isCurrentUser && <View style={{width: 32}} />}
          </View>
        );
      });
      
      return messageComponents;
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
        <TouchableOpacity style={styles.actionButton} onPress={startCallHandler}>
          <MaterialIcons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const startCallHandler = useCallback(async() => {
    const callId = 'call-'+currentUser._id+'-'+userId
    try {
      const call = videoClient?.call('default', callId)
      await call?.getOrCreate({
        ring: true,
        data: {
          settings_override: {
            ring: {
              auto_cancel_timeout_ms: 30000,
              incoming_call_timeout_ms: 30000
            }
          },
          members: [{user_id: currentUser._id}, {user_id: userId}]
        }
      })
    } catch(error) {
      Alert.alert('Error calling user', error.message)
      console.log('Failed to create call', error)
    }
  })

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
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    color: '#BBBBBB',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(47, 49, 54, 0.6)',
    borderRadius: 12,
  },
});

export default DirectMessagesScreen;