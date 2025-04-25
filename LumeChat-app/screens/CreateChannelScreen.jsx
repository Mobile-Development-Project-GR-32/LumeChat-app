import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Animated, ScrollView, Alert,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { channelService } from '../services/channel.service';

const CreateChannelScreen = ({ navigation }) => {
  const user = useSelector((state) => state.user);
  const [channelName, setChannelName] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [isPublic, setIsPublic] = useState(true);
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
      duration: 800,
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

  const handleCreateChannel = async () => {
    try {
      // Validate form fields
      const newErrors = {};
      if (!channelName.trim()) {
        newErrors.channelName = 'Channel name is required';
      }
      if (!category) {
        newErrors.category = 'Please select a category';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <LinearGradient
        colors={['#7289da', '#5865F2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>Create Your Channel</Text>
        <Text style={styles.subtitle}>Build a space for your community</Text>
      </LinearGradient>

      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.labelText}>Channel Name <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.inputContainer, errors.channelName && styles.inputError]}>
              <MaterialIcons name="tag" size={22} color="#8e9297" />
              <TextInput
                style={styles.input}
                placeholder="Enter channel name"
                placeholderTextColor="#8e9297"
                value={channelName}
                onChangeText={(text) => {
                  setChannelName(text);
                  if (errors.channelName) {
                    setErrors({ ...errors, channelName: null });
                  }
                }}
                maxLength={50}
              />
            </View>
            {errors.channelName && (
              <Text style={styles.errorText}>{errors.channelName}</Text>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.labelText}>Description</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="description" size={22} color="#8e9297" />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What's this channel about?"
                placeholderTextColor="#8e9297"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
            <Text style={styles.helperText}>
              {description.length}/200 characters
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.labelText}>Category <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
              <MaterialIcons name="category" size={22} color="#8e9297" />
              <Picker
                selectedValue={category}
                onValueChange={(value) => {
                  setCategory(value);
                  if (errors.category) {
                    setErrors({ ...errors, category: null });
                  }
                }}
                style={styles.picker}
                dropdownIconColor="#ffffff"
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat.replace('_', ' ')} value={cat} />
                ))}
              </Picker>
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>PRIVACY SETTINGS</Text>
          
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, isPublic && styles.selectedType]}
              onPress={() => setIsPublic(true)}
            >
              <MaterialIcons 
                name="public" 
                size={24} 
                color={isPublic ? "#ffffff" : "#8e9297"} 
              />
              <View style={styles.typeTextContainer}>
                <Text style={[styles.typeText, isPublic && styles.selectedTypeText]}>
                  Public Channel
                </Text>
                <Text style={[styles.typeDescription, isPublic && styles.selectedTypeDescription]}>
                  Anyone can view and join this channel
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.typeButton, !isPublic && styles.selectedType]}
              onPress={() => setIsPublic(false)}
            >
              <MaterialIcons 
                name="lock" 
                size={24} 
                color={!isPublic ? "#ffffff" : "#8e9297"} 
              />
              <View style={styles.typeTextContainer}>
                <Text style={[styles.typeText, !isPublic && styles.selectedTypeText]}>
                  Private Channel
                </Text>
                <Text style={[styles.typeDescription, !isPublic && styles.selectedTypeDescription]}>
                  Only people you invite can join
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.createButton,
            (isSubmitting || isLoading) && styles.createButtonDisabled
          ]}
          onPress={handleCreateChannel}
          disabled={isSubmitting || isLoading}
        >
          <LinearGradient
            colors={['#7289da', '#5865F2']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="add-circle-outline" size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>
                  {isSubmitting ? 'Creating...' : 'Create Channel'}
                </Text>
              </>
            )}
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
  contentContainer: {
    paddingBottom: 40,
  },
  headerGradient: {
    padding: 28,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  formContainer: {
    padding: 20,
    marginTop: 10,
  },
  formSection: {
    marginBottom: 28,
    backgroundColor: '#2f3136',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    color: '#8e9297',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  labelText: {
    color: '#b9bbbe',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#40444b',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#40444b',
  },
  picker: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 8,
  },
  typeSelector: {
    marginTop: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#36393f',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#40444b',
  },
  selectedType: {
    backgroundColor: 'rgba(114, 137, 218, 0.2)',
    borderColor: '#7289da',
  },
  typeTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  typeText: {
    color: '#dcddde',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTypeText: {
    color: '#ffffff',
  },
  typeDescription: {
    color: '#8e9297',
    fontSize: 13,
    marginTop: 4,
  },
  selectedTypeDescription: {
    color: '#b9bbbe',
  },
  createButton: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputError: {
    borderColor: '#f04747',
    borderWidth: 1,
  },
  errorText: {
    color: '#f04747',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  helperText: {
    color: '#8e9297',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
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
