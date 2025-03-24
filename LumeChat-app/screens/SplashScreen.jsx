import { View, Text, Image, ActivityIndicator, Animated } from "react-native";
import React, { useLayoutEffect, useEffect, useRef } from "react";
import { firebaseAuth, firestoreDB } from "../config/firebase.config";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { SET_USER } from "../context/actions/userActions";
import { useDispatch } from "react-redux";

const SplashScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useLayoutEffect(() => {
    checkLoggedUser();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkLoggedUser = async () => {
    firebaseAuth.onAuthStateChanged((userCred) => {
      if (userCred?.uid) {
        getDoc(doc(firestoreDB, "users", userCred?.uid))
          .then((docSnap) => {
            if (docSnap.exists()) {
              console.log("User Data : ", docSnap.data());
              dispatch(SET_USER(docSnap.data()));
            }
          })
          .then(() => {
            setTimeout(() => {
              navigation.replace("HomeScreen");
            }, 2000);
          });
      } else {
        navigation.replace("LoginScreen");
      }
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#313338]">
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        <Image  
          className="w-32 h-32 mb-8" 
          resizeMode="contain" 
        />
        <ActivityIndicator 
          size="large" 
          color="#5865F2"
          style={{ transform: [{ scale: 1.5 }] }}
        />
      </Animated.View>
    </View>
  );
};

export default SplashScreen;
