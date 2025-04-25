import Constants from 'expo-constants';

// Get API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl;
const GETSTREAM_API_KEY = process.env.GETSTREAM_API_KEY

export default { API_URL };
