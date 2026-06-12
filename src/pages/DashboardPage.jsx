import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom'; 
export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pendientes: 0, completadas: 0 });
  const [citasPorDia, setCitasPorDia] = useState([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      let citas = [];
      if (user.rol === 'ESTUDIANTE') {
        const res = await api.get(`/citas/estudiante/${user.id}/futuras`);
        citas = res.data;
      } else if (user.rol === 'PSICOLOGO') {
        const res = await api.get(`/citas/psicologo/${user.id}/futuras`);
        citas = res.data;
      } else if (user.rol === 'ADMIN') {
        const res = await api.get('/citas');
        citas = res.data;
      }
      const total = citas.length;
      const pendientes = citas.filter(c => c.estado === 'PROGRAMADA').length;
      const completadas = citas.filter(c => c.estado === 'COMPLETADA').length;
      setStats({ total, pendientes, completadas });

      // Agrupar citas por día (últimos 7 días)
      const ultimos7Dias = [...Array(7)].map((_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        return fecha.toISOString().split('T')[0];
      }).reverse();
      const counts = ultimos7Dias.map(dia => ({
        dia: dia.slice(5),
        citas: citas.filter(c => c.fechaHora.split('T')[0] === dia).length
      }));
      setCitasPorDia(counts);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Bienvenido, {user?.nombre}</h1>
      <p className="text-gray-600">Rol: {user?.rol}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <Calendar className="text-blue-500" size={40} />
          <div>
            <p className="text-gray-500">Total de citas</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <Clock className="text-yellow-500" size={40} />
          <div>
            <p className="text-gray-500">Pendientes</p>
            <p className="text-3xl font-bold">{stats.pendientes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <CheckCircle className="text-green-500" size={40} />
          <div>
            <p className="text-gray-500">Completadas</p>
            <p className="text-3xl font-bold">{stats.completadas}</p>
          </div>
        </div>
      </div>

      {citasPorDia.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Citas por día (última semana)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={citasPorDia}>
              <XAxis dataKey="dia" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="citas" fill="#3b82f6" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {user.rol === 'ESTUDIANTE' && (
        <div className="mt-6">
          <Link to="/mis-citas" className="btn-primary inline-block">Ver mis citas</Link>
        </div>
      )}
      {user.rol === 'PSICOLOGO' && (
        <div className="mt-6">
          <Link to="/calendario" className="btn-primary inline-block">Ir al calendario</Link>
        </div>
      )}
    </div>
  );
};