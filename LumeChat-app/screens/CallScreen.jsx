import { CallContent, CallingState, IncomingCall, OutgoingCall, StreamCall, useCall, useCalls, useCallStateHooks, useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { useEffect, useState } from "react";

const CallScreen = (route) => {
    const [call, setCall] = useState(null);
    const client = useStreamVideoClient();
    const {callId} = route.params;

    useEffect(() => {
        if (!client || call) return;

        const joinCall = async () => {
            const call = client.call('default', callId);
            await call.join({
                create: true
            })
            setCall(call)
        };
        joinCall();
    }, [client])

    if (!call) return null;

    return (
        <StreamCall call={call}>
            <CallPanel/>
        </StreamCall>
    )
}

const CallPanel = () => {
    const call = useCall();
    const isCallCreatedByMe = call?.data?.created_by.id === call?.currentUserId;
    const { useCallingState } = useCallStateHooks();

    const callingState = useCallingState()

    switch (callingState) {
        case CallingState.RINGING:
            return isCallCreatedByMe ? (
                <OutgoingCall/>
            ) : (
                <IncomingCall/>
            );
        default:
            return <CallContent/>
    }
}

export default CallScreen