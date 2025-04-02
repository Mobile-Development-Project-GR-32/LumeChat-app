import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { channelService } from '../services/channel.service';
import { useSelector } from 'react-redux';

const ChannelActions = ({ channel, onUpdate }) => {
  const user = useSelector((state) => state.user);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Channel',
      'Are you sure you want to delete this channel?',
      [
        { text: 'Cancel' },
        { 
          text: 'Delete',
          onPress: async () => {
            try {
              await channelService.deleteChannel(user._id, channel.id);
              onUpdate?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete channel');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialIcons name="edit" size={24} color="#8e9297" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleDelete}
      >
        <MaterialIcons name="delete" size={24} color="#f04747" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  }
});

export default ChannelActions;
