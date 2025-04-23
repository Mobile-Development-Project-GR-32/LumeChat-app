import {useNavigation, useRoute} from '@react-navigation/core'
import { JoinCallButton, Lobby } from '@stream-io/video-react-native-sdk'
import { useCallback } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

const LobbyView = ({callId, onJoinCallHandler}) => {
    const navigation = useNavigation()
    const route = useRoute()

    const JoinCallButtonComponent = useCallback(() => {
        return (
            <>
                <JoinCallButton onPressHandler={onJoinCallHandler}/>
                {route.name !== 'ChannelMeeting' && (
                    <Pressable 
                        style={{marginTop: 8}}
                        onPress={() => {
                            navigation.navigate('ChannelMeeting', {callId: callId})
                        }}
                    >
                        <Text>Join</Text>
                    </Pressable>
                )}
            </>
        )
    }, [onJoinCallHandler, callId, navigation, route.name])

    return (
        <View style={styles.container}>
            <Lobby JoinCallButton={JoinCallButtonComponent} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})

export default LobbyView