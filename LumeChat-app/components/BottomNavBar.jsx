import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const BottomNavBar = ({ activeTab, onTabPress }) => {
  const user = useSelector((state) => state.user);
  const navigation = useNavigation();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleChatbotPress = () => {
    navigation.navigate('Chatbot'); // Navigate directly to ChatbotScreen
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
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(47, 49, 54, 0.98)', 'rgba(32, 34, 37, 0.99)']}
        style={styles.navContainer}
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
      
      {/* WhatsApp-style Meta AI Button */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={handleChatbotPress}
      >
        <LinearGradient
          colors={['#5865F2', '#7289DA']}
          style={styles.aiButtonGradient}
        >
          <MaterialIcons name="smart-toy" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  navContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(47, 49, 54, 0.3)',
    paddingBottom: 8,
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 4,
  },
  tabContent: {
    padding: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#f04747',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  aiButton: {
    position: 'absolute',
    right: 20,
    top: -28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderRadius: 28,
  },
  aiButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomNavBar;
