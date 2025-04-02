import { useState } from "react";
import { FlatList, Text, View, TextInput } from "react-native";
import {Message} from './Message'

type MessageBoardProps = {channel:string}
type MessagesType = {id:number, text:string}[]

const MessageBoard = ({channel}:MessageBoardProps) => {
    const [messages, setMessages] = useState<MessagesType>([])
    const [message, setMessage] = useState('')

    const handleSubmit = (message:string) => {
        setMessages([...messages, {id: messages.length, text: message}])
    }

    return (
        <View>
            <Text>
                #{channel}
            </Text>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => { return <Message message={item.text}/> }}
            />
            <TextInput
                className="flex-1 text-base text-white font-normal ml-2"
                placeholder={"send a message to #"+channel}
                value={message}
                onChangeText={message => setMessage(message)}
                submitBehavior='submit'
                onSubmitEditing={() => {
                    handleSubmit(message)
                    setMessage('')
                }}
            />
        </View>
    )
}

export { MessageBoard }