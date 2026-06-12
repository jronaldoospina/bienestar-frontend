import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';

export const Notificaciones = ({ inline = false }) => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (user) cargarNotificaciones();
  }, [user]);

  const cargarNotificaciones = async () => {
    try {
      const res = await api.get(`/usuarios/${user.id}`);
      setNotificaciones(res.data.notificaciones || []);
      const pendientes = (res.data.notificaciones || []).filter(n => !n.leida).length;
      setNoLeidas(pendientes);
    } catch (error) {
      // Manejo de error 400: si el usuario no existe en BD, no mostramos nada
      if (error.response?.status !== 400) console.error('Error cargando notificaciones', error);
      setNotificaciones([]);
      setNoLeidas(0);
    }
  };

  const marcarComoLeida = async (index) => {
    const notif = notificaciones[index];
    if (notif.leida) return;
    notif.leida = true;
    // Actualización optimista
    setNotificaciones([...notificaciones]);
    setNoLeidas(noLeidas - 1);
    try {
      await api.put(`/usuarios/${user.id}`, { notificaciones });
    } catch (error) {
      // Revertir en caso de error (opcional, pero mejora experiencia)
      notif.leida = false;
      setNotificaciones([...notificaciones]);
      setNoLeidas(noLeidas);
      console.error('Error al marcar como leída', error);
    }
  };

  // Versión inline para el sidebar
  if (inline) {
    return (
      <div className="w-full">
        <button
          onClick={() => setMostrar(!mostrar)}
          className="flex items-center justify-between w-full px-3 py-2 text-gray-700 rounded-xl hover:bg-teal-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell size={20} />
            <span>Notificaciones</span>
            {noLeidas > 0 && (
              <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {noLeidas}
              </span>
            )}
          </div>
          {mostrar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {mostrar && (
          <div className="mt-2 bg-white border border-teal-100 rounded-xl shadow-inner max-h-60 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">No hay notificaciones</div>
            ) : (
              notificaciones.map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-3 border-b border-teal-50 cursor-pointer hover:bg-teal-50 ${!notif.leida ? 'bg-teal-50/50' : ''}`}
                  onClick={() => marcarComoLeida(idx)}
                >
                  <p className="text-sm text-gray-800">{notif.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.fecha).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // Versión original para escritorio (flotante)
  return (
    <div className="relative">
      <button onClick={() => setMostrar(!mostrar)} className="relative hover:underline flex items-center gap-1 text-white">
        <Bell size={18} />
        {noLeidas > 0 && (
          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {noLeidas}
          </span>
        )}
        Notificaciones
      </button>
      {mostrar && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2 font-bold border-b bg-gray-50 text-gray-800">Notificaciones</div>
          {notificaciones.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
          ) : (
            notificaciones.map((notif, idx) => (
              <div
                key={idx}
                className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${!notif.leida ? 'bg-blue-50' : 'bg-white'}`}
                onClick={() => marcarComoLeida(idx)}
              >
                <p className="text-sm text-gray-800">{notif.mensaje}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.fecha).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};