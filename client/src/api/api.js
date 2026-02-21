import axios from 'axios'

const getAdminToken = () => {
  try {
    return localStorage.getItem('adminToken')
  } catch {
    return null
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use(
  (config) => {
    const token = getAdminToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api