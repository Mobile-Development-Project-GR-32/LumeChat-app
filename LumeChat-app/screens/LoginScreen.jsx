import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert 
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth.service';

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn(email, password);
      navigation.replace("HomeScreen");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#202225', '#2f3136', '#36393f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.glassPattern} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.brandText}>LumeChat</Text>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitleText}>We're so excited to see you again</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>EMAIL</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#7289da" />
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
            <Text style={styles.labelText}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#7289da" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#8e9297"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => {/* Handle forgot password */}}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={styles.loginButton}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#6C22E5', '#9747FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Logging in...' : 'Login'}
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
              onPress={() => navigation.navigate("SignUpScreen")}
              style={styles.signupLink}
            >
              <Text style={styles.signupText}>Need an account?</Text>
              <Text style={styles.signupHighlight}>Register</Text>
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
  glassPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(60px)',
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
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
    height: '100%',
    padding: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#7289da',
    fontSize: 13,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
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
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#8e9297',
    fontSize: 15,
  },
  signupHighlight: {
    color: '#7289da',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  }
});

export default LoginScreen;