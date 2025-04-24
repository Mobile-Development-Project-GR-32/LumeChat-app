import { useNavigation, useRoute } from "@react-navigation/core";
import { CallContent, CallingState, StreamCall, StreamTheme, useCall, useCallStateHooks, useStreamVideoClient } from "@stream-io/video-react-native-sdk"
import { useCallback, useEffect, useState } from "react";
import LobbyView from '../components/LobbyView'

const MeetingScreen = () => {
    const client = useStreamVideoClient()
    const route = useRoute()
    const navigation = useNavigation()
    const { callId, channelName } = route.params

    const call = client.call('default', callId)

    useEffect(() => {
        const getOrCreateCall = async () => {
            try {
                await call?.getOrCreate({
                    data: {
                        custom: {
                            channelName: channelName
                        }
                    }
                })
            } catch(error) {
                console.error('Failed to get or create a call', error)
            }
        }

        getOrCreateCall()
    }, [call])

    if (!call) {
        return null;
    }

    return (
        <StreamCall call={call}>
            <MeetingUI callId={callId} />
        </StreamCall>
    )
}

const MeetingUI = ({callId}) => {
    const [show, setShow] = useState('lobby')
    const call = useCall()
    const navigation = useNavigation()
    const { useCallCallingState } = useCallStateHooks()
    const callingState = useCallCallingState()

    useEffect(() => {
        return () => {
            const leaveCall = async () => {
                try {
                    await call?.leave()
                } catch(error) {
                    console.log('Error leaving call:', error)
                }
            }
            if (call.state.callingState !== CallingState.LEFT) {
                leaveCall()
            }
        }
    })

    const joinCallHandler = useCallback(async () => {
        try {
            await call?.join({create: true})
            setShow('active-call')
        } catch(error) {
            console.log('Error joining call:', error)
        }
    }, [call])

    const onCallHangupHandler = async () => {
        try {
            if (callingState !== CallingState.LEFT) {
                await call?.leave()
            }
            navigation.goBack()
        } catch(error) {
            console.log('Error leaving call:', error)
        }
    }

    const onCallEnded = () => {
        navigation.goBack()
    }

    if(show === 'lobby') {
        return <LobbyView callId={callId} onJoinCallHandler={joinCallHandler}/>
    }
    else {
        return (
            <StreamTheme>
                <CallContent onHangupCallHandler={onCallHangupHandler}/>
            </StreamTheme>
        )
    }
}

export default MeetingScreen