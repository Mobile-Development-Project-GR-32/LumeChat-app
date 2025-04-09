import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ContactActions = ({ onAccept, onReject, onRemove, isPending }) => {
  if (isPending) {
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          onPress={onAccept}
          style={[styles.actionButton, styles.acceptButton]}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onReject}
          style={[styles.actionButton, styles.rejectButton]}
        >
          <MaterialIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onRemove}
      style={styles.removeButton}
    >
      <MaterialIcons name="person-remove" size={20} color="#f04747" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 16,
  },
  acceptButton: {
    backgroundColor: '#43b581',
  },
  rejectButton: {
    backgroundColor: '#f04747',
  },
  removeButton: {
    padding: 8,
  }
});

export default ContactActions;
