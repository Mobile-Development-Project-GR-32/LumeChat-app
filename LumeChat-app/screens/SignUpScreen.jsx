import { 
  View, Text, TextInput, TouchableOpacity, 
  Modal, StyleSheet, Alert, ActivityIndicator, ScrollView 
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { authService } from '../services/auth.service';
import { UserTextInput } from "../components";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let verificationCheck;
    if (isVerificationSent) {
      verificationCheck = setInterval(async () => {
        try {
          const isVerified = await authService.checkEmailVerification();
          
          if (isVerified) {
            clearInterval(verificationCheck);
            setIsVerificationSent(false);
            
            // Ensure we navigate with a slight delay to allow state updates
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }],
              });
            }, 500);
          }
        } catch (error) {
          // Silent error handling
        }
      }, 3000); // Increased interval to 3 seconds to reduce API load
    }
    
    return () => {
      if (verificationCheck) {
        clearInterval(verificationCheck);
      }
    };
  }, [isVerificationSent, navigation]);

  const validateUsername = (text) => {
    const sanitizedUsername = text.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    
    if (sanitizedUsername !== text) {
      setUsernameError("Only letters, numbers, and underscore allowed");
    } else if (sanitizedUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters");
    } else if (sanitizedUsername.length > 20) {
      setUsernameError("Username must not exceed 20 characters");
    } else {
      setUsernameError("");
    }
    
    return sanitizedUsername;
  };

  const validateFullName = (text) => {
    if (text.length < 2) {
      setFullNameError("Full name must be at least 2 characters");
      return false;
    } else if (text.length > 50) {
      setFullNameError("Full name must not exceed 50 characters");
      return false;
    } else {
      setFullNameError("");
      return true;
    }
  };

  const handleUsernameChange = async (text) => {
    const sanitizedUsername = validateUsername(text);
    setUsername(sanitizedUsername);
    
    if (sanitizedUsername.length >= 3) {
      setIsCheckingUsername(true);
      try {
        const isAvailable = await authService.checkUsernameAvailability(sanitizedUsername);
        if (!isAvailable) {
          setUsernameError("Username is already taken");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      }
      setIsCheckingUsername(false);
    }
  };

  const handleSignUp = async () => {
    if (!getEmailValidationStatus || !username || !password || !fullName) {
      Alert.alert('Error', 'Please fill all fields correctly');
      return;
    }

    if (usernameError || fullNameError) {
      Alert.alert('Error', 'Please fix the errors before continuing');
      return;
    }

    setIsSubmitting(true);
    try {
      // Sign up with auth service
      const user = await authService.signUp(
        email.trim(),
        password,
        fullName.trim(),
        username.trim()
      );

      setIsVerificationSent(true);
      
      // Add a confirmation alert to ensure user knows what to do
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and verify your account. You will be redirected to login automatically once verified.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const VerificationModal = () => (
    <Modal
      transparent
      visible={isVerificationSent}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialIcons name="mark-email-read" size={50} color="#5865F2" />
          <Text style={styles.modalTitle}>Check Your Email</Text>
          <Text style={styles.modalText}>
            We've sent a verification link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.modalSubText}>
            Once verified, you'll be automatically redirected to login
          </Text>
          
          {/* Add a manual login button as fallback */}
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => {
              setIsVerificationSent(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }],
              });
            }}
          >
            <Text style={styles.modalButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#202225', '#2f3136', '#36393f']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glowPattern}>
          <LinearGradient
            colors={['rgba(114,137,218,0.2)', 'transparent']}
            style={styles.glow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.brandText}>LumeChat</Text>
          <Text style={styles.welcomeText}>Create your space</Text>
          <Text style={styles.subtitleText}>Where conversations evolve</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>FULL NAME</Text>
            <View style={[styles.inputContainer, fullNameError && styles.inputError]}>
              <MaterialIcons name="person" size={24} color="#7289da" />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  validateFullName(text);
                }}
              />
            </View>
            {fullNameError && <Text style={styles.errorText}>{fullNameError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>EMAIL</Text>
            <UserTextInput
              placeholder="Enter your email"
              isPass={false}
              setStatValue={setEmail}
              setGetEmailValidationStatus={setGetEmailValidationStatus}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>USERNAME</Text>
            <View style={[styles.inputContainer, usernameError && styles.inputError]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a unique username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isCheckingUsername && (
                <ActivityIndicator size="small" color="#7289da" />
              )}
            </View>
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>PASSWORD</Text>
            <UserTextInput
              placeholder="Enter a password"
              isPass={true}
              setStatValue={setPassword}
            />
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            style={[styles.signupButton, isSubmitting && styles.buttonDisabled]}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#6C22E5', '#9747FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Creating Account...' : 'Join the Evolution'}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate("LoginScreen")}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>Already part of the evolution?</Text>
              <Text style={styles.loginHighlight}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <VerificationModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  glowPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    transform: [{ rotate: '45deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  brandText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#2f3136',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#202225',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e9297',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#40444b',
    padding: 12,
    height: 50,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
    height: '100%',
    padding: 0,
  },
  inputError: {
    borderColor: '#f04747',
    borderWidth: 1,
  },
  errorText: {
    color: '#f04747',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  atSymbol: {
    color: '#999',
    fontSize: 16,
    marginRight: 4,
  },
  signupButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#40444b',
  },
  dividerText: {
    color: '#8e9297',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: '#8e9297',
    fontSize: 15,
  },
  loginHighlight: {
    color: '#7289da',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#36393f',
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  modalText: {
    color: '#8e9297',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  emailText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#5865F2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginTop: 24,
    width: '100%',
  },
  modalButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSubText: {
    color: '#72767d',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic'
  }
});

export default SignUpScreen;
