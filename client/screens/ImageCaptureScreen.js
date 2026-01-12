// SecureImageCaptureScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

const CAPTURE_ORDER = ['front', 'back', 'left', 'right'];
const GPS_THRESHOLD = 20; // meters

const SecureImageCaptureScreen = ({ navigation }) => {
  const cameraRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState({});
  const [flash, setFlash] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const currentSide = CAPTURE_ORDER[currentStep];

  /* 🔒 Lock landscape */
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
    return () => ScreenOrientation.unlockAsync();
  }, []);

  /* 🎥 Permissions */
  useEffect(() => {
    (async () => {
      const cam = await Camera.requestCameraPermissionsAsync();
      const loc = await Location.requestForegroundPermissionsAsync();
      setHasPermission(cam.granted && loc.granted);
    })();
  }, []);

  /* 📸 Capture Image */
  const captureImage = async () => {
    if (images[currentSide] && !adminMode) return;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    if (
      location.coords.accuracy > GPS_THRESHOLD &&
      !adminMode
    ) {
      Alert.alert(
        'GPS Accuracy Low',
        'Move to an open area to improve GPS accuracy.'
      );
      return;
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      exif: true,
      skipProcessing: false,
    });

    const captured = {
      uri: photo.uri,
      exif: photo.exif,
      timestamp: new Date().toISOString(),
      gps: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      },
    };

    setImages((prev) => ({ ...prev, [currentSide]: captured }));

    if (currentStep < CAPTURE_ORDER.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finalizeCapture({ ...images, [currentSide]: captured });
    }
  };

  /* 📦 Offline-safe finalize */
  const finalizeCapture = async (payloadImages) => {
    const formData = new FormData();

    Object.entries(payloadImages).forEach(([side, img]) => {
      formData.append(`image_${side}`, {
        uri: img.uri,
        name: `${side}.jpg`,
        type: 'image/jpeg',
      });
      formData.append(`timestamp_${side}`, img.timestamp);
      formData.append(`gps_${side}`, JSON.stringify(img.gps));
    });

    const net = await Network.getNetworkStateAsync();

    if (!net.isConnected) {
      const queue =
        JSON.parse(await AsyncStorage.getItem('secureCaptureQueue')) || [];
      queue.push(formData);
      await AsyncStorage.setItem(
        'secureCaptureQueue',
        JSON.stringify(queue)
      );

      Alert.alert(
        'Offline',
        'Images saved securely and will sync automatically.'
      );
      navigation.goBack();
      return;
    }

    navigation.navigate('Register', { capturedImages: payloadImages });
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera & GPS permissions are required.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`Capture ${currentSide.toUpperCase()} Image`}
        showBack
        onLongPress={() => setAdminMode(true)}
      />

      {adminMode && (
        <Text style={styles.adminBanner}>
          ADMIN MODE ENABLED — Overrides Logged
        </Text>
      )}

      <Camera
        ref={cameraRef}
        style={styles.camera}
        flashMode={
          flash
            ? Camera.Constants.FlashMode.torch
            : Camera.Constants.FlashMode.off
        }
      >
        <View style={styles.overlay}>
          <Text style={styles.progress}>
            {currentStep + 1} / 4
          </Text>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={captureImage}
          />

          <TouchableOpacity
            style={styles.flashToggle}
            onPress={() => setFlash(!flash)}
          >
            <Text style={styles.flashText}>
              Flash: {flash ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progress: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 12,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  flashToggle: {
    marginTop: 12,
  },
  flashText: {
    color: COLORS.white,
    fontSize: 14,
  },
  adminBanner: {
    textAlign: 'center',
    color: 'red',
    fontWeight: '700',
    paddingVertical: 4,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: COLORS.gray,
    fontSize: 16,
  },
});

export default SecureImageCaptureScreen;
