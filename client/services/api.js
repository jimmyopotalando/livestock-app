// client/services/api.js
import axios from 'axios';

// ⚠️ Replace with your backend server's local IP
const BASE_URL = 'http://192.168.1.4:5000/api';

// Register a new animal
export const registerAnimal = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
};

// Verify an animal by image
export const verifyAnimal = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/verify`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error.response?.data || error.message);
    throw error;
  }
};

// Report unregistered or suspicious animal
export const reportUnregisteredAnimal = async (alertData) => {
  try {
    const response = await axios.post(`${BASE_URL}/alert`, alertData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to report alert:', error.response?.data || error.message);
    throw error;
  }
};
