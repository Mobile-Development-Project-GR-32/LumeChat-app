import Constants from 'expo-constants';

// Get API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

export default { API_URL };
