// AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import all your screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ImageCaptureScreen from '../screens/ImageCaptureScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import VerifyScreen from '../screens/VerifyScreen';
import VerificationResultScreen from '../screens/VerificationResultScreen';
import AlertScreen from '../screens/AlertScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false, // We use custom Header.js
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ImageCapture" component={ImageCaptureScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="Verify" component={VerifyScreen} />
        <Stack.Screen name="VerificationResult" component={VerificationResultScreen} />
        <Stack.Screen name="Alert" component={AlertScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
