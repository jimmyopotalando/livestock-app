// RegisterScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';
import { registerAnimal } from '../services/api';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const GPS_THRESHOLD = 20; // meters

const RegisterScreen = ({ navigation }) => {
  const scrollRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const capturedCount = Object.values(images).filter(Boolean).length;

  // Determine if GPS accuracy is sufficient
  const gpsAccurate = Object.values(images).every(
    (img) => img?.gps?.accuracy <= GPS_THRESHOLD
  );

  const canSubmit = capturedCount === 4 && (gpsAccurate || adminMode);

  // Capture timestamp + GPS automatically
  const handleImageSelect = async (side, img) => {
    try {
      // Get location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const gps = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      setImages((prev) => ({
        ...prev,
        [side]: {
          ...img,
          timestamp,
          gps,
        },
      }));
    } catch (err) {
      Alert.alert(
        'Location Error',
        'Unable to fetch GPS coordinates. Please ensure location is enabled.'
      );
      console.error(err);
    }
  };

  const scrollNext = (i) => {
    scrollRef.current?.scrollTo({
      y: i * 260,
      animated: true,
    });
  };

  const queueOffline = async (data) => {
    const queue =
      JSON.parse(await AsyncStorage.getItem('offlineQueue')) || [];
    queue.push(data);
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
  };

  useEffect(() => {
    const syncQueue = async () => {
      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) return;

      const queue =
        JSON.parse(await AsyncStorage.getItem('offlineQueue')) || [];

      for (const item of queue) {
        await registerAnimal(item);
      }

      if (queue.length) {
        await AsyncStorage.removeItem('offlineQueue');
      }
    };

    syncQueue();
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        'Blocked',
        'GPS accuracy too low or images missing.'
      );
      return;
    }

    const net = await Network.getNetworkStateAsync();

    const payload = new FormData();
    Object.entries(images).forEach(([side, img]) => {
      payload.append(`image_${side}`, {
        uri: img.uri,
        name: `${side}.jpg`,
        type: 'image/jpeg',
      });
      // Automatically include timestamp & GPS
      payload.append(`image_${side}_timestamp`, img.timestamp);
      payload.append(`image_${side}_gps`, JSON.stringify(img.gps));
    });

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
      const res = await registerAnimal(payload);

      if (res?.success) {
        navigation.navigate('Confirmation', {
          animalId: res.animal_id,
          images, // pass captured images with timestamp/GPS
        });
      } else {
        Alert.alert('Error', 'Registration failed.');
      }
    } catch (e) {
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Capture Animal Images"
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
          Capture clear images from all angles using the camera.
        </Text>

        {['front', 'back', 'left', 'right'].map((side, index) => (
          <ImageUploader
            key={side}
            label={`Capture ${side.charAt(0).toUpperCase() + side.slice(1)} Image`}
            onImageSelected={(i) => handleImageSelect(side, i)}
            onCaptured={() => scrollNext(index + 1)}
            adminMode={adminMode}
            disabled={!!images[side]} // Prevent retake
          />
        ))}

        <Text style={styles.progress}>
          {capturedCount} / 4 images captured
        </Text>

        {!gpsAccurate && !adminMode && (
          <Text style={styles.warning}>
            GPS accuracy too low. Move to open area.
          </Text>
        )}

        <Button
          title={submitting ? 'Submitting...' : 'Submit Registration'}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  instructions: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  progress: {
    textAlign: 'center',
    marginTop: 10,
    color: COLORS.gray,
  },
  warning: {
    textAlign: 'center',
    color: 'red',
    marginTop: 8,
  },
  submitButton: {
    width: '70%',
    alignSelf: 'center',
    marginTop: 20,
  },
  adminBanner: {
    textAlign: 'center',
    color: 'red',
    fontWeight: '700',
    marginVertical: 6,
  },
});

export default RegisterScreen;
