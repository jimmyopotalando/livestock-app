// ChangeOwnershipScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeOwnership } from '../services/ownershipService';

const ChangeOwnershipScreen = ({ route, navigation }) => {
  const { animalId } = route.params || {};
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [newOwnerId, setNewOwnerId] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerLocation, setNewOwnerLocation] = useState('');

  // Determine if submission is possible
  const canSubmit =
    newOwnerId && newOwnerName && newOwnerPhone && newOwnerLocation;

  // Queue offline ownership changes
  const queueOffline = async (payload) => {
    const queue =
      JSON.parse(await AsyncStorage.getItem('offlineOwnershipQueue')) || [];
    queue.push(payload);
    await AsyncStorage.setItem(
      'offlineOwnershipQueue',
      JSON.stringify(queue)
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Incomplete', 'Please fill in all new owner details.');
      return;
    }

    const payload = {
      animalId,
      newOwnerId,
      newOwnerName,
      newOwnerPhone,
      newOwnerLocation,
      timestamp: new Date().toISOString(),
    };

    try {
      setSubmitting(true);

      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) {
        await queueOffline(payload);
        Alert.alert(
          'Offline',
          'Ownership change saved locally and will sync when online.'
        );
        navigation.goBack();
        return;
      }

      const res = await changeOwnership(payload);

      if (res?.success) {
        Alert.alert(
          'Success',
          `Ownership successfully changed to ${newOwnerName}.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Confirmation', { animalId }) }]
        );
      } else {
        Alert.alert('Failed', res?.message || 'Ownership change failed.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not process ownership change.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Change Animal Ownership"
        showBack
        onLongPress={() => setAdminMode(true)}
      />

      {adminMode && (
        <Text style={styles.adminBanner}>
          ADMIN MODE ENABLED — Overrides Logged
        </Text>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Enter the new owner's details for animal ID: {animalId || 'N/A'}
        </Text>

        <TextInput
          placeholder="New Owner ID"
          value={newOwnerId}
          onChangeText={setNewOwnerId}
          style={styles.input}
        />
        <TextInput
          placeholder="New Owner Name"
          value={newOwnerName}
          onChangeText={setNewOwnerName}
          style={styles.input}
        />
        <TextInput
          placeholder="New Owner Phone"
          value={newOwnerPhone}
          onChangeText={setNewOwnerPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="New Owner Location"
          value={newOwnerLocation}
          onChangeText={setNewOwnerLocation}
          style={styles.input}
        />

        <Button
          title={submitting ? 'Submitting...' : 'Submit Ownership Change'}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  instructions: { textAlign: 'center', fontSize: 16, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: COLORS.white,
  },
  submitButton: { width: '70%', alignSelf: 'center', marginTop: 20 },
  adminBanner: { textAlign: 'center', color: 'red', fontWeight: '700', marginVertical: 6 },
});

export default ChangeOwnershipScreen;
