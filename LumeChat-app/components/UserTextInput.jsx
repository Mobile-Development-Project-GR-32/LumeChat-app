import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { Entypo, MaterialIcons } from "@expo/vector-icons";

const UserTextInput = ({
  placeholder,
  isPass,
  setStatValue,
  setGetEmailValidationStatus,
  customStyle
}) => {
  const [value, setValue] = useState("");
  const [showPass, setShowPass] = useState(true);
  const [icon, setIcon] = useState(null);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const handleTextChanged = (text) => {
    const trimmedText = text.trim();
    setValue(trimmedText);
    setStatValue(trimmedText);

    if (placeholder.toLowerCase().includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const status = emailRegex.test(trimmedText);
      setIsEmailValid(status);
      setGetEmailValidationStatus?.(status);
    }
  };

  useEffect(() => {
    switch (placeholder) {
      case "Full Name":
        return setIcon("person");
      case "Email":
        return setIcon("email");
      case "Password":
        return setIcon("lock");
    }
  }, [placeholder]);

  return (
    <View className={`border border-gray-700 flex-row items-center w-full px-4 py-3 rounded-md bg-discord-input ${customStyle}`}>
      <MaterialIcons name={icon} size={24} color={"#72767D"} className="mr-2" />
      <TextInput
        className="flex-1 text-base text-white font-normal ml-2"
        placeholder={placeholder}
        placeholderTextColor="#72767D"
        value={value}
        onChangeText={handleTextChanged}
        secureTextEntry={isPass && showPass}
        autoCapitalize="none"
      />

      {isPass && (
        <TouchableOpacity 
          onPress={() => setShowPass(!showPass)}
        >
          <MaterialIcons
            name={`${showPass ? "visibility" : "visibility-off"}`}
            size={24}
            color="#72767D"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UserTextInput;
