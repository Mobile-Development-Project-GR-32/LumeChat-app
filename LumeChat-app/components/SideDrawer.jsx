import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SideDrawer = ({ isOpen, drawerWidth, contacts = [] }) => {
  const slideAnim = React.useRef(new Animated.Value(-drawerWidth)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -drawerWidth,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [isOpen, drawerWidth]);

  const ContactItem = ({ contact }) => (
    <TouchableOpacity style={styles.contactItem}>
      <View style={[styles.avatar, { backgroundColor: contact.color || '#7289da' }]}>
        <Text style={styles.avatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
        <View style={[styles.statusIndicator, 
          { backgroundColor: contact.isOnline ? '#43b581' : '#747f8d' }]} 
        />
      </View>
      <Text style={styles.contactName}>{contact.name}</Text>
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
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#8e9297" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contactsList}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ONLINE — {contacts.filter(c => c.isOnline).length}</Text>
          {contacts
            .filter(contact => contact.isOnline)
            .map((contact, index) => (
              <ContactItem key={`online-${index}`} contact={contact} />
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OFFLINE — {contacts.filter(c => !c.isOnline).length}</Text>
          {contacts
            .filter(contact => !contact.isOnline)
            .map((contact, index) => (
              <ContactItem key={`offline-${index}`} contact={contact} />
            ))}
        </View>
      </ScrollView>
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
});

export default SideDrawer;
