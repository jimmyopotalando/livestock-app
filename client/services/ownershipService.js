// ownershipService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { apiClient } from './api'; // Axios instance

const OFFLINE_QUEUE_KEY = 'offlineOwnershipQueue';

/**
 * Queue an ownership change request offline
 * @param {Object} payload - Ownership change data
 */
export const queueOfflineOwnership = async (payload) => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];
    queue.push(payload);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to queue ownership change offline', err);
  }
};

/**
 * Sync offline ownership queue when online
 */
export const syncOfflineOwnership = async () => {
  try {
    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected) return;

    const queue = JSON.parse(await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) || [];

    for (const payload of queue) {
      try {
        await apiClient.post('/ownership/change', payload);
      } catch (err) {
        console.error('Failed to sync ownership change', payload, err);
      }
    }

    if (queue.length) {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
  } catch (err) {
    console.error('Error syncing offline ownership changes', err);
  }
};

/**
 * Change ownership of an animal
 * @param {Object} ownershipData - { animalId, newOwnerId, newOwnerName, newOwnerPhone }
 * @returns {Promise<Object>} - { success: boolean, offline?: boolean, message?: string }
 */
export const changeOwnership = async (ownershipData) => {
  try {
    const net = await Network.getNetworkStateAsync();

    if (!net.isConnected) {
      await queueOfflineOwnership(ownershipData);
      return { success: true, offline: true, message: 'Saved offline, will sync when online' };
    }

    const response = await apiClient.post('/ownership/change', ownershipData);

    if (response.data?.success) {
      return { success: true };
    } else {
      return { success: false, message: response.data?.message || 'Ownership change failed' };
    }
  } catch (err) {
    console.error('Ownership change error', err);
    // Fallback: save offline if network error
    await queueOfflineOwnership(ownershipData);
    return { success: true, offline: true, message: 'Saved offline due to network error' };
  }
};
