import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { apiClient } from './api'; // Axios instance

const OFFLINE_QUEUE_KEY = 'offlinePaymentQueue';

/**
 * Queue a payment request offline, avoiding duplicates
 * @param {Object} payload - Payment data
 */
export const queueOfflinePayment = async (payload) => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];

    // Unique key for deduplication
    const payloadKey = payload.checkout_request_id || `${payload.animalId}_${payload.actionType}_${payload.timestamp}`;

    const exists = queue.some(item => {
      const itemKey = item.checkout_request_id || `${item.animalId}_${item.actionType}_${item.timestamp}`;
      return itemKey === payloadKey;
    });

    if (!exists) {
      queue.push(payload);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log('Offline payment queued:', payloadKey);
    } else {
      console.log('Duplicate offline payment skipped:', payloadKey);
    }
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
        const response = await apiClient.post('/payment/process', payload);
        if (response.data?.success) {
          console.log('Offline payment synced successfully:', payload);
        } else {
          console.warn('Offline payment failed during sync:', payload, response.data?.message);
        }
      } catch (err) {
        console.error('Failed to sync payment', payload, err);
      }
    }

    if (queue.length) {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log('Offline payment queue cleared after sync');
    }
  } catch (err) {
    console.error('Error syncing offline payments', err);
  }
};

/**
 * Process a payment
 * @param {Object} paymentData - { animalId, amount, phone, paymentMethod }
 * @returns {Promise<Object>} - { success: boolean, offline?: boolean, message?: string }
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

/**
 * Fetch pending payments for a specific animal and action
 * @param {string} animalId
 * @param {string} actionType - 'slaughter' | 'ownership'
 * @returns {Promise<Array>} - List of pending payments
 */
export const fetchPendingPayments = async (animalId, actionType) => {
  try {
    const response = await apiClient.get('/payment/pending', { params: { animal_id: animalId, action_type: actionType } });
    if (response.data?.success && Array.isArray(response.data.pending)) {
      return response.data.pending;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch pending payments', err);
    return [];
  }
};
