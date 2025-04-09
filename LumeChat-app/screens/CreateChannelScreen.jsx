import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  StyleSheet, Animated, Dimensions, ScrollView, Alert 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { channelService } from '../services/channel.service';

const CreateChannelScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const [channelName, setChannelName] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'INFORMATION',
    'GENERAL',
    'STUDY_GROUPS',
    'PROJECTS',
    'VOICE_CHANNELS'
  ];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    console.log('Current user in CreateChannel:', user);
    if (!user?._id) {
      Alert.alert(
        'Error',
        'Please log in again',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('LoginScreen')
          }
        ]
      );
    }
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['image'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleCreateChannel = async () => {
    try {
        if (!channelName.trim()) {
            Alert.alert('Error', 'Channel name is required');
            return;
        }

        setIsLoading(true);
        const channelData = {
            name: channelName.trim(),
            description: description.trim(),
            isPublic: isPublic,
            category: category,
            members: selectedUsers || []
        };

        console.log('Sending channel data:', channelData);
        const createdChannel = await channelService.createChannel(user._id, channelData);

        navigation.navigate('HomeScreen', { 
            refresh: true,
            newChannel: createdChannel
        });
    } catch (error) {
        console.error('Create channel error:', error);
        Alert.alert('Error', error.message || 'Failed to create channel');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#7289da', '#5865F2']}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Create Your Channel</Text>
        <Text style={styles.subtitle}>Build a space for your community</Text>
      </LinearGradient>

      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="tag" size={24} color="#8e9297" />
          <TextInput
            style={[styles.input, errors.channelName && styles.inputError]}
            placeholder="Channel Name *"
            placeholderTextColor="#8e9297"
            value={channelName}
            onChangeText={(text) => {
              setChannelName(text);
              setErrors({ ...errors, channelName: null });
            }}
          />
        </View>
        {errors.channelName && (
          <Text style={styles.errorText}>{errors.channelName}</Text>
        )}

        <View style={styles.pickerWrapper}>
          <Text style={styles.labelText}>Category <Text style={styles.requiredStar}>*</Text></Text>
          <View style={[styles.pickerContainer, errors.category && styles.pickerError]}>
            <MaterialIcons name="category" size={24} color="#8e9297" />
            <Picker
              selectedValue={category}
              onValueChange={(value) => {
                setCategory(value);
                setErrors({ ...errors, category: null });
              }}
              style={styles.picker}
              dropdownIconColor="#ffffff"
            >
              <Picker.Item label="Select a category" value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="description" size={24} color="#8e9297" />
          <TextInput
            style={styles.input}
            placeholder="Channel Description (Optional)"
            placeholderTextColor="#8e9297"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.sectionTitle}>
          <MaterialIcons name="visibility" size={24} color="#8e9297" />
          <Text style={styles.sectionText}>Channel Privacy</Text>
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, isPublic && styles.selectedType]}
            onPress={() => setIsPublic(true)}
          >
            <MaterialIcons name="public" size={24} color="#ffffff" />
            <View style={styles.typeTextContainer}>
              <Text style={styles.typeText}>Public</Text>
              <Text style={styles.typeDescription}>Anyone can view and join</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, !isPublic && styles.selectedType]}
            onPress={() => setIsPublic(false)}
          >
            <MaterialIcons name="lock" size={24} color="#ffffff" />
            <View style={styles.typeTextContainer}>
              <Text style={styles.typeText}>Private</Text>
              <Text style={styles.typeDescription}>Invite only</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.imageUploadSection}>
          <View style={styles.sectionTitle}>
            <MaterialIcons name="image" size={24} color="#8e9297" />
            <Text style={styles.sectionText}>Channel Cover (Optional)</Text>
          </View>
          
          {coverImage ? (
            <View style={styles.coverImageContainer}>
              <Image source={{ uri: coverImage }} style={styles.coverImage} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setCoverImage(null)}
              >
                <Ionicons name="close-circle" size={32} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={24} color="#ffffff" />
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <MaterialIcons name="photo-library" size={24} color="#ffffff" />
                <Text style={styles.buttonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.createButton,
            isSubmitting && styles.createButtonDisabled
          ]}
          onPress={handleCreateChannel}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#7289da', '#5865F2']}
            style={styles.gradientButton}
          >
            <Text style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393f',
  },
  headerGradient: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 8,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
    minHeight: 80, // For multiline description
  },
  pickerWrapper: {
    marginBottom: 20,
  },
  labelText: {
    color: '#8e9297',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  picker: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 12,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  typeSelector: {
    marginBottom: 24,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedType: {
    backgroundColor: '#7289da',
  },
  typeTextContainer: {
    marginLeft: 12,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeDescription: {
    color: '#8e9297',
    fontSize: 14,
  },
  imageUploadSection: {
    marginBottom: 24,
  },
  coverImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202225',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
  },
  createButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#f04747',
    borderWidth: 1,
  },
  pickerError: {
    borderColor: '#f04747',
    borderWidth: 1,
  },
  errorText: {
    color: '#f04747',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  requiredStar: {
    color: '#f04747',
    fontSize: 14,
  },
});

export default CreateChannelScreen;
