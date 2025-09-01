// RegisterScreen.js
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';
import { registerAnimal } from '../services/api'; // We'll create this in api.js

const RegisterScreen = ({ navigation }) => {
  // Owner Info
  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerLocation, setOwnerLocation] = useState('');

  // Images
  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const handleImageSelect = (side, image) => {
    setImages((prev) => ({ ...prev, [side]: image }));
  };

  const handleSubmit = async () => {
    if (!ownerName || !ownerPhone || !ownerLocation ||
        !images.front || !images.back || !images.left || !images.right) {
      Alert.alert('Missing Fields', 'Please fill in all required fields and upload all images.');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('owner_id', ownerId);
      formData.append('owner_name', ownerName);
      formData.append('owner_phone', ownerPhone);
      formData.append('owner_location', ownerLocation);

      Object.entries(images).forEach(([side, img]) => {
        formData.append(`image_${side}`, {
          uri: img.uri,
          name: `${side}.jpg`,
          type: 'image/jpeg',
        });
      });

      const response = await registerAnimal(formData);

      if (response.success) {
        navigation.navigate('Confirmation', {
          animalId: response.animal_id,
          ownerId: response.owner_id,
          ownerName,
          ownerPhone,
          ownerLocation,
        });
      } else {
        Alert.alert('Error', 'Failed to register animal. Try again.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong during registration.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Register Animal" showBack />

      <ScrollView contentContainerStyle={styles.form}>
        <ImageUploader label="Front Image" onImageSelected={(img) => handleImageSelect('front', img)} />
        <ImageUploader label="Back Image" onImageSelected={(img) => handleImageSelect('back', img)} />
        <ImageUploader label="Left Image" onImageSelected={(img) => handleImageSelect('left', img)} />
        <ImageUploader label="Right Image" onImageSelected={(img) => handleImageSelect('right', img)} />

        <TextInput
          placeholder="Owner ID (optional)"
          value={ownerId}
          onChangeText={setOwnerId}
          style={styles.input}
        />
        <TextInput
          placeholder="Owner Name"
          value={ownerName}
          onChangeText={setOwnerName}
          style={styles.input}
        />
        <TextInput
          placeholder="Owner Phone"
          value={ownerPhone}
          onChangeText={setOwnerPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="Owner Location"
          value={ownerLocation}
          onChangeText={setOwnerLocation}
          style={styles.input}
        />

        <Button title="Submit Registration" onPress={handleSubmit} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
});

export default RegisterScreen;
