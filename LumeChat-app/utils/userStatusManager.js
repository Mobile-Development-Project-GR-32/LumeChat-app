import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache of user statuses
const userStatusCache = {};
let listeners = new Set();
const ONLINE_USERS_STORAGE_KEY = 'onlineUsers';
const STATUS_CHECK_INTERVAL = 60000; // 1 minute

// Mock online probability for demo purposes
const MOCK_ONLINE_PROBABILITY = 0.6;
let statusCheckInterval = null;
let appStateSubscription = null;

export const userStatusManager = {
  initialize: async (currentUserId) => {
    try {
      // Load cached statuses from storage
      const storedStatuses = await AsyncStorage.getItem(ONLINE_USERS_STORAGE_KEY);
      if (storedStatuses) {
        Object.assign(userStatusCache, JSON.parse(storedStatuses));
      }
      
      // Set current user as online
      userStatusCache[currentUserId] = {
        status: 'online',
        lastSeen: Date.now()
      };
      
      // Start periodic status updates
      clearInterval(statusCheckInterval);
      statusCheckInterval = setInterval(() => {
        userStatusManager.refreshStatuses(currentUserId);
      }, STATUS_CHECK_INTERVAL);
      
      // Handle app state changes using the new API
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          userStatusCache[currentUserId] = {
            status: 'online',
            lastSeen: Date.now()
          };
        } else if (nextAppState === 'background') {
          userStatusCache[currentUserId] = {
            status: 'away',
            lastSeen: Date.now()
          };
        }
        userStatusManager.notifyListeners();
        userStatusManager.persistStatuses();
      });
      
      // Return all necessary functions that can be used by the caller
      return {
        setStatus: (status) => userStatusManager.setUserStatus(currentUserId, status),
        cleanup: () => {
          // Clear the interval and remove the app state listener
          clearInterval(statusCheckInterval);
          subscription?.remove();
          // Note: we don't clear listeners here as other components might still need them
        }
      };
    } catch (error) {
      console.error('Error initializing status manager:', error);
      // Return empty functions to prevent errors when methods are called
      return {
        setStatus: () => {},
        cleanup: () => {}
      };
    }
  },
  
  setUserStatus: (userId, status) => {
    userStatusCache[userId] = {
      status,
      lastSeen: Date.now()
    };
    userStatusManager.notifyListeners();
    userStatusManager.persistStatuses();
  },
  
  getUserStatus: (userId) => {
    return userStatusCache[userId]?.status || 'offline';
  },
  
  isOnline: (userId) => {
    return userStatusCache[userId]?.status === 'online';
  },
  
  // Simulate fetching friends statuses from server
  refreshStatuses: (currentUserId) => {
    const now = Date.now();
    
    // Expire statuses older than 5 minutes
    Object.keys(userStatusCache).forEach(userId => {
      if (userId !== currentUserId && 
          userStatusCache[userId]?.lastSeen && 
          now - userStatusCache[userId].lastSeen > 300000) {
        userStatusCache[userId] = {
          status: 'offline',
          lastSeen: now
        };
      }
    });
    
    // For demo purposes, set some friends as online
    if (global.friendsList && Array.isArray(global.friendsList)) {
      global.friendsList.forEach(friend => {
        // Don't change current user's status
        if (friend._id === currentUserId) return;
        
        // If this friend doesn't have a status yet, assign one
        if (!userStatusCache[friend._id]) {
          const isOnline = Math.random() > 0.5; // 50% chance to be online
          userStatusCache[friend._id] = {
            status: isOnline ? 'online' : 'offline',
            lastSeen: now
          };
        }
        
        // Occasionally change some friend's status
        else if (Math.random() > 0.8) {
          const isOnline = Math.random() > MOCK_ONLINE_PROBABILITY;
          userStatusCache[friend._id] = {
            status: isOnline ? 'online' : 'offline',
            lastSeen: now
          };
        }
      });
    }
    
    userStatusManager.notifyListeners();
    userStatusManager.persistStatuses();
  },
  
  // Save statuses to AsyncStorage
  persistStatuses: async () => {
    try {
      await AsyncStorage.setItem(
        ONLINE_USERS_STORAGE_KEY, 
        JSON.stringify(userStatusCache)
      );
    } catch (error) {
      console.error('Error saving user statuses:', error);
    }
  },
  
  // Subscribe to status changes
  subscribe: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  
  // Notify all listeners
  notifyListeners: () => {
    listeners.forEach(listener => {
      try {
        listener(userStatusCache);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  },
  
  cleanup: () => {
    listeners.clear();
    clearInterval(statusCheckInterval);
    
    // Use the new API to remove the event listener
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
  }
};

export default userStatusManager;
