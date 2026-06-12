import axios from 'axios';

// URL FIJA DEL BACKEND - IGNORA LA VARIABLE DE ENTORNO
const API_URL = 'https://bienestar-backend-production.up.railway.app/api';

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