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

export const authService = {
  // Check username availability
  async checkUsernameAvailability(username) {
    const usersRef = collection(firestoreDB, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  },

  // Sign up new user
  async signUp(email, password, fullName, username) {
    // Check username availability
    const isUsernameAvailable = await this.checkUsernameAvailability(username);
    if (!isUsernameAvailable) {
      throw new Error('Username is already taken');
    }

    const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await sendEmailVerification(userCred.user);

    // Store temporary user data in AsyncStorage
    const tempUserData = {
      _id: userCred.user.uid,
      fullName,
      email,
      username: username.toLowerCase(),
      displayName: `@${username}`,
      createdAt: Date.now(),
      emailVerified: false,
      providerData: userCred.user.providerData[0],
    };

    // We'll store this data later when email is verified
    await AsyncStorage.setItem('pendingUserData', JSON.stringify(tempUserData));
    return userCred.user;
  },

  // Sign in existing user
  async signIn(email, password) {
    const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    await updateDoc(doc(firestoreDB, "users", userCred.user.uid), {
      lastLogin: Date.now()
    });
    return userCred.user;
  },

  // Send verification email
  async sendVerificationEmail() {
    const user = firebaseAuth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  },

  // Check email verification status
  async checkEmailVerification() {
    const user = firebaseAuth.currentUser;
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        try {
          // Get pending user data from AsyncStorage
          const pendingDataString = await AsyncStorage.getItem('pendingUserData');
          const pendingUserData = pendingDataString ? JSON.parse(pendingDataString) : null;

          if (pendingUserData) {
            // Store in Firestore only after verification
            await setDoc(doc(firestoreDB, "users", user.uid), {
              ...pendingUserData,
              emailVerified: true,
              verifiedAt: Date.now()
            });
            // Clear temporary data
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
    await signOut(firebaseAuth);
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
