import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays, LogOut, Home, Users, Menu, X } from 'lucide-react';
import { Notificaciones } from './Notificaciones';
import { useState } from 'react';
import logo from '../assets/logo.png';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    ...(user?.rol === 'PSICOLOGO' ? [{ path: '/calendario', icon: CalendarDays, label: 'Calendario' }] : []),
    ...(user?.rol === 'ESTUDIANTE' ? [{ path: '/mis-citas', icon: CalendarDays, label: 'Mis Citas' }] : []),
    ...(user?.rol === 'ADMIN' ? [{ path: '/admin/usuarios', icon: Users, label: 'Admin Usuarios' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Botón hamburguesa */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        aria-label="Menú"
      >
        {sidebarOpen ? <X size={24} className="text-teal-700" /> : <Menu size={24} className="text-teal-700" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-sm shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full pt-16 pb-4">
          <div className="px-4 py-2 border-b border-teal-100">
            <div className="flex items-center gap-2 mb-2">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
              <h2 className="text-xl font-bold text-teal-700">Bienestar</h2>
            </div>
            {/* Nombre del usuario más grande y destacado */}
            <p className="text-lg font-bold text-gray-800 mt-2">{user?.nombre}</p>
            <p className="text-sm text-teal-600 font-medium">{user?.rol}</p>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-xl hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Notificaciones dentro del menú */}
            <Notificaciones inline={true} />
          </nav>
          <div className="px-2 py-4 border-t border-teal-100">
            <button
              onClick={() => { handleLogout(); setSidebarOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido principal */}
      <main className="pt-16 px-4 pb-6">
        <Outlet />
      </main>
    </div>
  );
};