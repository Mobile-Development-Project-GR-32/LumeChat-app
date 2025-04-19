import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, Switch, Image
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { channelService } from '../services/channel.service';

const CHANNEL_CATEGORIES = ['GENERAL', 'INFORMATION', 'STUDY_GROUPS', 'PROJECTS', 'VOICE_CHANNELS'];

const EditChannelScreen = ({ route, navigation }) => {
  const { channelId, channelData } = route.params || {};
  const user = useSelector(state => state.user);
  
  // Channel form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Load channel data on mount
  useEffect(() => {
    setIsLoading(true);
    if (channelData) {
      setName(channelData.name || '');
      setDescription(channelData.description || '');
      setCategory(channelData.category || 'GENERAL');
      setIsPublic(channelData.isPublic !== false);
      setCoverImage(channelData.coverPhoto || null);
      setIsLoading(false);
    } else {
      loadChannelData();
    }
  }, [channelId, channelData]);

  const loadChannelData = async () => {
    try {
      const data = await channelService.getChannelDetails(user._id, channelId);
      setName(data.name || '');
      setDescription(data.description || '');
      setCategory(data.category || 'GENERAL');
      setIsPublic(data.isPublic !== false);
      setCoverImage(data.coverPhoto || null);
    } catch (error) {
      console.error('Error loading channel data:', error);
      Alert.alert('Error', 'Failed to load channel data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!name.trim()) {
      errors.name = 'Channel name is required';
    }
    
    if (!category) {
      errors.category = 'Please select a category';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to change the channel cover');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleSaveChannel = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const updateData = {
        name: name.trim(),
        description: description.trim(),
        isPublic: isPublic,
        category: category
      };

      console.log('Sending channel update data:', updateData);
      console.log('Channel ID being updated:', channelId);
      
      // First update the channel
      const result = await channelService.updateChannel(user._id, channelId, updateData);
      console.log('Update result:', result);

      // For image upload if needed
      if (coverImage && coverImage !== channelData?.coverPhoto) {
        // Handle image upload logic
        // This would typically be done with FormData
      }

      Alert.alert(
        "Success",
        "Channel updated successfully",
        [
          { 
            text: "OK", 
            onPress: () => {
              navigation.navigate('ChannelProfile', { 
                channelId,
                channelName: name.trim(),
                refresh: true,
                timestamp: new Date().getTime() // Force refresh by adding timestamp
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Update channel error:', error);
      Alert.alert('Error', error.message || 'Failed to update channel');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7289DA" />
        <Text style={styles.loadingText}>Loading channel settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.coverImageSection}>
          {coverImage ? (
            <View style={styles.coverImageContainer}>
              <Image 
                source={{ uri: coverImage }} 
                style={styles.coverImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.changeCoverButton}
                onPress={pickImage}
              >
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                <Text style={styles.changeCoverText}>Change Cover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addCoverButton}
              onPress={pickImage}
            >
              <MaterialIcons name="add-photo-alternate" size={36} color="#7289DA" />
              <Text style={styles.addCoverText}>Add Channel Cover</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Channel Name */}
        <View style={styles.formField}>
          <Text style={styles.label}>Channel Name</Text>
          <View style={[styles.inputContainer, formErrors.name && styles.inputError]}>
            <MaterialIcons name="tag" size={24} color="#8e9297" />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter channel name"
              placeholderTextColor="#8e9297"
            />
          </View>
          {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
        </View>

        {/* Channel Description */}
        <View style={styles.formField}>
          <Text style={styles.label}>Description</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="description" size={24} color="#8e9297" />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter channel description"
              placeholderTextColor="#8e9297"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.formField}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {CHANNEL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  category === cat && styles.selectedCategory
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text 
                  style={[
                    styles.categoryText, 
                    category === cat && styles.selectedCategoryText
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formErrors.category && <Text style={styles.errorText}>{formErrors.category}</Text>}
        </View>

        {/* Privacy */}
        <View style={styles.formField}>
          <Text style={styles.label}>Privacy</Text>
          <View style={styles.privacyContainer}>
            <View style={styles.privacyContent}>
              <MaterialIcons 
                name={isPublic ? "public" : "lock"} 
                size={24} 
                color="#8e9297" 
              />
              <View style={styles.privacyDetails}>
                <Text style={styles.privacyTitle}>
                  {isPublic ? "Public Channel" : "Private Channel"}
                </Text>
                <Text style={styles.privacyDescription}>
                  {isPublic 
                    ? "Anyone can view and join this channel" 
                    : "Only approved members can view and join"
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#3a3c40', true: '#7289DA' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveChannel}
            disabled={isSaving}
          >
            <LinearGradient
              colors={['#7289DA', '#5865F2']}
              style={styles.saveButtonGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36393F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#36393F',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  formContainer: {
    padding: 16,
  },
  coverImageSection: {
    marginBottom: 20,
  },
  coverImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  changeCoverButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeCoverText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  addCoverButton: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#2F3136',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3C3F45',
    borderStyle: 'dashed',
  },
  addCoverText: {
    color: '#7289DA',
    marginTop: 8,
    fontSize: 16,
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B9BBBE',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202225',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#202225',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputError: {
    borderColor: '#F04747',
  },
  errorText: {
    color: '#F04747',
    fontSize: 12,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryOption: {
    backgroundColor: '#202225',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#7289DA',
  },
  categoryText: {
    color: '#B9BBBE',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202225',
    borderRadius: 8,
    padding: 12,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyDetails: {
    marginLeft: 12,
  },
  privacyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyDescription: {
    color: '#B9BBBE',
    fontSize: 12,
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#4F545C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EditChannelScreen;
