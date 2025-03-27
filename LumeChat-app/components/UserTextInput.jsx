import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";

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
    <View style={[styles.inputContainer, customStyle]}>
      <MaterialIcons name={icon} size={24} color={"#72767D"} />
      <TextInput
        style={styles.input}
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

const styles = StyleSheet.create({
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
  }
});

export default UserTextInput;
