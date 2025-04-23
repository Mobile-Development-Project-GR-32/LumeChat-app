import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-native-sdk"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import {GETSTREAM_API_KEY, API_URL} from '../config/api.config'

export const VideoWrapper = ({children}) => {
    const [videoClient, setVideoClient] = useState(undefined)
    const user = useSelector((state) => state.user)

    useEffect(() => {
        let _videoClient;
        const run = async () => {
            const tokenProvider = await fetch(`${API_URL}/profile/get-token`).then(response => response.json())
            const userObject = {id: user._id, name: user.username}
            _videoClient = StreamVideoClient.getOrCreateInstance(GETSTREAM_API_KEY, userObject, tokenProvider)
            setVideoClient(_videoClient)
        }
        if(user) {
            run()
        }

        return () => {
            _videoClient?.disconnectUser()
            setVideoClient(undefined)
        }
    })

    if(!videoClient) {
        return null;
    }

    return (
        <StreamVideo client={videoClient}>
            {children}
        </StreamVideo>
    )
}