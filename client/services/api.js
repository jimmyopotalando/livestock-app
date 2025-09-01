// api.js
import axios from 'axios';

// ⚠️ Replace with your backend server's URL
const BASE_URL = 'http://127.0.0.1:5000';

export const registerAnimal = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const verifyAnimal = async (formData) => {
  try {
    const response = await axios.post(`${BASE_URL}/verify`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
};

export const reportUnregisteredAnimal = async (alertData) => {
  try {
    const response = await axios.post(`${BASE_URL}/alert`, alertData);
    return response.data;
  } catch (error) {
    console.error('Failed to report alert:', error);
    throw error;
  }
};
