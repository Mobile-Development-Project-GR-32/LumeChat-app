import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userService } from '../services/user.service';
import { useSelector } from 'react-redux';

const SideDrawer = ({ isOpen, drawerWidth }) => {
  const user = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-drawerWidth)).current;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [contactsData, pendingData] = await Promise.all([
        userService.getContacts(user._id),
        userService.getPendingContacts(user._id)
      ]);
      setContacts(contactsData);
      setPendingRequests(pendingData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -drawerWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen, drawerWidth]);

  const handleAcceptRequest = async (requesterId) => {
    try {
      await userService.acceptContactRequest(user._id, requesterId);
      Alert.alert('Success', 'Contact request accepted');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectRequest = async (requesterId) => {
    try {
      await userService.rejectContactRequest(user._id, requesterId);
      Alert.alert('Success', 'Contact request rejected');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemoveContact = async (contactId) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.removeContact(user._id, contactId);
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleAddContact = async () => {
    const username = await new Promise((resolve) => {
      Alert.prompt(
        'Add Contact',
        'Enter username:',
        [
          { text: 'Cancel', onPress: () => resolve(null) },
          { text: 'Send Request', onPress: (text) => resolve(text) }
        ]
      );
    });

    if (username) {
      try {
        await userService.sendContactRequest(user._id, username);
        Alert.alert('Success', 'Contact request sent!');
        fetchData();
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const renderContact = (contact, isPending = false) => (
    <TouchableOpacity 
      key={contact._id}
      style={[styles.contactItem, contact.isActive && styles.activeContact]}
    >
      <View style={[styles.avatar, { backgroundColor: contact.color || '#7289da' }]}>
        <Text style={styles.avatarText}>
          {contact.username?.[0]?.toUpperCase() || '?'}
        </Text>
        <View style={[styles.statusIndicator, 
          { backgroundColor: contact.isOnline ? '#43b581' : '#747f8d' }]} 
        />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.username}</Text>
        {isPending && <Text style={styles.pendingText}>Pending</Text>}
      </View>
      {isPending ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={() => handleAcceptRequest(contact._id)}
            style={[styles.actionButton, styles.acceptButton]}
          >
            <MaterialIcons name="check" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleRejectRequest(contact._id)}
            style={[styles.actionButton, styles.rejectButton]}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={() => handleRemoveContact(contact._id)}
          style={styles.removeButton}
        >
          <MaterialIcons name="person-remove" size={20} color="#f04747" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          width: drawerWidth,
          transform: [{ translateX: slideAnim }],
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Direct Messages</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <MaterialIcons name="add" size={24} color="#8e9297" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#7289da" style={styles.loader} />
      ) : (
        <ScrollView style={styles.contactsList}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ONLINE — {contacts.filter(c => c.isOnline).length}</Text>
            {contacts
              .filter(contact => contact.isOnline)
              .map(contact => renderContact(contact))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OFFLINE — {contacts.filter(c => !c.isOnline).length}</Text>
            {contacts
              .filter(contact => !contact.isOnline)
              .map(contact => renderContact(contact))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PENDING REQUESTS — {pendingRequests.length}</Text>
            {pendingRequests.map(contact => renderContact(contact, true))}
          </View>
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#2f3136',
    borderRightWidth: 1,
    borderRightColor: '#202225',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202225',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  contactsList: {
    flex: 1,
  },
  section: {
    paddingTop: 16,
  },
  sectionTitle: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2f3136',
  },
  contactName: {
    color: '#dcddde',
    fontSize: 16,
  },
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
  },
  pendingText: {
    color: '#faa61a',
    fontSize: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  loader: {
    marginTop: 20,
  },
  activeContact: {
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
  },
});

export default SideDrawer;
