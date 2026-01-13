// WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header title="Welcome to Siaya County for Livestock Registrations" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          Please select an action below to get started.
        </Text>

        {/* Core Actions */}
        <Button
          title="Register Animal"
          onPress={() => navigation.navigate('Register')}
          style={styles.button}
        />
        <Button
          title="Verify Animal"
          onPress={() => navigation.navigate('Verify')}
          style={[styles.button, { backgroundColor: COLORS.secondary }]}
        />

        {/* Payment Flow */}
        <Button
          title="Make Payment"
          onPress={() => navigation.navigate('Payment')}
          style={[styles.button, { backgroundColor: COLORS.green }]}
        />

        {/* Ownership & Slaughter Management */}
        <Button
          title="Change Ownership"
          onPress={() => navigation.navigate('ChangeOwnership')}
          style={[styles.button, { backgroundColor: COLORS.orange }]}
        />
        <Button
          title="Slaughter Animal"
          onPress={() => navigation.navigate('SlaughterAnimal')}
          style={[styles.button, { backgroundColor: COLORS.red }]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '70%',
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default WelcomeScreen;
