import { useNavigation, useRoute } from "@react-navigation/core";
import { CallContent, CallingState, IncomingCall, OutgoingCall, StreamCall, useCall, useCalls, useCallStateHooks, useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { useEffect, useState } from "react";
import { View } from "react-native";

const CallScreen = () => {
    const [call, setCall] = useState(null);
    const client = useStreamVideoClient();
    const route = useRoute()
    const navigation = useNavigation()
    const { callId } = route.params;

    useEffect(() => {
        if (!client || call) return;
        const call = client.call('default', callId).create();
        const joinCall = async () => {
            await call.join()
            .then(
                () => setCall(call),
                () => console.error('Failed to join call')
            )
            
        };
        joinCall();
    }, [client, callId])

    const returnToPreviousScreen = () => {
        navigation.goBack()
    }

    if (!call) return null;

    return (
        <View style={{ flex: 1}}>
            <StreamCall call={call}>
                <CallPanel/>
            </StreamCall>
        </View>
    )
}

const CallPanel = () => {
    const call = useCall();
    const isCallCreatedByMe = call?.data?.created_by.id === call?.currentUserId;
    const {useCallCallingState} = useCallStateHooks();

    const callingState = useCallCallingState()

    switch (callingState) {
        case CallingState.RINGING:
            return isCallCreatedByMe ? (
                <OutgoingCall/>
            ) : (
                <IncomingCall/>
            );
        case CallingState.JOINED:
            return <CallContent/>
        default:
            return <CallContent/>
    }
}

export default CallScreen