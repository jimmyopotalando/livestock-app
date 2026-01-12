// VerifyAnimalScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyAnimal } from '../services/api'; 

const GPS_THRESHOLD = 20; // meters

const VerifyAnimalScreen = ({ navigation }) => {
  const scrollRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerLocation, setOwnerLocation] = useState('');

  const capturedCount = Object.values(images).filter(Boolean).length;

  const gpsAccurate = Object.values(images).every(
    (img) => img?.gps?.accuracy <= GPS_THRESHOLD
  );

  const canSubmit =
    capturedCount === 4 &&
    ownerId &&
    ownerName &&
    ownerPhone &&
    ownerLocation &&
    (gpsAccurate || adminMode);

  const handleImageSelect = (side, img) => {
    setImages((prev) => ({ ...prev, [side]: img }));
    // Auto-scroll to next capture
    scrollNext(side);
  };

  const scrollNext = (side) => {
    const mapping = { front: 1, back: 2, left: 3, right: 4 };
    scrollRef.current?.scrollTo({
      y: mapping[side] * 260,
      animated: true,
    });
  };

  const queueOffline = async (data) => {
    const queue =
      JSON.parse(await AsyncStorage.getItem('offlineVerificationQueue')) || [];
    queue.push(data);
    await AsyncStorage.setItem(
      'offlineVerificationQueue',
      JSON.stringify(queue)
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        'Blocked',
        'Please capture all images with sufficient GPS accuracy and fill all fields.'
      );
      return;
    }

    const payload = new FormData();
    Object.entries(images).forEach(([side, img]) => {
      payload.append(`image_${side}`, {
        uri: img.uri,
        name: `${side}.jpg`,
        type: 'image/jpeg',
      });
      payload.append(`timestamp_${side}`, img.timestamp);
      payload.append(`gps_${side}`, JSON.stringify(img.gps));
    });

    payload.append('owner_id', ownerId);
    payload.append('owner_name', ownerName);
    payload.append('owner_phone', ownerPhone);
    payload.append('owner_location', ownerLocation);

    const net = await Network.getNetworkStateAsync();

    if (!net.isConnected) {
      await queueOffline(payload);
      Alert.alert(
        'Offline',
        'Saved locally. Will sync automatically.'
      );
      navigation.goBack();
      return;
    }

    try {
      setSubmitting(true);

      const res = await verifyAnimal(payload);

      if (res?.success) {
        if (res.hints && res.hints.length > 0) {
          Alert.alert(
            'Verification Hints',
            res.hints.join('\n'),
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Verification Successful', `Verification ID: ${res.verification_id}`);
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', 'Verification failed.');
      }
    } catch (e) {
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Verify Animal"
        showBack
        onLongPress={() => setAdminMode(true)}
      />

      {adminMode && (
        <Text style={styles.adminBanner}>
          ADMIN MODE ENABLED — Overrides Logged
        </Text>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Capture live images from all angles for verification.
        </Text>

        {['front', 'back', 'left', 'right'].map((side) => (
          <View key={side} style={styles.imageContainer}>
            <ImageUploader
              label={`${side.charAt(0).toUpperCase() + side.slice(1)} Image`}
              onImageSelected={(img) => handleImageSelect(side, img)}
              adminMode={adminMode}
            />
          </View>
        ))}

        <Text style={styles.progress}>
          {capturedCount} / 4 images captured
        </Text>

        {!gpsAccurate && !adminMode && (
          <Text style={styles.warning}>
            GPS accuracy too low. Move to open area.
          </Text>
        )}

        <TextInput
          placeholder="Owner ID"
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

        <Button
          title={submitting ? 'Submitting...' : 'Submit Verification'}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  instructions: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  progress: { textAlign: 'center', marginTop: 10, color: COLORS.gray },
  warning: { textAlign: 'center', color: 'red', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: COLORS.white,
  },
  submitButton: { width: '70%', alignSelf: 'center', marginTop: 20 },
  adminBanner: { textAlign: 'center', color: 'red', fontWeight: '700', marginVertical: 6 },
  imageContainer: { marginVertical: 12 },
});

export default VerifyAnimalScreen;
