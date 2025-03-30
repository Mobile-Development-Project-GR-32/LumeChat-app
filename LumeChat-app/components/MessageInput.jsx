import { useState } from 'react'
import {View, TextInput} from 'react-native'

const MessageInput = ({placeholder}) => {
    const [message, setMessage] = useState("")

    return (
        <View>
            <TextInput
                className="flex-1 text-base text-white font-normal ml-2"
                placeholder={placeholder}
                value={message}
                onChangeText={message => setMessage(message)}
            />
        </View>
    )
}

export { MessageInput }