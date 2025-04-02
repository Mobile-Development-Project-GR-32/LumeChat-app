import React, { forwardRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SearchBar = forwardRef(({ value, onChangeText, placeholder = 'Search...' }, ref) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name="search" size={20} color="#7289da" style={styles.icon} />
      <TextInput
        ref={ref}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8e9297"
        autoFocus={true}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity 
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <MaterialIcons name="close" size={20} color="#7289da" />
        </TouchableOpacity>
      )}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(114, 137, 218, 0.2)',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
    borderRadius: 12,
  }
});

export default SearchBar;
