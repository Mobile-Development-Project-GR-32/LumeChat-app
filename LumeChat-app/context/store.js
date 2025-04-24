import { createStore } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER':
      
      // Don't set user if it's a fallback profile unless we have no current user
      if (action.payload && action.payload.isFallback && state.user && !state.user.isFallback) {
        console.warn('Rejecting fallback profile since we already have a complete profile');
        return state;
      }
      
      // If it's not a fallback, update AsyncStorage
      if (action.payload && !action.payload.isFallback) {
        AsyncStorage.setItem('user', JSON.stringify(action.payload));
      }
      
      return { ...state, user: action.payload };
      
    case 'UPDATE_USER':
      
      // Don't update with fallback data
      if (action.payload && action.payload.isFallback) {
        console.warn('Rejecting fallback data for user update');
        return state;
      }
      
      const updatedUser = { ...state.user, ...action.payload };
      
      // Store in AsyncStorage if we have a valid user
      if (updatedUser._id) {
        AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return { ...state, user: updatedUser };
      
    case 'CLEAR_USER':
      AsyncStorage.removeItem('user');
      return { ...state, user: null };
      
    default:
      return state;
  }
};

export default createStore(reducer);
