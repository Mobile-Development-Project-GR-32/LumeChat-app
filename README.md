# LumeChat

LumeChat is a feature-rich real-time messaging application built with React Native and Expo. It's designed to provide seamless communication through both direct messages and channel-based conversations.

## 📱 Features

### Authentication
- User registration and login
- Profile creation and customization
- Password recovery

### Messaging
- Real-time direct messaging between users
- Channel-based group conversations
- Message status indicators (sent, delivered, read)
- Message formatting and emoji support

### Channels
- Public and private channels
- Channel creation and management
- User roles and permissions (admin, moderator, member)
- Channel invitations via QR codes and links

### Social Features
- Friend requests and contacts management
- User status updates (online, away, offline)
- User profiles with customizable statuses
- QR code sharing for adding friends

### Notifications
- Push notifications for new messages
- Friend request notifications
- Channel invitation alerts
- Notification preferences

### AI Integration
- AI chatbot assistant
- Smart responses suggestions
- Content moderation

### UI/UX
- Modern Discord-inspired UI
- Dark theme
- Responsive design that works on multiple device sizes
- Smooth animations and transitions

## 🛠️ Technical Overview

### Core Technologies
- **Frontend Framework**: React Native with Expo
- **State Management**: Redux
- **UI Components**: React Native Paper, custom components
- **Navigation**: React Navigation
- **Styling**: StyleSheet API, Linear Gradients
- **Backend URL**: https://lumechatapp.up.railway.app

### Key Features Implementation
- **Real-time Messaging**: HTTP polling with Firebase Realtime database integration
- **Authentication**: Firebase Authentication
- **Media Handling**: Camera and image picker integration
- **QR Code**: Scanning and generation capabilities
- **Data Persistence**: AsyncStorage for local storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for native builds)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mobile-Development-Project-GR-32/LumeChat-app.git
cd LumeChat-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Backend API
API_URL=https://lumechatapp.up.railway.app/api

# Stream API (for video calls)
STREAM_API_KEY=your_stream_api_key
CLIENT_API_SECRET=your_stream_api_secret
```

4. Start the development server:
```bash
npx expo start
```

5. Run on a device or emulator:
   - Press `a` to run on Android emulator
   - Press `i` to run on iOS simulator
   - Scan the QR code with the Expo Go app on your physical device

## 🔒 Authentication

LumeChat uses Firebase authentication. The app maintains session persistence through AsyncStorage, allowing users to stay logged in between app restarts.

## 📱 Screen Descriptions

- **LoginScreen**: User authentication
- **SignUpScreen**: New user registration
- **HomeScreen**: Main navigation hub showing channels and conversations
- **ChannelChatScreen**: Group messaging inside channels
- **DirectMessagesScreen**: One-on-one private messaging
- **SettingsScreen**: User preferences and app configuration
- **ProfileScreen**: User profile management
- **Notifications_Screen**: Notification center
- **ChannelProfileScreen**: Channel details and management
- **ChatbotScreen**: AI assistant interface

## 📡 API Integration

The app communicates with a backend server for all data operations. Services are organized by domain (auth, messages, channels, etc.) and handle API requests, error management, and data formatting.

## 🧩 State Management

LumeChat uses Redux for global state management, particularly for:
- User authentication state
- Active conversations
- Notification counts
- App preferences

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Redux](https://redux.js.org/)