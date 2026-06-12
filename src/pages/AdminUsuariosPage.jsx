import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AdminUsuariosPage = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'ESTUDIANTE',
    especialidad: '',
    duracionCitaMinutos: 60
  });

  if (user?.rol !== 'ADMIN') {
    return <div className="text-center p-8 text-rose-600">Acceso denegado</div>;
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error(error);
      alert('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (usuarioEditando) {
        await api.put(`/usuarios/${usuarioEditando.id}`, formData);
        alert('Usuario actualizado');
      } else {
        await api.post('/usuarios', formData);
        alert('Usuario creado exitosamente');
      }
      setMostrarForm(false);
      setUsuarioEditando(null);
      setFormData({
        id: '', nombre: '', email: '', telefono: '', password: '',
        rol: 'ESTUDIANTE', especialidad: '', duracionCitaMinutos: 60
      });
      cargarUsuarios();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      alert('Usuario eliminado');
      cargarUsuarios();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const editarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      password: '',
      rol: usuario.rol,
      especialidad: usuario.especialidad || '',
      duracionCitaMinutos: usuario.duracionCitaMinutos || 60
    });
    setMostrarForm(true);
  };

  const getRoleBadgeClass = (rol) => {
    switch (rol) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'PSICOLOGO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-teal-800">Administración de Usuarios</h1>
        <button
          onClick={() => {
            setUsuarioEditando(null);
            setFormData({
              id: '', nombre: '', email: '', telefono: '', password: '',
              rol: 'ESTUDIANTE', especialidad: '', duracionCitaMinutos: 60
            });
            setMostrarForm(true);
          }}
          className="btn btn-primary"
        >
          + Nuevo Usuario
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-teal-700 mb-4">
            {usuarioEditando ? 'Editar Usuario' : 'Crear Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cédula / ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                required
                disabled={!!usuarioEditando}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo institucional (@unicesar.edu.co)</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                required={!usuarioEditando}
                placeholder={usuarioEditando ? 'Dejar en blanco para no cambiar' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value})}
                className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
              >
                <option value="ESTUDIANTE">ESTUDIANTE</option>
                <option value="PSICOLOGO">PSICOLOGO</option>
              </select>
            </div>

            {formData.rol === 'PSICOLOGO' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialidad</label>
                  <input
                    type="text"
                    value={formData.especialidad}
                    onChange={e => setFormData({...formData, especialidad: e.target.value})}
                    className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duración de cita (minutos)</label>
                  <input
                    type="number"
                    value={formData.duracionCitaMinutos}
                    onChange={e => setFormData({...formData, duracionCitaMinutos: parseInt(e.target.value)})}
                    className="w-full border border-teal-200 rounded-xl p-2 focus:ring-2 focus:ring-teal-300"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {usuarioEditando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {cargando ? (
        <p className="text-teal-600 text-center">Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
          <table className="min-w-full">
            <thead className="bg-teal-50">
              <tr>
                <th className="px-4 py-2 text-left text-teal-800">ID</th>
                <th className="px-4 py-2 text-left text-teal-800">Nombre</th>
                <th className="px-4 py-2 text-left text-teal-800">Email</th>
                <th className="px-4 py-2 text-left text-teal-800">Rol</th>
                <th className="px-4 py-2 text-left text-teal-800">Teléfono</th>
                <th className="px-4 py-2 text-left text-teal-800">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id} className="border-t border-teal-100 hover:bg-teal-50/30 transition-colors">
                  <td className="px-4 py-2 text-gray-700">{usuario.id}</td>
                  <td className="px-4 py-2 text-gray-700">{usuario.nombre}</td>
                  <td className="px-4 py-2 text-gray-700">{usuario.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{usuario.telefono}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => editarUsuario(usuario)}
                      className="btn btn-secondary text-sm mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(usuario.id)}
                      className="btn btn-danger text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};