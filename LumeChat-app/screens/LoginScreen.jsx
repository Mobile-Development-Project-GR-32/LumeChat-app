import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated // Added Animated import
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth.service';
import { useDispatch } from 'react-redux';
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Added state for password visibility
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Add Animated value for logo
  const [logoAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const userData = await authService.signIn(email, password);
      console.log('Login successful:', userData);
      dispatch({ type: 'SET_USER', payload: userData });
      navigation.replace("HomeScreen");
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        "Login Failed",
        error.message || "Please verify your email and password",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#202225', '#2f3136', '#36393f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
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
          <Animated.View style={styles.logoContainer}>
            <MaterialIcons name="chat" size={40} color="#7289da" />
            <Text style={styles.brandText}>LumeChat</Text>
          </Animated.View>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitleText}>The evolution awaits you</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>EMAIL</Text>
            <View style={[styles.inputContainer, styles.elevatedInput]}>
              <MaterialIcons name="email" size={24} color="#7289da" />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#8e9297"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>PASSWORD</Text>
              <TouchableOpacity onPress={() => {/* Handle forgot password */}}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, styles.elevatedInput]}>
              <MaterialIcons name="lock" size={24} color="#7289da" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#8e9297"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.visibilityButton}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={24}
                  color="#7289da"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#6C22E5', '#9747FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Login</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to LumeChat?</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate("SignUpScreen")}
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>Create an account</Text>
              <MaterialIcons name="person-add" size={20} color="#7289da" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  elevatedInput: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
    height: '100%',
    padding: 0,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotText: {
    color: '#7289da',
    fontSize: 13,
    fontWeight: '600',
  },
  visibilityButton: {
    padding: 4,
    marginLeft: 8,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  registerText: {
    color: '#7289da',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default LoginScreen;