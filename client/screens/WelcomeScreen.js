// WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Welcome to Siaya County for Livestock Registrations" />

      <View style={styles.content}>
        <Text style={styles.introText}>
          Please select an action below to get started.
        </Text>

        <Button
          title="Register Animal"
          onPress={() => navigation.navigate('Register')}
        />

        <Button
          title="Verify Animal"
          onPress={() => navigation.navigate('Verify')}
          style={{ backgroundColor: COLORS.secondary }}
        />
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  introText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default WelcomeScreen;
