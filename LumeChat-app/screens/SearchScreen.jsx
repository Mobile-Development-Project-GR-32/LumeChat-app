import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { default as SearchBar } from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import { searchService } from '../services/search.service';

const SearchScreen = ({ isVisible, onClose, userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const slideAnim = new Animated.Value(isVisible ? 0 : 100);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchInputRef = React.useRef(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({});
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchService.globalSearch(userId, query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              marginBottom: keyboardHeight
            }
          ]}
        >
          <LinearGradient
            colors={['#2f3136', '#202225']}
            style={styles.searchHeader}
          >
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialIcons name="arrow-back" size={24} color="#7289da" />
            </TouchableOpacity>
            <SearchBar
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              placeholder="Search channels and users..."
            />
          </LinearGradient>
          <SearchResults 
            results={searchResults}
            isLoading={isSearching}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    marginTop: 40,
    backgroundColor: '#36393f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 3,
  },
  closeButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(114, 137, 218, 0.1)',
    borderRadius: 20,
  }
});

export default SearchScreen;
