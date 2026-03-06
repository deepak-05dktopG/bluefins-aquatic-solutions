/**
 * What it is: Client-side API helper (Axios instance).
 * Non-tech note: This file helps the website talk to the backend server.
 */

import axios from 'axios'

// Reads the stored JWT admin token from localStorage for API authentication
const getAdminToken = () => {
  try {
    return localStorage.getItem('adminToken')
  } catch {
    return null
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use(
  // Attaches the admin JWT token as a Bearer header to every outgoing API request
  config => {
    const token = getAdminToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  // Passes through request errors unchanged
  error => {
    return Promise.reject(error);
  }
)

export default api