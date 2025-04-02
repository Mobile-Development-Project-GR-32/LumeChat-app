import { useState } from "react"
import { View } from "react-native"
import { MessageBoard } from '../components/MessageBoard.tsx'

const ChatScreen = () => {
    const [channels, setChannels] = useState('')
    const [currentChannel, setCurrentChannel] = useState('Placeholder')

    return (
        <View>
            <MessageBoard channel={currentChannel}/>
        </View>
    )
}

export default ChatScreen