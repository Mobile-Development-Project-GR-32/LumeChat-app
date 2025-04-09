import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import Store from "../context/store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';

// Import your screen components
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import HomeScreen from "../screens/HomeScreen";
import SplashScreen from "../screens/SplashScreen";
import ChatScreen from '../screens/ChatScreen';
import CreateChannelScreen from "../screens/CreateChannelScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import NotificationsScreen from "../screens/settings/NotificationsScreen";
import PrivacyScreen from "../screens/settings/PrivacyScreen";
import SecurityScreen from "../screens/settings/SecurityScreen";
import ThemeScreen from "../screens/settings/ThemeScreen";
import QRCodeScreen from "../screens/settings/QRCodeScreen";

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(userData) });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUser();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="ChatScreen" component={ChatScreen}/>
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
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
        options={{
          headerShown: true,
          headerTitle: 'Privacy & Safety',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Security" 
        component={SecurityScreen}
        options={{
          headerShown: true,
          headerTitle: 'Security',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Theme" 
        component={ThemeScreen}
        options={{
          headerShown: true,
          headerTitle: 'Appearance',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="QRCode" 
        component={QRCodeScreen}
        options={{
          headerShown: true,
          headerTitle: 'QR Code',
          headerStyle: {
            backgroundColor: '#2f3136',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <Provider store={Store}>
      <PaperProvider>
        <AppContent />
      </PaperProvider>
    </Provider>
  );
};

export default App;