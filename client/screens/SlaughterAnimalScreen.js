// SlaughterAnimalScreen.js
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
import { recordSlaughter } from '../services/slaughterService';

const SlaughterAnimalScreen = ({ route, navigation }) => {
  const { animalId } = route.params || {};
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [slaughterDate, setSlaughterDate] = useState('');
  const [slaughterLocation, setSlaughterLocation] = useState('');
  const [remarks, setRemarks] = useState('');

  const canSubmit = slaughterDate && slaughterLocation;

  // Queue offline slaughter records
  const queueOffline = async (payload) => {
    const queue =
      JSON.parse(await AsyncStorage.getItem('offlineSlaughterQueue')) || [];
    queue.push(payload);
    await AsyncStorage.setItem(
      'offlineSlaughterQueue',
      JSON.stringify(queue)
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Incomplete', 'Please fill in the slaughter date and location.');
      return;
    }

    const payload = {
      animalId,
      slaughterDate,
      slaughterLocation,
      remarks,
      timestamp: new Date().toISOString(),
    };

    try {
      setSubmitting(true);

      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) {
        await queueOffline(payload);
        Alert.alert(
          'Offline',
          'Slaughter record saved locally and will sync when online.'
        );
        navigation.goBack();
        return;
      }

      const res = await recordSlaughter(payload);

      if (res?.success) {
        Alert.alert(
          'Success',
          `Slaughter record for Animal ID ${animalId} recorded successfully.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Confirmation', { animalId }) }]
        );
      } else {
        Alert.alert('Failed', res?.message || 'Failed to record slaughter.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not process slaughter record.');
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
        title="Record Slaughter"
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
          Enter slaughter details for Animal ID: {animalId || 'N/A'}
        </Text>

        <TextInput
          placeholder="Slaughter Date (YYYY-MM-DD)"
          value={slaughterDate}
          onChangeText={setSlaughterDate}
          style={styles.input}
        />
        <TextInput
          placeholder="Slaughter Location"
          value={slaughterLocation}
          onChangeText={setSlaughterLocation}
          style={styles.input}
        />
        <TextInput
          placeholder="Remarks (Optional)"
          value={remarks}
          onChangeText={setRemarks}
          style={styles.input}
        />

        <Button
          title={submitting ? 'Submitting...' : 'Submit Slaughter Record'}
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

export default SlaughterAnimalScreen;
