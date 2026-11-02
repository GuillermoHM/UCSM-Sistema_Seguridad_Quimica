import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1. Redirección si no existe sesión activa
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Control de privilegios según rol (RNF-04)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gray-50/50">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Acceso Denegado (403)</h2>
          <p className="text-sm text-gray-600 mb-5">
            Tu perfil actual (<span className="font-semibold text-gray-800">{user?.rol || 'Sin Rol'}</span>) no cuenta con privilegios de Gestión para visualizar o modificar este recurso.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-200"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // 3. Renderizado de vistas hijas autorizadas
  return <Outlet />;
};