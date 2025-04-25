import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseAuth, firestoreDB } from '../config/firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from './profile.service';
import { avatars } from '../utils/supports';
import apiConfig from '@/config/api.config';

const API_URL = apiConfig.API_URL

export const authService = {
  // Check username availability
  async checkUsernameAvailability(username) {
    const usersRef = collection(firestoreDB, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  },

  // Sign up new user
  signUp: async (email, password, fullName, username) => {
    try {
      // Check username availability first
      const isUsernameAvailable = await authService.checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        throw new Error('Username is already taken');
      }

      // Create user with Firebase Auth
      const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);

      // Send verification email
      await sendEmailVerification(userCred.user);

      // Create initial user data with null for profilePic and defaults for empty fields
      const userData = {
        _id: userCred.user.uid,
        id: userCred.user.uid,
        fullName: fullName || `User ${userCred.user.uid.substring(0, 6)}`,
        email,
        username: username.toLowerCase(),
        status: 'Hey there! I am using LumeChat',
        createdAt: new Date().toISOString(),
        emailVerified: false,
        profilePic: null  // Explicitly set to null instead of undefined
      };

      // Store in AsyncStorage for later verification
      await AsyncStorage.setItem('pendingUserData', JSON.stringify(userData));
      
      return userCred.user;

    } catch (error) {
      throw new Error(
        error.code === 'auth/email-already-in-use' ? 'Email is already in use.' :
        error.code === 'auth/invalid-email' ? 'Invalid email address.' :
        error.code === 'auth/operation-not-allowed' ? 'Operation not allowed.' :
        error.code === 'auth/weak-password' ? 'Password is too weak.' :
        error.message || 'Unable to sign up. Please try again later.'
      );
    }
  },

  // Sign in existing user
  signIn: async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      
      // Get fresh profile data from API
      try {
        const profile = await profileService.getProfile(userCred.user.uid);
        
        // If we only got a fallback profile, try to enhance it with Firebase data
        if (profile.isFallback) {
          // Get user document from Firestore
          const userDocRef = doc(firestoreDB, "users", userCred.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Merge Firebase data with the fallback profile
            const enhancedProfile = {
              ...profile,
              ...userData,
              _id: userCred.user.uid,
              id: userCred.user.uid,
              isFallback: false
            };
            
            await AsyncStorage.setItem('user', JSON.stringify(enhancedProfile));
            return enhancedProfile;
          }
        }
        
        // Store complete profile data
        await AsyncStorage.setItem('user', JSON.stringify(profile));
        return profile;
      } catch (profileError) {
        // Fallback to creating a basic profile from Firebase Auth data
        const basicProfile = {
          _id: userCred.user.uid,
          id: userCred.user.uid,
          fullName: userCred.user.displayName || `User ${userCred.user.uid.substring(0, 6)}`,
          email: userCred.user.email,
          username: userCred.user.email?.split('@')[0]?.toLowerCase() || `user_${userCred.user.uid.substring(0, 6)}`,
          status: 'Available',
          emailVerified: userCred.user.emailVerified,
          isFallback: true
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(basicProfile));
        return basicProfile;
      }
    } catch (error) {
      throw new Error(
        error.code === 'auth/user-not-found' ? 'Account not found. Please sign up first.' :
        error.code === 'auth/wrong-password' ? 'Incorrect password. Please try again.' :
        error.code === 'auth/invalid-email' ? 'Invalid email address.' :
        error.code === 'auth/too-many-requests' ? 'Too many failed attempts. Please try again later.' :
        'Unable to login. Please check your credentials.'
      );
    }
  },

  // Send verification email
  async sendVerificationEmail() {
    const user = firebaseAuth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  },

  // Check email verification status
  checkEmailVerification: async () => {
    const user = firebaseAuth.currentUser;
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        try {
          const pendingDataString = await AsyncStorage.getItem('pendingUserData');
          const pendingUserData = JSON.parse(pendingDataString);

          if (pendingUserData) {
            // Ensure required fields aren't undefined before writing to Firestore
            // Fix for Firestore unsupported field value error
            const userData = {
              ...pendingUserData,
              emailVerified: true,
              verifiedAt: new Date().toISOString(),
              profilePic: null  // Explicitly set to null instead of undefined
            };

            await setDoc(doc(firestoreDB, "users", user.uid), userData);
            await AsyncStorage.removeItem('pendingUserData');

            // Also update the user in AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          }
          return true;
        } catch (error) {
          return false;
        }
      }
      return false;
    }
    return false;
  },

  // Reset password
  async resetPassword(email) {
    await sendPasswordResetEmail(firebaseAuth, email);
  },

  // Sign out user
  async signOut() {
    try {
      // Clean up all deleted channel data first
      try {
        const { default: channelService } = await import('./channel.service');
        
        // Save the deleted channels list before signing out
        await channelService.saveDeletedChannelsList();
        
        // Clean up all channel-related data
        await channelService.clearAllDeletedChannels();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Stop ALL active polling for all channels
      try {
        const { default: messageService } = await import('./message.service');
        if (messageService.activePolling) {
          for (const [channelId, intervalId] of messageService.activePolling.entries()) {
            clearInterval(intervalId);
          }
          messageService.activePolling.clear();
        }
      } catch (pollError) {
        // Ignore polling errors
      }
      
      // Remove all channel-related data from AsyncStorage
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const channelKeys = allKeys.filter(key => 
          key.includes('channel_') || 
          key.includes('channelMessages_') || 
          key.includes('channelMembers_') ||
          key === 'publicChannels' ||
          key === 'privateChannels' ||
          key === 'allChannels' ||
          key === 'recentChannels'
        );
        
        if (channelKeys.length > 0) {
          await AsyncStorage.multiRemove(channelKeys);
        }
      } catch (storageError) {
        // Ignore storage errors
      }
      
      await signOut(firebaseAuth);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      throw error;
    }
  },

  // Get current user data
  async getCurrentUser() {
    const user = firebaseAuth.currentUser;
    if (user) {
      const docRef = doc(firestoreDB, "users", user.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.data();
    }
    return null;
  }
};
