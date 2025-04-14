import { View, Alert, FlatList, TextInput, Text } from "react-native"
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { messageService } from "../services/message.service"

const ChatScreen = ({route}) => {
    const currentChannel = route.params;
    const user = useSelector((state) => state.user);
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchMessages(currentChannel.name);
    }, [])
    
    const fetchMessages = async (channel) => {
        setIsLoading(true)
        try {
            const messageData = await messageService.getMessagesByChannelName(channel)
    
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
                channel: channel
            }
            const response = await messageService.postMessage(user._id, messageData)
            setMessages([...messages, {...messageData, id: response.data.id}])
            setMessage('')
        } catch (error) {
            console.error('Post message error:', error);
            Alert.alert('Error', error.message || 'Failed to post message');
        }
    }

    const MessageComponent = ({messageData}) => {
        const timestamp = new Date(messageData.timestamp).toUTCString()
        return (
            <Text>
                {messageData.messageContent}
                <Text>{timestamp}</Text>
            </Text>
        )
    }

    const MessageBoardComponent = ({channel}) => {
        return (
            <View>
                <Text>
                    #{channel}
                </Text>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({item}) => { return <MessageComponent messageData={item}/> }}
                />
                <TextInput
                    className="flex-1 text-base text-white font-normal ml-2"
                    placeholder={"send a message to #"+channel}
                    value={message}
                    onChangeText={message => setMessage(message)}
                    submitBehavior='submit'
                    onSubmitEditing={() => {
                        handleSubmit(message);
                    }}
                />
            </View>
        )
    }

    return (
        <View className="flex-1 bg-discord-bg p-6">
              <View className="flex-1 items-center justify-center">
                <View className="w-full bg-discord-card p-8 rounded-md">
                    <MessageBoardComponent channel={currentChannel.name}/>
                </View>
              </View>
        </View>
    )
}

export default ChatScreen