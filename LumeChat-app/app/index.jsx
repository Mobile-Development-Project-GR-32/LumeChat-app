import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import Store from "../context/store";

// Import your screen components
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import HomeScreen from "../screens/HomeScreen";
import SplashScreen from "../screens/SplashScreen";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <Provider store={Store}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />   
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
      </Stack.Navigator>
    </Provider>
  );
};

export default App;