import { Link, useLocation } from 'react-router-dom';
import { FlaskConical, Lock, Menu, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, esGestion, logout } = useAuth();
  
  const enCatalogo = location.pathname.startsWith('/reactivos');
  const enMatriz = location.pathname.startsWith('/matriz');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Identidad Institucional */}
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="border border-gray-300 rounded p-1.5 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-gray-800" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-gray-900 tracking-tight text-base">UCSM</span>
              <span className="hidden sm:inline text-gray-500 text-sm">Sistema de Seguridad Química</span>
            </div>
          </Link>
        </div>

        {/* Enlaces de Navegación */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/"
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inicio
          </Link>

          <Link
            to="/reactivos"
            className={`px-3.5 py-1.5 text-sm rounded-lg transition-all ${
              enCatalogo
                ? 'font-semibold text-gray-900 border border-gray-400/80 bg-gray-50/50 shadow-xs'
                : 'font-medium text-gray-600 hover:text-gray-900'
            }`}
          >
            Catálogo de Reactivos
          </Link>
          
          <Link
            to="/mezclas"
            className={`px-3.5 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 ${
              location.pathname === '/mezclas'
                ? 'font-semibold text-gray-900 border border-gray-400/80 bg-gray-50/50 shadow-xs'
                : 'font-medium text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Verificador de Mezclas</span>
            {!isAuthenticated && (
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
          </Link>

          {/* Acceso administrativo condicional: Solo para rol GESTION (RNF-04) */}
          {esGestion && (
            <Link
              to="/matriz"
              className={`px-3.5 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 ${
                enMatriz
                  ? 'font-semibold text-gray-900 border border-gray-400/80 bg-gray-50/50 shadow-xs'
                  : 'font-medium text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-gray-700" />
              <span>Matriz SGA</span>
            </Link>
          )}
        </nav>

        {/* Control de Acceso y Sesión */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-900 leading-tight">
                  {user?.nombres || user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                  {user?.rol}
                </span>
              </div>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              [Iniciar Sesión]
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};