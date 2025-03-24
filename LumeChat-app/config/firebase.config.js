import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = Constants.expoConfig.extra.firebaseConfig;

const app = getApps.length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize auth with AsyncStorage persistence
const firebaseAuth = getApps.length > 0 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

const firestoreDB = getFirestore(app);

export { app, firebaseAuth, firestoreDB };
