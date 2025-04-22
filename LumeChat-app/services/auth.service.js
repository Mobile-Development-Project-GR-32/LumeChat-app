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
      console.log('Attempting signup with:', { email, fullName, username });
      
      // Check username availability first
      const isUsernameAvailable = await authService.checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        throw new Error('Username is already taken');
      }

      // Create user with Firebase Auth
      const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      console.log('User created:', userCred.user.uid);

      // Send verification email
      await sendEmailVerification(userCred.user);

      // Create initial user data without profile picture
      const userData = {
        _id: userCred.user.uid,
        fullName,
        email,
        username: username.toLowerCase(),
        status: 'Hey there! I am using LumeChat',
        createdAt: new Date().toISOString(),
        emailVerified: false
      };

      console.log('Storing user data:', userData);

      await fetch(`${API_URL}/profile/register-stream`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          fullName: fullName
        })
      }).then((response) => response.json())
        .then((json) => console.log('Sent user info to GetStream servers:', json))
        .catch((error) => {
          console.log('Signup error:', error)
          throw new Error(error.message)
        })

      // Store in AsyncStorage for later verification
      await AsyncStorage.setItem('pendingUserData', JSON.stringify(userData));
      
      return userCred.user;

    } catch (error) {
      console.error('Signup error:', error);
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
      const profile = await profileService.getProfile(userCred.user.uid);
      
      // Store complete profile data including profilePic
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      
      return profile;
    } catch (error) {
      console.error('Sign in error:', error);
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
            // Get profile picture from API
            const profileData = await profileService.getProfile(user.uid);
            const userData = {
              ...pendingUserData,
              emailVerified: true,
              verifiedAt: new Date().toISOString(),
              profilePic: profileData.profilePic // Use API profile picture
            };

            await setDoc(doc(firestoreDB, "users", user.uid), userData);
            await AsyncStorage.removeItem('pendingUserData');
          }
          return true;
        } catch (error) {
          console.error('Error storing user data:', error);
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
      await signOut(firebaseAuth);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
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
