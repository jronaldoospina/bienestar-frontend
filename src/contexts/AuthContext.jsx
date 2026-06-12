import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        api.defaults.headers.common['X-User-Id'] = userData.id;
        api.defaults.headers.common['X-User-Rol'] = userData.rol;
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const userData = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      api.defaults.headers.common['X-User-Id'] = userData.id;
      api.defaults.headers.common['X-User-Rol'] = userData.rol;
      return { success: true };
    } catch (error) {
      let errorMsg = 'Credenciales inválidas';
      
      if (error.response) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data && typeof data === 'object') {
          errorMsg = data.message || data.error || JSON.stringify(data);
        }
      } else if (error.request) {
        errorMsg = 'No se pudo conectar con el servidor';
      } else {
        errorMsg = error.message || 'Error desconocido';
      }
      
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    delete api.defaults.headers.common['X-User-Id'];
    delete api.defaults.headers.common['X-User-Rol'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};