import { useState } from "react"
import { View } from "react-native"
import { MessageBoard } from '../components/MessageBoard.jsx'

const ChatScreen = () => {
    const [channels, setChannels] = useState('')
    const [currentChannel, setCurrentChannel] = useState('')

    return (
        <View>
            <MessageBoard channel={currentChannel}/>
        </View>
    )
}

export default ChatScreen