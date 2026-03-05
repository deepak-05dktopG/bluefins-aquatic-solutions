/**
 * What it is: Client-side API helper (Axios instance).
 * Non-tech note: This file helps the website talk to the backend server.
 */

import axios from 'axios'

/**
 * Purpose: Get Admin Token
 * Plain English: What this function is used for.
 */
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
  /**
   * Purpose: Helper callback used inside a larger operation
   * Plain English: What this function is used for.
   */
  config => {
    const token = getAdminToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  /**
   * Purpose: Helper callback used inside a larger operation
   * Plain English: What this function is used for.
   */
  error => {
    return Promise.reject(error);
  }
)

export default api