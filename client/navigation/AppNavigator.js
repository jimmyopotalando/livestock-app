import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Core Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ImageCaptureScreen from '../screens/ImageCaptureScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import VerifyScreen from '../screens/VerifyScreen';
import VerificationResultScreen from '../screens/VerificationResultScreen';
import AlertScreen from '../screens/AlertScreen';

// New Screens
import PaymentScreen from '../screens/PaymentScreen';
import ChangeOwnershipScreen from '../screens/ChangeOwnershipScreen';
import SlaughterAnimalScreen from '../screens/SlaughterAnimalScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      {/* Core Flow */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ImageCapture" component={ImageCaptureScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Verify" component={VerifyScreen} />
      <Stack.Screen name="VerificationResult" component={VerificationResultScreen} />

      {/* Alerts */}
      <Stack.Screen name="Alert" component={AlertScreen} />

      {/* Payment Flow */}
      <Stack.Screen name="Payment" component={PaymentScreen} />

      {/* Ownership & Slaughter Management */}
      <Stack.Screen name="ChangeOwnership" component={ChangeOwnershipScreen} />
      <Stack.Screen name="SlaughterAnimal" component={SlaughterAnimalScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
