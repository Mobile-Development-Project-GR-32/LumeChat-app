import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import {Message} from './Message.jsx'
import {MessageInput} from './MessageInput.jsx'

const MessageBoard = ({channel}) => {
    const [messages, setMessages] = useState([])

    return (
        <View>
            <Text>
                #{channel}
            </Text>
            <FlatList
                data={messages}
                renderItem={({message}) => <Message message={message}/>}
            />
            <MessageInput placeholder={'send a message to #' + channel}/>
        </View>
    )
}

export { MessageBoard }