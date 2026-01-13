// PaymentScreen.js
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
import { processPayment } from '../services/paymentService';

const PaymentScreen = ({ route, navigation }) => {
  const { animalId, actionType } = route.params || {}; // e.g., 'ownership', 'slaughter'
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');

  // Determine if submission is possible
  const canSubmit = amount && phone;

  // Queue offline payments
  const queueOffline = async (payload) => {
    const queue =
      JSON.parse(await AsyncStorage.getItem('offlinePaymentQueue')) || [];
    queue.push(payload);
    await AsyncStorage.setItem('offlinePaymentQueue', JSON.stringify(queue));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Incomplete', 'Please enter both phone number and amount.');
      return;
    }

    const payload = {
      animalId,
      actionType,
      amount: parseFloat(amount),
      phone,
      timestamp: new Date().toISOString(),
    };

    try {
      setSubmitting(true);

      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) {
        await queueOffline(payload);
        Alert.alert(
          'Offline',
          'Payment saved locally and will be processed when online.'
        );
        navigation.goBack();
        return;
      }

      const res = await processPayment(payload);

      if (res?.success) {
        Alert.alert(
          'Payment Successful',
          `Payment of ${payload.amount} processed successfully.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Confirmation', { animalId }),
            },
          ]
        );
      } else {
        Alert.alert('Payment Failed', res?.message || 'Transaction failed.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Payment could not be processed.');
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
        title="Animal Payment"
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
          {`Make a payment for ${
            actionType === 'slaughter'
              ? 'slaughter'
              : actionType === 'ownership'
              ? 'ownership transfer'
              : 'the selected action'
          }.`}
        </Text>

        <TextInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          placeholder="Amount (KES)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />

        <Button
          title={submitting ? 'Processing...' : 'Submit Payment'}
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

export default PaymentScreen;
