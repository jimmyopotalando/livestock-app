// VerifyScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';
import { verifyAnimal } from '../services/api'; // Function in api.js

const VerifyScreen = ({ navigation }) => {
  const [animalImage, setAnimalImage] = useState(null);

  const handleVerify = async () => {
    if (!animalImage) {
      Alert.alert('Missing Image', 'Please upload or capture an image first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: animalImage.uri,
        name: 'verify.jpg',
        type: 'image/jpeg',
      });

      const result = await verifyAnimal(formData);

      if (result.success && result.match_found) {
        navigation.navigate('VerificationResult', {
          animalId: result.animal_id,
          ownerId: result.owner_id,
          ownerName: result.owner_name,
          ownerPhone: result.owner_phone,
          ownerLocation: result.owner_location,
        });
      } else {
        navigation.navigate('Alert', {
          image: animalImage,
          reason: 'No match found. Animal may be unregistered.',
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Verification failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Verify Animal" showBack />

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Take or upload a photo of the animal to verify its registration.
        </Text>

        <ImageUploader
          label="Upload or Capture Animal Image"
          onImageSelected={setAnimalImage}
        />

        <Button title="Verify Animal" onPress={handleVerify} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  instructions: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default VerifyScreen;
