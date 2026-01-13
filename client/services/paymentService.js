// paymentService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { apiClient } from './api'; // Axios instance

const OFFLINE_QUEUE_KEY = 'offlinePaymentQueue';

/**
 * Queue a payment request offline
 * @param {Object} payload - Payment data
 */
export const queueOfflinePayment = async (payload) => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];
    queue.push(payload);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to queue payment offline', err);
  }
};

/**
 * Sync offline payment queue when online
 */
export const syncOfflinePayments = async () => {
  try {
    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected) return;

    const queue = JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];

    for (const payload of queue) {
      try {
        await apiClient.post('/payment/process', payload);
      } catch (err) {
        console.error('Failed to sync payment', payload, err);
      }
    }

    if (queue.length) {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch (err) {
    console.error('Error syncing offline payments', err);
  }
};

/**
 * Process a payment
 * @param {Object} paymentData - { animalId, amount, phoneNumber, paymentMethod }
 * @returns {Promise<Object>} - { success: boolean, message?: string }
 */
export const processPayment = async (paymentData) => {
  try {
    const net = await Network.getNetworkStateAsync();

    if (!net.isConnected) {
      await queueOfflinePayment(paymentData);
      return { success: true, offline: true, message: 'Saved offline, will sync when online' };
    }

    const response = await apiClient.post('/payment/process', paymentData);

    if (response.data?.success) {
      return { success: true };
    } else {
      return { success: false, message: response.data?.message || 'Payment failed' };
    }
  } catch (err) {
    console.error('Payment error', err);
    // Fallback: save offline if network error
    await queueOfflinePayment(paymentData);
    return { success: true, offline: true, message: 'Saved offline due to network error' };
  }
};
