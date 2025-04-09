import { createStore } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null
};

const userReducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_USER':
      return action.payload;
    case 'UPDATE_USER':
      return { ...state, ...action.payload };
    case 'CLEAR_USER':
      return null;
    default:
      return state;
  }
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER':
      console.log('Setting user in Redux:', action.payload);
      AsyncStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, user: action.payload };
    case 'CLEAR_USER':
      AsyncStorage.removeItem('user');
      return { ...state, user: null };
    default:
      return state;
  }
};

export default createStore(reducer);
