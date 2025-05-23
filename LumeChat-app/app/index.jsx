import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider, useSelector } from "react-redux";
import Store from "../context/store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { Platform, Text, View } from 'react-native';
import Constants from 'expo-constants';
// Conditionally import Stream Video SDK
let StreamVideo, StreamVideoClient;
try {
  // This might fail in Expo Go
  const StreamVideoPackage = require('@stream-io/video-react-native-sdk');
  StreamVideo = StreamVideoPackage.StreamVideo;
  StreamVideoClient = StreamVideoPackage.StreamVideoClient;
} catch (error) {
  console.log('Stream Video SDK is not available in this environment');
}
import {GETSTREAM_API_KEY, API_URL} from '../config/api.config'
import { VideoWrapper } from "../components/VideoWrapper";

// Import your screen components
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import HomeScreen from "../screens/HomeScreen";
import SplashScreen from "../screens/SplashScreen";
import ChannelChatScreen from '../screens/ChannelChatScreen';
import DirectMessagesScreen from '../screens/DirectMessagesScreen';
import CreateChannelScreen from "../screens/CreateChannelScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import NotificationsScreen from "../screens/Notifications_Screen"; 
import PrivacyScreen from "../screens/settings/PrivacyScreen";
import SecurityScreen from "../screens/settings/SecurityScreen";
import ThemeScreen from "../screens/settings/ThemeScreen";
import QRCodeScreen from "../screens/settings/QRCodeScreen";
import ChatbotScreen from "../screens/ChatbotScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import QRScannerScreen from "../screens/QRScannerScreen";
import ChannelProfileScreen from "../screens/ChannelProfileScreen";
import EditChannelScreen from "../screens/EditChannelScreen";
import DiscoverChannelsScreen from "../screens/DiscoverChannelsScreen";
import ChannelInviteScreen from "../screens/ChannelInviteScreen";
import ChannelMembersScreen from "../screens/ChannelMembersScreen";
import InviteAcceptScreen from "../screens/InviteAcceptScreen";
import InviteFriendsScreen from "../screens/InviteFriendsScreen";
import CallScreen from "../screens/CallScreen";
import MeetingScreen from "../screens/MeetingScreen"
import Calls from '../screens/Calls'

const Stack = createNativeStackNavigator();

// Create a fallback component for when Stream Video is not available
const StreamVideoFallback = ({ children }) => {
  return children;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const [isExpoGo, setIsExpoGo] = useState(false);
  
  // Check if running in Expo Go
  useEffect(() => {
    const checkExpoGo = async () => {
      const isExpoGoEnv = Constants.executionEnvironment === 'storeClient';
      setIsExpoGo(isExpoGoEnv);
    };
    
    checkExpoGo();
  }, []);
  
  // Initialize video client only if StreamVideoClient is available
  const videoClient = !isExpoGo && StreamVideoClient ? new StreamVideoClient('zumtanjchqpa') : null;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(userData) });
        }
      } catch (error) {
        // Silent error handling
      }
    };

    loadUser();
  }, []);

  // Load the deleted channels list when app starts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load deleted channels list to prevent polling for already deleted channels
        const { default: channelService } = await import('../services/channel.service');
        await channelService.loadDeletedChannelsList();
      } catch (error) {
        // Silent error handling
      }
    };
    
    initializeApp();
  }, []);

  const appContent = (
      <>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />   
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen 
        name="CreateChannel" 
        component={CreateChannelScreen}
        options={{
          headerShown: true,
          headerTitle: 'Create Channel',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen name="ChannelChat" component={ChannelChatScreen}/>
      <Stack.Screen name="DirectMessages" component={DirectMessagesScreen}/>
      
      <Stack.Screen 
        name="ChannelProfile" 
        component={ChannelProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Channel Profile',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />

      <Stack.Screen 
        name="EditChannel" 
        component={EditChannelScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Channel',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Profile',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
        initialParams={{ userId: null }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'User Profile',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Settings',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      
      <Stack.Screen name="Privacy" component={PrivacyScreen}
        options={{
          headerShown: true,
          headerTitle: 'Privacy & Safety',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen name="Security" component={SecurityScreen}
        options={{
          headerShown: true,
          headerTitle: 'Security',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen name="Theme" component={ThemeScreen}
        options={{
          headerShown: true,
          headerTitle: 'Appearance',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen name="QRCode" component={QRCodeScreen}
        options={{
          headerShown: true,
          headerTitle: 'QR Code',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      
      <Stack.Screen 
        name="DiscoverChannels" 
        component={DiscoverChannelsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Discover Channels',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      
      <Stack.Screen 
        name="ChannelInvite" 
        component={ChannelInviteScreen}
        options={{
          headerShown: true,
          headerTitle: 'Invite to Channel',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />

      <Stack.Screen 
        name="InviteAccept" 
        component={InviteAcceptScreen}
        options={{
          headerShown: false
        }}
      />

      <Stack.Screen 
        name="ChannelMembers" 
        component={ChannelMembersScreen}
        options={{
          headerShown: true,
          headerTitle: 'Channel Members',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />

      <Stack.Screen 
        name="InviteFriends" 
        component={InviteFriendsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Add Friends to Channel',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />

      <Stack.Screen 
        name="Notifications_Screen" 
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Call" component={CallScreen} />
      <Stack.Screen name="ChannelMeeting" component={MeetingScreen} />
      </>
  )

  // Conditional rendering based on environment
  if (isExpoGo) {
    return (
      <>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {appContent}
        </Stack.Navigator>
        {/* Skip Calls component in Expo Go since it depends on native modules */}
      </>
    );
  }

  // Use Stream Video SDK only when available
  return StreamVideo && videoClient ? (
    <StreamVideo client={videoClient}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {appContent}
      </Stack.Navigator>
      <Calls/>
    </StreamVideo>
  ) : (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {appContent}
    </Stack.Navigator>
  );
};

// Export the AppContent as default
export default App = () => {
  return (
    <Provider store={Store}>
        <PaperProvider>
            <AppContent />
        </PaperProvider>
    </Provider>
  );
}