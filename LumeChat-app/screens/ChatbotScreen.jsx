import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { chatbotService } from '../services/chatbot.service';

// Modified ChatMessage component with "See More" functionality
const ChatMessage = ({ message, isLast }) => {
  const isUser = message.isUser;
  const animation = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);
  const [shouldShowSeeMore, setShouldShowSeeMore] = useState(false);
  
  useEffect(() => {
    // Check if message content has more than 5 lines
    const lineCount = (message.content.match(/\n/g) || []).length + 1;
    setShouldShowSeeMore(lineCount > 5 || message.content.length > 250);
  }, [message.content]);
  
  useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get displayed content based on expanded state
  const getDisplayedContent = () => {
    if (!shouldShowSeeMore || expanded) {
      return message.content;
    }
    
    // Limit to 5 lines or approximately 250 characters
    const lines = message.content.split('\n');
    if (lines.length > 5) {
      return lines.slice(0, 5).join('\n') + '...';
    }
    
    // If it's a single long paragraph, truncate it
    if (message.content.length > 250) {
      return message.content.substring(0, 250) + '...';
    }
    
    return message.content;
  };

  return (
    <Animated.View 
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.botMessage,
        isLast && { marginBottom: 16 },
        {
          opacity: animation,
          transform: [
            { 
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }
          ]
        }
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatarContainer}>
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.botAvatar}
          >
            <MaterialIcons name="smart-toy" size={18} color="#fff" />
          </LinearGradient>
        </View>
      )}
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText
        ]}>
          {getDisplayedContent()}
        </Text>
        
        {shouldShowSeeMore && (
          <TouchableOpacity 
            onPress={() => setExpanded(!expanded)}
            style={styles.seeMoreContainer}
          >
            <Text style={styles.seeMoreText}>
              {expanded ? "See less" : "See more..."}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.timestamp}>
          {message.formattedTime || new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

const ChatbotScreen = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef(null);

  const suggestedPrompts = [
    "Tell me a joke",
    "What's the weather like today?",
    "Give me a fact about space",
    "Write a short story",
    "Help me plan my day"
  ];

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
    console.log("Component mounted, loading history");
  }, []);

  const loadChatHistory = async () => {
    console.log("Loading chat history...");
    setIsLoadingHistory(true);
    try {
      const history = await chatbotService.getChatHistory(user._id);
      console.log("Chat history received:", history);
      
      if (history && history.messages && history.messages.length > 0) {
        console.log(`Found ${history.messages.length} messages in history`);
        const formattedMessages = chatbotService.formatMessagesForUI(history.messages);
        setMessages(formattedMessages);
      } else {
        console.log("No messages found in history, showing welcome message");
        // Set welcome message if no history
        setMessages([{
          id: 'welcome',
          content: "Hello! I'm LumeAI, your personal assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date(),
          formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Set default welcome message on error
      setMessages([{
        id: 'welcome',
        content: "Hello! I'm LumeAI, your personal assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
        formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    // Create user message object
    const userMessage = {
      id: `user-${Date.now()}`,
      content: message,
      isUser: true,
      timestamp: new Date(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Add user message to chat
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear input and update UI
    setMessage('');
    setShowSuggestions(false);
    setIsLoading(true);
    
    // Ensure scroll to bottom after adding message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send message to API
      const response = await chatbotService.sendMessage(user._id, userMessage.content);
      console.log("Bot response received:", response);

      if (response && response.reply) {
        // Create bot message object
        const botMessage = {
          id: `bot-${Date.now()}`,
          content: response.reply,
          isUser: false,
          timestamp: new Date(),
          formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // Add bot message to chat
        setMessages(prevMessages => [...prevMessages, botMessage]);
        
        // Ensure scroll to bottom after bot response
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        throw new Error("No valid response content");
      }
    } catch (error) {
      console.error('Error handling chat:', error);
      
      // Show error message in chat
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        isUser: false,
        timestamp: new Date(),
        formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await chatbotService.clearChatHistory(user._id);
      console.log("Chat history cleared successfully");
      
      setMessages([{
        id: 'welcome',
        content: "History cleared. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
        formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handlePromptSelect = (prompt) => {
    setMessage(prompt);
    setShowSuggestions(false);
    // Remove the document.querySelector reference which doesn't exist in React Native
  };

  const renderMessageItem = ({ item, index }) => (
    <ChatMessage 
      message={item} 
      isLast={index === messages.length - 1} 
    />
  );

  const renderSuggestions = () => {
    if (!showSuggestions || messages.length > 2) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Try asking</Text>
        <View style={styles.suggestions}>
          {suggestedPrompts.map((prompt, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.suggestionItem}
              onPress={() => handlePromptSelect(prompt)}
            >
              <Text style={styles.suggestionText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient 
      colors={['#36393F', '#2F3136']} 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerName}>LumeAI</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={clearHistory}>
          <MaterialIcons name="delete-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7289DA" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => {
            console.log("Content size changed, scrolling to end");
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            console.log("Layout changed, scrolling to end");
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListHeaderComponent={renderSuggestions()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#72767D"
            value={message}
            onChangeText={setMessage}
            onFocus={() => setShowSuggestions(false)}
            multiline
          />
          {isLoading ? (
            <View style={styles.sendButton}>
              <ActivityIndicator color="#FFFFFF" size={24} />
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <MaterialIcons name="send" size={24} color={message.trim() ? "#FFFFFF" : "#72767D"} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#2F3136',
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#43B581',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#B9BBBE',
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  botAvatarContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#7289DA',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#40444B',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#202225',
    backgroundColor: '#2F3136',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40444B',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7289DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#4F545C',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    color: '#B9BBBE',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  suggestionItem: {
    backgroundColor: 'rgba(114, 137, 218, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(114, 137, 218, 0.3)',
  },
  suggestionText: {
    color: '#B9BBBE',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#8E9297',
    fontSize: 16,
    textAlign: 'center',
  },
  seeMoreContainer: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  seeMoreText: {
    color: '#7289DA',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatbotScreen;
