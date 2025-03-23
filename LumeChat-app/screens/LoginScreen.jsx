import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { UserTextInput } from "../components";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firestoreDB } from "../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { SET_USER } from "../context/actions/userActions";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [getEmailValidationStatus, setGetEmailValidationStatus] =
    useState(false);

  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      setAlert(true);
      setAlertMessage("Please fill all fields");
      return;
    }

    if (!getEmailValidationStatus) {
      setAlert(true);
      setAlertMessage("Please enter a valid email");
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      
      if (userCred?.user) {
        const docSnap = await getDoc(doc(firestoreDB, "users", userCred.user.uid));
        if (docSnap.exists()) {
          dispatch(SET_USER(docSnap.data()));
          navigation.replace("HomeScreen");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setAlert(true);
      if (err.code === "auth/invalid-credential") {
        setAlertMessage("Invalid email or password");
      } else {
        setAlertMessage("Login failed. Please try again.");
      }
    }

    setTimeout(() => setAlert(false), 3000);
  };

  return (
    <View className="flex-1 bg-discord-bg p-6">
      <View className="flex-1 items-center justify-center">
        <View className="w-full bg-discord-card p-8 rounded-md">
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Welcome back!
          </Text>
          <Text className="text-discord-text text-center mb-6">
            We're so excited to see you again!
          </Text>

          <Text className="text-discord-text text-xs font-bold mb-2">
            EMAIL OR PHONE NUMBER
          </Text>
          <UserTextInput
            placeholder="Enter your email"
            isPass={false}
            setStatValue={setEmail}
            setGetEmailValidationStatus={setGetEmailValidationStatus}
          />

          <Text className="text-discord-text text-xs font-bold mt-4 mb-2">
            PASSWORD
          </Text>
          <UserTextInput
            placeholder="Enter your password"
            isPass={true}
            setStatValue={setPassword}
          />

          <TouchableOpacity className="mt-1">
            <Text className="text-discord-link text-sm">
              Forgot your password?
            </Text>
          </TouchableOpacity>

          {alert && (
            <Text className="text-red-500 text-sm text-center mt-4">{alertMessage}</Text>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            className="w-full bg-primary py-3 rounded-sm mt-6"
          >
            <Text className="text-white text-center font-semibold">
              Log In
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row">
            <Text className="text-discord-text text-sm">
              Need an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUpScreen")}>
              <Text className="text-discord-link text-sm">
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;