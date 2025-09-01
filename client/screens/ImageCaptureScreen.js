// ImageCaptureScreen.js
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import Button from '../components/Button';

const captureOrder = ['front', 'back', 'left', 'right'];

const ImageCaptureScreen = () => {
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const [hasPermission, setHasPermission] = useState(null);
  const [capturedImages, setCapturedImages] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const currentSide = captureOrder[currentStep];

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setCapturedImages((prev) => ({
        ...prev,
        [currentSide]: photo,
      }));

      if (currentStep < captureOrder.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All 4 images captured — proceed
        navigation.navigate('Register', { capturedImages });
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={Camera.Constants.Type.back}>
        <View style={styles.overlay}>
          <Text style={styles.captureText}>Capture {currentSide} Image</Text>
          <Text style={styles.progress}>
            {Object.keys(capturedImages).length}/4 images captured
          </Text>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  captureText: {
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 10,
  },
  progress: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.gray,
  },
});

export default ImageCaptureScreen;
