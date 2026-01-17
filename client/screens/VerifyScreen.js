// VerifyAnimalScreen.js
import React, { useState, useRef } from 'react';
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
const OFFLINE_QUEUE_KEY = 'offlineVerificationQueue';

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
    (img) =>
      typeof img?.gps?.accuracy === 'number' &&
      img.gps.accuracy <= GPS_THRESHOLD
  );

  const phoneValid = /^\+?\d{8,15}$/.test(ownerPhone);

  const canSubmit =
    capturedCount === 4 &&
    ownerId &&
    ownerName &&
    ownerLocation &&
    phoneValid &&
    (gpsAccurate || adminMode);

  const handleImageSelect = (side, img) => {
    setImages((prev) => ({ ...prev, [side]: img }));
    scrollNext(side);
  };

  const scrollNext = (side) => {
    const mapping = { front: 1, back: 2, left: 3, right: 4 };
    scrollRef.current?.scrollTo({
      y: mapping[side] * 260,
      animated: true,
    });
  };

  /**
   * Store a SERIALIZABLE offline payload
   */
  const queueOffline = async (offlineItem) => {
    try {
      const existing =
        JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];

      const exists = existing.some((item) => {
        if (item.owner_id !== offlineItem.owner_id) return false;
        return ['front', 'back', 'left', 'right'].every(
          (side) =>
            item.images?.[side]?.timestamp ===
            offlineItem.images?.[side]?.timestamp
        );
      });

      if (!exists) {
        existing.push(offlineItem);
        await AsyncStorage.setItem(
          OFFLINE_QUEUE_KEY,
          JSON.stringify(existing)
        );
      } else {
        console.log('Duplicate offline verification skipped');
      }
    } catch (err) {
      console.error('Failed to queue offline verification', err);
    }
  };

  const buildFormData = () => {
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

    return payload;
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        'Blocked',
        'Please capture all images with sufficient GPS accuracy and fill all fields correctly.'
      );
      return;
    }

    const offlinePayload = {
      owner_id: ownerId,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_location: ownerLocation,
      images,
      created_at: Date.now(),
      admin_override: adminMode,
    };

    try {
      setSubmitting(true);

      const net = await Network.getNetworkStateAsync();

      if (!net.isConnected) {
        await queueOffline(offlinePayload);
        Alert.alert('Offline', 'Saved locally. Will sync automatically.');
        navigation.goBack();
        return;
      }

      const payload = buildFormData();
      const res = await verifyAnimal(payload);

      if (res?.success) {
        if (res.hints?.length) {
          Alert.alert(
            'Verification Hints',
            res.hints.join('\n'),
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            'Verification Successful',
            `Verification ID: ${res.verification_id}`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert(
          'Verification Failed',
          res?.message || 'Please try again.'
        );
      }
    } catch (e) {
      await queueOffline(offlinePayload);
      Alert.alert(
        'Network Error',
        'Saved locally due to network error.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const enableAdminMode = () => {
    Alert.alert(
      'Admin Mode',
      'Enable GPS override? This action will be logged.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', onPress: () => setAdminMode(true) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Verify Animal"
        showBack
        onLongPress={enableAdminMode}
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
            GPS accuracy too low. Move to an open area.
          </Text>
        )}

        <TextInput
          placeholder="Owner ID"
          value={ownerId}
          onChangeText={setOwnerId}
          editable={!submitting}
          style={styles.input}
        />
        <TextInput
          placeholder="Owner Name"
          value={ownerName}
          onChangeText={setOwnerName}
          editable={!submitting}
          style={styles.input}
        />
        <TextInput
          placeholder="Owner Phone"
          value={ownerPhone}
          onChangeText={setOwnerPhone}
          keyboardType="phone-pad"
          editable={!submitting}
          style={styles.input}
        />
        <TextInput
          placeholder="Owner Location"
          value={ownerLocation}
          onChangeText={setOwnerLocation}
          editable={!submitting}
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
  adminBanner: {
    textAlign: 'center',
    color: 'red',
    fontWeight: '700',
    marginVertical: 6,
  },
  imageContainer: { marginVertical: 12 },
});

export default VerifyAnimalScreen;
