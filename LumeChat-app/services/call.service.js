import apiConfig from '../config/api.config';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';

const API_URL = apiConfig.API_URL;

export const callService = {
    getHeaders: (userId) => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'user-id': userId
    }),

    connectUserToCallService: () => {

    },

    createCall: (client) => {
        
    },

    joinCall: () => {

    },

    rejectCall: () => {

    },
    
    leaveCall: () => {

    },

    endCall: () => {

    }
}