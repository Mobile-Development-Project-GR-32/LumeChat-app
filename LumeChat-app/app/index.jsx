import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import Store from "../context/store";

// Import your screen components
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import HomeScreen from "../screens/HomeScreen";
import SplashScreen from "../screens/SplashScreen";
import CreateChannelScreen from "../screens/CreateChannelScreen";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <Provider store={Store}>
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
      </Stack.Navigator>
    </Provider>
  );
};

export default App;