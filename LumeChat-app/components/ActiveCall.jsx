import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { CallContent, useCall } from '@stream-io/video-react-native-sdk'
import CustomCallControls from './CustomCallControls'


const ActiveCall = ({ onHangupCallHandler, onCallEnded }) => {
    const call = useCall()

    useEffect(() => {
        return call?.on('call.ended', () => {
            onCallEnded()
        })
    }, [call, onCallEnded])

    const CustomButtonControls = () => {
        return (
            <CustomCallControls onHangupCallHandler={onHangupCallHandler} />
        )
    }

    return (
        <View styles = {styles.container}>
            <CallContent
                onHangupCallHandler={onHangupCallHandler}
                CallControls={CustomButtonControls}
             />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#36393F',
    }
})

export default ActiveCall