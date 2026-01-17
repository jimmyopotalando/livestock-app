// PaymentScreen.js
import React, { useState, useEffect } from 'react';
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
import PaymentStatusModal from '../components/PaymentStatusModal';
import { COLORS } from '../constants/theme';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processPayment, syncOfflinePayments, fetchPendingPayments } from '../services/paymentService';

const OFFLINE_QUEUE_KEY = 'offlinePaymentQueue';

const PaymentScreen = ({ route, navigation }) => {
  const { animalId, actionType } = route.params || {};
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStatus, setModalStatus] = useState('PENDING'); // 'PENDING' | 'SUCCESS' | 'FAILED'
  const [modalMessage, setModalMessage] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);

  const canSubmit = amount && phone;

  // Queue offline payments with deduplication
  const queueOffline = async (payload) => {
    try {
      const queue = JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];

      const exists = queue.some(
        (item) =>
          item.animalId === payload.animalId &&
          item.timestamp === payload.timestamp
      );

      if (!exists) {
        queue.push(payload);
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        console.log('Offline payment queued:', payload);
      } else {
        console.log('Duplicate payment skipped from queue');
      }
    } catch (err) {
      console.error('Failed to queue payment offline', err);
    }
  };

  // Sync offline payments on screen load or network reconnect
  useEffect(() => {
    const syncAndFetch = async () => {
      const net = await Network.getNetworkStateAsync();
      if (net.isConnected) {
        await syncOfflinePayments(); // sync any queued offline payments
      }
      const pending = await fetchPendingPayments(animalId, actionType);
      setPendingPayments(pending);
    };

    syncAndFetch();
  }, [animalId, actionType]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Incomplete', 'Please enter both phone number and amount.');
      return;
    }

    if (pendingPayments.length > 0) {
      // Block submission if there are pending payments
      setModalStatus('PENDING');
      setModalMessage(`You have ${pendingPayments.length} pending payment(s). Please complete them first.`);
      setModalVisible(true);
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
      setModalVisible(true);
      setModalStatus('PENDING');
      setModalMessage('Processing payment...');

      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) {
        await queueOffline(payload);
        setModalStatus('FAILED');
        setModalMessage('Payment saved offline. Will sync when online.');
        return;
      }

      const res = await processPayment(payload);

      if (res?.success) {
        setModalStatus('SUCCESS');
        setModalMessage(`Payment of KES ${payload.amount} processed successfully.`);
        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate('Confirmation', { animalId });
        }, 1500);
      } else {
        setModalStatus('FAILED');
        setModalMessage(res?.message || 'Transaction failed.');
      }
    } catch (err) {
      console.error('Payment error', err);
      await queueOffline(payload);
      setModalStatus('FAILED');
      setModalMessage('Saved locally due to network error. Will sync when online.');
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

      {/* Payment Status Modal */}
      <PaymentStatusModal
        visible={modalVisible}
        status={modalStatus}
        message={modalMessage}
        amount={parseFloat(amount) || 0}
        pendingPayments={pendingPayments}
        onRetry={handleSubmit}
        onClose={() => setModalVisible(false)}
      />
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
