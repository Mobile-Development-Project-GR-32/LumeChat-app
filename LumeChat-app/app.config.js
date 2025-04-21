import 'dotenv/config';

export default {
  expo: {
    name: "LumeChat-app",
    slug: "MessagingApp",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "lumechat",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.lumechat.app",
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true
          },
          ios: {
            newArchEnabled: true
          }
        }
      ],
      "@stream-io/video-react-native-sdk",
      [
        "@config-plugins/react-native-webrtc",
        {
          "cameraPermission": "$(PRODUCT_NAME) requires camera access in order to capture and transmit video",
          "microphonePermission": "$(PRODUCT_NAME) requires microphone access in order to capture and transmit audio"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      firebaseConfig: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
      },
      apiUrl: process.env.API_URL,
      eas: {
        projectId: "3c56aa1c-3990-4eed-b243-aa2a49b147fa"
      }
    }
  }
};
