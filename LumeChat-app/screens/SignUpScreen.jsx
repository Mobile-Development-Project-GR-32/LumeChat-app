import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, firestoreDB } from "../config/firebase.config";
import { doc, setDoc } from "firebase/firestore";
import { UserTextInput } from "../components";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);

  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (getEmailValidationStatus && email !== "" && username !== "") {
      await createUserWithEmailAndPassword(firebaseAuth, email, password).then(
        (userCred) => {
          const data = {
            _id: userCred?.user.uid,
            fullName: username,
            providerData: userCred.user.providerData[0],
          };

          setDoc(doc(firestoreDB, "users", userCred?.user.uid), data).then(
            () => {
              navigation.navigate("LoginScreen");
            }
          );
        }
      );
    }
  };

  return (
    <View className="flex-1 bg-discord-bg p-6">
      <View className="flex-1 items-center justify-center">
        {/* Card Container */}
        <View className="w-full bg-discord-card p-8 rounded-md">
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Create an account
          </Text>

          <Text className="text-discord-text text-xs font-bold mt-6 mb-2">
            EMAIL
          </Text>
          <UserTextInput
            placeholder="Enter your email"
            isPass={false}
            setStatValue={setEmail}
            setGetEmailValidationStatus={setGetEmailValidationStatus}
          />

          <Text className="text-discord-text text-xs font-bold mt-4 mb-2">
            USERNAME
          </Text>
          <UserTextInput
            placeholder="What should everyone call you?"
            isPass={false}
            setStatValue={setUsername}
          />

          <Text className="text-discord-text text-xs font-bold mt-4 mb-2">
            PASSWORD
          </Text>
          <UserTextInput
            placeholder="Enter a password"
            isPass={true}
            setStatValue={setPassword}
          />

          <TouchableOpacity
            onPress={handleSignUp}
            className="w-full bg-primary py-3 rounded-sm mt-6"
          >
            <Text className="text-white text-center font-semibold">
              Continue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-4"
          >
            <Text className="text-discord-link text-sm">
              Already have an account?
            </Text>
          </TouchableOpacity>

          <Text className="text-discord-text text-xs mt-6">
            By registering, you agree to Discord's Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SignUpScreen;
