import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MessageCircle, RefreshCw, XCircle } from 'lucide-react';

export const CitasPage = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);

  useEffect(() => { cargarCitas(); }, []);

  const cargarCitas = async () => {
    const res = await api.get(`/citas/estudiante/${user.id}/futuras`);
    setCitas(res.data);
  };

  const solicitarReasignacion = async (citaId) => {
    const motivo = prompt('Motivo de la reasignación:');
    if (!motivo) return;
    try {
      await api.post(`/citas/${citaId}/solicitar-reasignacion`, { motivo });
      alert('Solicitud enviada al psicólogo');
      cargarCitas();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const solicitarCancelacion = async (citaId) => {
    if (!confirm('¿Confirmas cancelar esta cita?')) return;
    try {
      await api.post(`/citas/${citaId}/solicitar-cancelacion`);
      alert('Solicitud de cancelación enviada');
      cargarCitas();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Mis citas próximas</h2>
      {citas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No tienes citas programadas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {citas.map(cita => (
            <div key={cita.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">ID: {cita.id}</p>
                    <h3 className="text-lg font-bold mt-1">Cita con psicólogo</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    cita.estado === 'PROGRAMADA' ? 'bg-green-100 text-green-800' :
                    cita.estado === 'CANCELACION_SOLICITADA' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{cita.estado}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span>{new Date(cita.fechaHora).toLocaleDateString()}</span>
                    <Clock size={16} className="ml-2" />
                    <span>{new Date(cita.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MessageCircle size={16} className="mt-0.5" />
                    <p className="text-sm">{cita.motivo}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => solicitarReasignacion(cita.id)}
                    disabled={cita.solicitudReasignacion || cita.estado !== 'PROGRAMADA'}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      cita.solicitudReasignacion || cita.estado !== 'PROGRAMADA'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    } transition-colors`}
                  >
                    <RefreshCw size={14} /> Reasignar
                  </button>
                  <button
                    onClick={() => solicitarCancelacion(cita.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    <XCircle size={14} /> Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};