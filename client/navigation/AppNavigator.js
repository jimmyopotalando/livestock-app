import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ImageCaptureScreen from '../screens/ImageCaptureScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import VerifyScreen from '../screens/VerifyScreen';
import VerificationResultScreen from '../screens/VerificationResultScreen';
import AlertScreen from '../screens/AlertScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ImageCapture" component={ImageCaptureScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Verify" component={VerifyScreen} />
      <Stack.Screen name="VerificationResult" component={VerificationResultScreen} />
      <Stack.Screen name="Alert" component={AlertScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
