import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => {
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-rose-600">Acceso denegado</h1>
      <p className="mt-2">No tienes permisos para ver esta página.</p>
      <Link to="/" className="text-teal-600 underline mt-4 inline-block">Volver al inicio</Link>
    </div>
  );
};