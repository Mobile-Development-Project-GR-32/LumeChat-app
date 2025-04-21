import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { navigationRef } from './utils/navigationService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import DirectMessagesScreen from './screens/DirectMessagesScreen';
import ChannelChatScreen from './screens/ChannelChatScreen';
import CreateChannelScreen from './screens/CreateChannelScreen';
import InviteUserScreen from './screens/InviteUserScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import { notificationService } from './services/notification.service';

// Create the navigator
const Stack = createStackNavigator();

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: Failed prop type: Invalid prop `textStyle` of type `array`',
]);

export default function App() {
  // Add notification state and refs
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef(null);

  // Initialize notification service when app starts
  useEffect(() => {
    // Initialize the simple notification service
    notificationService.initialize();
    
    // Set up notification listener
    notificationListener.current = notificationService.addNotificationListener(
      notification => {
        console.log('Received notification:', notification);
        setNotification(notification);
      }
    );
    
    // Clean up on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current();
      }
      notificationService.resetBadgeCount();
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="LoginScreen"
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#36393f' }
              }}
            >
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="SignupScreen" component={SignupScreen} />
              <Stack.Screen name="HomeScreen" component={HomeScreen} />
              <Stack.Screen 
                name="DirectMessages" 
                component={DirectMessagesScreen}
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen 
                name="ChannelChat" 
                component={ChannelChatScreen}
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen name="CreateChannel" component={CreateChannelScreen} />
              <Stack.Screen name="InviteUser" component={InviteUserScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
});