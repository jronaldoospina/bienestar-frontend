import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bienestar-backend-production.up.railway.app/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id) {
    config.headers['X-User-Id'] = user.id;
    config.headers['X-User-Rol'] = user.rol;
  }
  return config;
});

export default api;