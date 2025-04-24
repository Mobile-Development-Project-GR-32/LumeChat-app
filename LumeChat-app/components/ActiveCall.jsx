import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { CallContent, StreamTheme, useCall } from '@stream-io/video-react-native-sdk'
import CustomCallControls from './CustomCallControls'


const ActiveCall = ({ onHangupCallHandler, onCallEnded }) => {
    const call = useCall()

    useEffect(() => {
        return call?.on('call.ended', () => {
            onCallEnded()
        })
    }, [call, onCallEnded])

    return (
        <StreamTheme style={styles.container}>
            <CallContent onHangupCallHandler={onHangupCallHandler}/>
        </StreamTheme>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1
    }
})

export default ActiveCall