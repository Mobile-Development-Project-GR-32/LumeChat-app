import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { notificationService } from '../services/notification.service';

const BottomNavBar = ({ activeTab, onTabPress }) => {
  const user = useSelector((state) => state.user);
  const navigation = useNavigation();
  const route = useRoute();
  const [notificationCount, setNotificationCount] = useState(0);
  const [localActiveTab, setLocalActiveTab] = useState(activeTab || 'home');

  // Update local state when prop changes
  useEffect(() => {
    if (activeTab) {
      setLocalActiveTab(activeTab);
    }
  }, [activeTab]);

  // Reset to home tab when on HomeScreen
  useEffect(() => {
    if (route.name === 'HomeScreen') {
      setLocalActiveTab('home');
      if (onTabPress && localActiveTab !== 'home') {
        onTabPress('home');
      }
    }
  }, [route.name]);

  // Get notification count when component mounts
  useEffect(() => {
    if (user?._id) {
      // Initialize with local count
      setNotificationCount(notificationService.getBadgeCount());

      // Set up polling for notification count
      const intervalId = setInterval(() => {
        // Get current notification count
        setNotificationCount(notificationService.getBadgeCount());
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [user?._id]);

  const handleTabPress = (id) => {
    // Update local state
    setLocalActiveTab(id);
    
    // First, update the active tab state through the parent callback
    if (onTabPress) {
      onTabPress(id);
    }
    
    // Then handle navigation based on tab ID
    switch (id) {
      case 'home':
        navigation.navigate('HomeScreen');
        break;
      case 'notifications':
        // Navigate directly to Notifications_Screen
        navigation.navigate('Notifications_Screen');
        // Reset notification count
        notificationService.resetBadgeCount();
        setNotificationCount(0);
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      default:
        console.log(`Tab ${id} pressed`);
    }
  };

  const tabs = [
    { 
      id: 'home', 
      icon: 'home',
      label: 'Home'
    },
    { 
      id: 'notifications', 
      icon: 'notifications',
      label: 'Notifications',
      badge: notificationCount
    },
    { 
      id: 'settings',
      icon: 'settings',
      label: 'Settings'
    }
  ];

  const renderTabContent = (tab) => {
    return (
      <View style={styles.tabContent}>
        <MaterialIcons
          name={tab.icon}
          size={22}
          color={localActiveTab === tab.id ? "#FFFFFF" : "#8e9297"}
        />
        <Text style={[
          styles.tabLabel,
          localActiveTab === tab.id && styles.activeTabLabel
        ]}>
          {tab.label}
        </Text>
        
        {tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleChatbotPress = () => {
    navigation.navigate('Chatbot');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2F3136', '#202225']}
        style={styles.navContainer}
      >
        <View style={styles.innerContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                localActiveTab === tab.id && styles.activeTab
              ]}
              onPress={() => handleTabPress(tab.id)}
            >
              {renderTabContent(tab)}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
      
      {/* AI Button */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={handleChatbotPress}
      >
        <LinearGradient
          colors={['#8a2be2', '#6c22e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiButtonGradient}
        >
          <View style={styles.aiButtonInner}>
            <MaterialIcons name="smart-toy" size={24} color="#FFFFFF" />
          </View>
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
    paddingTop: 8,
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    position: 'relative',
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
    top: -60,
    elevation: 10,
    shadowColor: '#6C22E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderRadius: 28,
  },
  aiButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  aiButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: '#8e9297',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default BottomNavBar;
