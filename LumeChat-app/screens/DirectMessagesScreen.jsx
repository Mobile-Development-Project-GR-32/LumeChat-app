import { View, Alert, FlatList, TextInput, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ActivityIndicator, Platform } from "react-native"
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { messageService } from "../services/message.service"
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";

const ChatMessage = ({messageData, receiverAvatar, userName}) => {
    const user = useSelector((state) => state.user);
    const isSender = messageData.user === user._id;
    return (
        <View style={[
            styles.messageContainer,
            isSender ? styles.senderMessage : styles.repicientMessage]}
        >
          {!isSender && (
              receiverAvatar ? (
                <Image 
                  source={{ uri: receiverAvatar }}
                  style={styles.botAvatar}
                  defaultSource={require('../assets/default-avatar.png')}
                />
              ) : (
                <View style={[styles.botAvatarContainer, styles.botAvatar]}>
                  <Text style={styles.userInitial}>
                      {userName.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )
          )}
          <View style={[
            styles.messageBubble,
            isSender ? styles.userBubble : styles.botBubble
          ]}>
            <Text style={[styles.messageText, styles.userText]}>
                {messageData.messageContent}
            </Text>
            <Text style={styles.timestamp}>{new Date(messageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View> 
        </View>
    )
}

const DirectMessagesScreen = ({route, navigation}) => {
    const {userId, userName, userAvatar} = route.params;
    const user = useSelector((state) => state.user);
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const streamClient = useStreamVideoClient()

    useEffect(() => {
        fetchMessages(user._id, userId);
    }, [])
    
    const fetchMessages = async (userId, receiverId) => {
        setIsLoading(true)
        try {
            const messageData = await messageService.getDirectMessages(userId, receiverId)
    
            setMessages(messageData || [])
        } catch (error) {
            console.error('Error fetching messages:', error);
            Alert.alert('Error', 'Failed to load messages');
        } finally {
            setIsLoading(false)
        }
    }
    
    const handleSubmit = async (message) => {
        try {
            const messageData = {
                messageContent: message,
                timestamp: Date.now(),
                user: user._id,
                receiver: userId
            }
            const response = await messageService.postDirectMessage(user._id, messageData)
            setMessages([...messages, {...messageData, id: response.data.id}])
            setMessage('')
        } catch (error) {
            console.error('Post message error:', error);
            Alert.alert('Error', error.message || 'Failed to post message');
        }
    }

    const startVideoCall = async () => {
      const type = 'default'
      const callId = user._id +'-'+userId+'-vid-call'
      const call = streamClient.call(type, callId)

      await call.join({
        create: true,
        ring: true,
        video: true,
        data: {
          members: [{user_id: user._id, role: 'host'}, {user_id: userId}],
        }
      })
    }

    const startAudioCall = async () => {
      const type = 'default'
      const callId = user._id +'-'+userId+'-audio-call'
      const call = streamClient.call(type, callId)

      await call.join({
        create: true,
        ring: true,
        video: false,
        data: {
          members: [{user_id: user._id}, {user_id: userId}],
        }
      })
    }

    const renderMessageItem = ({ item }) => (
        <ChatMessage 
          messageData={item}
          receiverAvatar={userAvatar}
          userName={userName}
        />
    );

    return (
        <LinearGradient 
            colors={['#36393F', '#2F3136']} 
            style={styles.container}
        >
            <View>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Text style={styles.headerName}>{userName}</Text>
                        <View style={styles.statusContainer}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Online</Text>
                    </View>
                    <TouchableOpacity style={styles.backButton} onPress={startVideoCall}>
                        <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backButton} onPress={startAudioCall}>
                        <MaterialIcons name="phone" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                </View>
                  <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMessageItem}
                        contentContainerStyle={styles.messagesContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No messages yet. Start a conversation!</Text>
                            </View>
                        }
                    />
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={100}
                        style={styles.inputContainer}
                    >
                        <View style={styles.inputWrapper}>
                            <TextInput
                                className="flex-1 text-base text-white font-normal ml-2"
                                placeholder={"send a message to #"+userName}
                                value={message}
                                onChangeText={message => setMessage(message)}
                                submitBehavior='submit'
                                onSubmitEditing={() => {
                                    handleSubmit(message);
                                }}
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
                                    onPress={handleSubmit}
                                    disabled={!message.trim()}
                                >
                                    <MaterialIcons name="send" size={24} color={message.trim() ? "#FFFFFF" : "#72767D"} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
        </LinearGradient>
    )
}

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
  senderMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  repicientMessage: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  botAvatarContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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

export default DirectMessagesScreen