import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { CitasPage } from './pages/CitasPage';
import { AdminUsuariosPage } from './pages/AdminUsuariosPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Componente que decide la redirección inicial después del login
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  let redirectTo = '/unauthorized';
  if (user.rol === 'PSICOLOGO') redirectTo = '/calendario';
  else if (user.rol === 'ESTUDIANTE') redirectTo = '/mis-citas';
  else if (user.rol === 'ADMIN') redirectTo = '/admin/usuarios';
  return <Navigate to={redirectTo} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<RootRedirect />} />
            <Route path="calendario" element={<ProtectedRoute allowedRoles={['PSICOLOGO', 'ADMIN']}><CalendarPage /></ProtectedRoute>} />
            <Route path="mis-citas" element={<ProtectedRoute allowedRoles={['ESTUDIANTE']}><CitasPage /></ProtectedRoute>} />
            <Route path="admin/usuarios" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsuariosPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;