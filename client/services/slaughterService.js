// client/services/slaughterService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import api from './api';

/**
 * Record a slaughtered animal.
 * Handles offline queue if network is unavailable.
 * @param {FormData|Object} data - Slaughter record data
 */
export const recordSlaughter = async (data) => {
  const net = await Network.getNetworkStateAsync();

  if (!net.isConnected) {
    await queueOffline(data);
    return { success: false, offline: true, message: 'Saved offline. Will sync automatically.' };
  }

  try {
    const response = await api.post('/slaughter', data);
    return response.data;
  } catch (error) {
    console.error('Slaughter API error:', error);
    // If API fails but device is online, still queue offline
    await queueOffline(data);
    return { success: false, offline: true, message: 'Failed to sync. Saved offline.' };
  }
};

/**
 * Queue slaughter record for offline sync
 * @param {FormData|Object} data
 */
const queueOffline = async (data) => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem('offlineSlaughterQueue')) || [];
    queue.push(data);
    await AsyncStorage.setItem('offlineSlaughterQueue', JSON.stringify(queue));
    console.log('Slaughter record queued offline');
  } catch (err) {
    console.error('Error saving slaughter record offline:', err);
  }
};

/**
 * Sync all queued slaughter records when online
 */
export const syncSlaughterQueue = async () => {
  const net = await Network.getNetworkStateAsync();
  if (!net.isConnected) return;

  try {
    const queue = JSON.parse(await AsyncStorage.getItem('offlineSlaughterQueue')) || [];
    for (const item of queue) {
      try {
        await api.post('/slaughter', item);
      } catch (err) {
        console.error('Failed to sync slaughter record:', err);
      }
    }
    if (queue.length) {
      await AsyncStorage.removeItem('offlineSlaughterQueue');
      console.log('Offline slaughter queue synced successfully.');
    }
  } catch (err) {
    console.error('Error syncing slaughter queue:', err);
  }
};
