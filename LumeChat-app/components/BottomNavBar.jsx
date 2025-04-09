import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native'; // Add this

const BottomNavBar = ({ activeTab, onTabPress }) => {
  const user = useSelector((state) => state.user);
  const navigation = useNavigation(); // Add this

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings'); // Simplified navigation call
  };

  const handleTabPress = (id) => {
    if (id === 'settings') {
        handleSettingsPress();
    } else {
        onTabPress(id);
    }
  };

  const tabs = [
    { 
      id: 'home', 
      icon: 'home',
      label: 'Home',
      gradient: ['#7289DA', '#5865F2']
    },
    { 
      id: 'notifications', 
      icon: 'notifications',
      label: 'Notifications',
      gradient: ['#5865F2', '#4752C4'],
      badge: 3 // Example badge count
    },
    { 
      id: 'settings',
      icon: 'settings',
      label: 'Settings',
      gradient: ['#4752C4', '#3C45A5']
    }
  ];

  const renderTabContent = (tab) => {
    return (
      <>
        <MaterialIcons
          name={tab.icon}
          size={24}
          color="#FFFFFF"
        />
        {tab.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <LinearGradient
      colors={['rgba(47, 49, 54, 0.98)', 'rgba(32, 34, 37, 0.99)']}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTab
            ]}
          >
            <View style={styles.tabContent}>
              {renderTabContent(tab)}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(47, 49, 54, 0.3)',
    paddingBottom: 8, // Reduced from 20
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4, // Reduced from 8
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 4, // Reduced from 8
  },
  tabContent: {
    padding: 8, // Reduced from 10
    borderRadius: 8, // Reduced from 12
  },
  activeTab: {
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 12,
    color: '#8e9297',
    marginTop: 4,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#7289da',
  },
  profilePic: {
    width: 28, // Reduced from 32
    height: 28, // Reduced from 32
    borderRadius: 14,
  },
  avatarContainer: {
    width: 28, // Reduced from 32
    height: 28, // Reduced from 32
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -3, // Adjusted from -5
    right: -3, // Adjusted from -5
    backgroundColor: '#f04747',
    borderRadius: 8,
    minWidth: 16, // Reduced from 20
    height: 16, // Reduced from 20
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10, // Reduced from 12
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default BottomNavBar;
