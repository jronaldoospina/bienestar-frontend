import axios from 'axios';

// Usar la variable de entorno o fallback a la URL del backend
const API_URL = import.meta.env.VITE_API_URL || 'https://bienestar-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para headers
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id) {
    config.headers['X-User-Id'] = user.id;
    config.headers['X-User-Rol'] = user.rol;
  }
  return config;
});

export default api;