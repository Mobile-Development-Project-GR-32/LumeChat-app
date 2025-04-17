import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, TouchableOpacity, Text, Alert, 
  ActivityIndicator, StatusBar 
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const QRScannerScreen = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  
  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      try {
        // Properly import and use the permission API from expo-barcode-scanner
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error("Error requesting barcode scanner permission:", error);
        setHasPermission(false);
        Alert.alert("Permission Error", "Unable to request camera permission.");
      }
    };
    
    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log("QR Scanned data:", data);
    
    try {
      // Try parsing as JSON first
      let userId = null;
      
      try {
        const jsonData = JSON.parse(data);
        userId = jsonData.userId;
        console.log("Parsed userId from JSON:", userId);
      } catch (jsonError) {
        console.log("Not valid JSON, trying other formats");
        
        // Not JSON, check if it's just a user ID string
        if (/^[a-zA-Z0-9]{24}$/.test(data)) {
          userId = data;
          console.log("Using data as userId:", userId);
        } else if (data.includes('userId=')) {
          // Try extracting from URL-like format
          const match = data.match(/userId=([a-zA-Z0-9]{24})/);
          if (match && match[1]) {
            userId = match[1];
            console.log("Extracted userId from URL format:", userId);
          }
        }
      }

      if (userId) {
        // Navigate to UserProfile after a short delay
        setTimeout(() => {
          navigation.navigate('UserProfile', { userId });
        }, 300);
      } else {
        Alert.alert(
          "Invalid QR Code", 
          "No user information found in this QR code.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        "Scan Error", 
        "Could not process the QR code data.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Loading state while requesting permission
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7289DA" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="no-photography" size={60} color="#F04747" />
        <Text style={styles.errorText}>Camera permission was denied</Text>
        <Text style={styles.text}>Please enable camera access in your device settings</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleClose}>
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Close</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // Main scanner UI
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <BarCodeScanner
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scannerHeader}>
            <Text style={styles.headerText}>Scan Friend QR Code</Text>
          </View>
          
          <View style={styles.scannerFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          
          <Text style={styles.instructionText}>
            Position QR code within the frame
          </Text>
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </BarCodeScanner>
      
      {scanned && (
        <TouchableOpacity 
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <LinearGradient
            colors={['#7289DA', '#5865F2']}
            style={styles.scanAgainGradient}
          >
            <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#7289DA',
    top: 0,
    left: 0,
  },
  cornerTR: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#7289DA',
    top: 0,
    right: 0,
  },
  cornerBL: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#7289DA',
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#7289DA',
    bottom: 0,
    right: 0,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
  },
  text: {
    color: '#B9BBBE',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#F04747',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    bottom: 60,
    backgroundColor: '#36393F',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanAgainGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default QRScannerScreen;
