import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to ensure headers are always present
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id) {
    config.headers['X-User-Id'] = user.id;
    config.headers['X-User-Rol'] = user.rol;
  }
  return config;
});

export default api;