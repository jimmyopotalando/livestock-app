// ImageUploader.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS } from '../constants/theme';

const ImageUploader = ({ label, onImageSelected, onCaptured, adminMode, disabled }) => {
  const [image, setImage] = useState(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    // Force landscape orientation
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => ScreenOrientation.unlockAsync();
  }, []);

  const openCamera = async () => {
    if ((image && !adminMode) || disabled) return; // Prevent retake if already captured

    // Request permissions
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    const locPerm = await Location.requestForegroundPermissionsAsync();

    if (!camPerm.granted || !locPerm.granted) {
      Alert.alert('Permission Required', 'Camera and location permissions are required.');
      return;
    }

    // Capture GPS location with high accuracy
    let location = null;
    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
    } catch (err) {
      Alert.alert('Location Error', 'Unable to fetch GPS coordinates.');
      console.error(err);
    }

    const timestamp = new Date().toISOString();

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      quality: 0.8,
      exif: true,
      flashMode: flash
        ? ImagePicker.CameraFlashMode.on
        : ImagePicker.CameraFlashMode.off,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const captured = {
        ...result.assets[0],
        timestamp,
        gps: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
            }
          : null,
      };

      setImage(captured);
      onImageSelected(captured);
      onCaptured?.();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.uploadBox, image && styles.lockedBox]}
        onPress={openCamera}
        activeOpacity={0.8}
      >
        {image ? (
          <>
            <Image source={{ uri: image.uri }} style={styles.image} />
            {image.gps && (
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>
                  {new Date(image.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.watermarkText}>
                  {image.gps.latitude.toFixed(5)},{image.gps.longitude.toFixed(5)}
                </Text>
                <Text style={styles.watermarkText}>
                  ±{Math.round(image.gps.accuracy)}m
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.placeholder}>Tap to capture image</Text>
        )}
      </TouchableOpacity>

      {!image && (
        <TouchableOpacity
          onPress={() => setFlash(!flash)}
          style={styles.flashToggle}
        >
          <Text style={styles.flashText}>
            Flash: {flash ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.black,
  },
  uploadBox: {
    height: 180,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lockedBox: {
    borderColor: COLORS.primary,
  },
  placeholder: {
    color: COLORS.gray,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  watermark: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 10,
    color: '#fff',
  },
  flashToggle: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  flashText: {
    color: COLORS.primary,
    fontSize: 13,
  },
});

export default ImageUploader;
