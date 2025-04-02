import { useState } from "react"
import { View } from "react-native"
import { MessageBoard } from '../components/MessageBoard.tsx'

const ChatScreen = () => {
    const [channels, setChannels] = useState('')
    const [currentChannel, setCurrentChannel] = useState('Placeholder')

    return (
        <View className="flex-1 bg-discord-bg p-6">
              <View className="flex-1 items-center justify-center">
                <View className="w-full bg-discord-card p-8 rounded-md">
                    <MessageBoard channel={currentChannel}/>
                </View>
              </View>
        </View>
    )
}

export default ChatScreen