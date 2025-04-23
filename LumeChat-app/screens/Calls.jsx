import { CallingState, RingingCallContent, StreamCall, useCalls } from "@stream-io/video-react-native-sdk"
import { useCallback, useEffect } from "react"
import { Alert, SafeAreaView, StyleSheet } from "react-native"

const Calls = () => {
    const calls = useCalls().filter((c) => c.ringing)

    const handleCalls = useCallback(async() => {
        const lastCallCreatedBy = calls[1]?.state.createdBy
        Alert.alert(
            `Incoming call from ${
                lastCallCreatedBy?.name ?? lastCallCreatedBy?.id
            }, only 1 call at a time is supported`,
        )
    }, [calls])

    useEffect(() => {
        if(calls.length > 1) {
            handleCalls()
        }
    }, calls.length, handleCalls)

    const firstCall = calls[0]

    if(!firstCall) {
        return null
    }

    return (
        <StreamCall call={firstCall}>
            <CallLeaveOnUnmount call={firstCall}/>
            <SafeAreaView style={styles.container}>
                <RingingCallContent/>
            </SafeAreaView>
        </StreamCall>
    )
}

const CallLeaveOnUnmount = ({call}) => {
    useEffect(() => {
        return () => {
            if(call && call.state.callingState !== CallingState.LEFT) {
                call.leave()
            }
        }
    }, [])
    return null
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject
    }
})

export default Calls