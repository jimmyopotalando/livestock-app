// ConfirmationScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';

const ConfirmationScreen = ({ route, navigation }) => {
  const {
    animalId,
    ownerId,
    ownerName,
    ownerPhone,
    ownerLocation,
  } = route.params || {};

  return (
    <View style={styles.container}>
      <Header title="Registration Successful!" showBack={false} />

      <View style={styles.content}>
        <Text style={styles.successText}>Animal Registered Successfully!</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Animal ID:</Text>
          <Text style={styles.value}>{animalId || 'N/A'}</Text>

          <Text style={styles.label}>Owner ID:</Text>
          <Text style={styles.value}>{ownerId || 'Generated Automatically'}</Text>

          <Text style={styles.label}>Owner Name:</Text>
          <Text style={styles.value}>{ownerName}</Text>

          <Text style={styles.label}>Owner Phone:</Text>
          <Text style={styles.value}>{ownerPhone}</Text>

          <Text style={styles.label}>Owner Location:</Text>
          <Text style={styles.value}>{ownerLocation}</Text>
        </View>

        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('Welcome')}
        />

        <Button
          title="Register Another Animal"
          onPress={() => navigation.navigate('Register')}
          style={{ backgroundColor: COLORS.secondary, marginTop: 12 }}
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
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  successText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 30,
    elevation: 3,
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: COLORS.black,
  },
});

export default ConfirmationScreen;
