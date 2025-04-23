import { Pressable, Text, StyleSheet, View, Platform } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons';
import { useCall, useCallStateHooks } from '@stream-io/video-react-native-sdk';



const CustomCallControls = ({onHangUpCallHandler}) => {
    const call = useCall()
    const { useMicrophoneState, useCameraState,  } = useCallStateHooks()
    const { microphoneStatus } = useMicrophoneState()
    const { cameraStatus } = useCameraState()

    const toggleAudioMuted = async () => {
        await call?.microphone.toggle()
    }

    const toggleVideoMuted = async () => {
        await call?.camera.toggle()
    }

    const toggleCameraFacingMode = async () => {
        await call?.camera.flip()
    }

    return (
        <View>
            <Pressable style={[styles.button, styles.muteMicButton]} onPress={toggleAudioMuted}>
                {microphoneStatus === 'disabled' ? (
                    <MaterialIcons id='mic' size={24}/>
                ) : (
                    <MaterialIcons id='mic-off' size={24}/>
                )}
            </Pressable>
            <Pressable style={[styles.button, styles.toggleVideoButton]} onPress={toggleVideoMuted}>
               {cameraStatus === 'disabled' ? (
                    <MaterialIcons id='videocam' size={24}/>
                ) : (
                    <MaterialIcons id='videocam-off' size={24}/>
                )}
            </Pressable>
            <Pressable style={[styles.button, styles.flipCameraButton]} onPress={toggleCameraFacingMode}>
                <MaterialIcons id='flip-camera-android' size={24}/>
            </Pressable>
            <Pressable style={[styles.button, styles.hangUpButton]} onPress={onHangUpCallHandler}>
                <MaterialIcons id='call-end' size={24} color={'#FFFFFF'}/>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    callControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: '#2F3136',
        borderTopWidth: 1,
        borderTopColor: '#202225',
    },
    button: {
        height: 44,
        width: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    hangUpButton: {
        backgroundColor: 'red'
    },
    muteMicButton: {
        backgroundColor: '#202225'
    },
    toggleVideoButton: {
        backgroundColor: '#202225'
    },
    flipCameraButton: {
        backgroundColor: '#202225'
    }
})

export default CustomCallControls