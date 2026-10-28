import { Link, useLocation } from 'react-router-dom';
import { FlaskConical, Lock, Menu } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const enCatalogo = location.pathname.startsWith('/reactivos');

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
          <button className="px-3 py-1.5 text-sm text-gray-400 font-medium flex items-center gap-1.5 cursor-not-allowed">
            Verificador de Mezclas <Lock className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </nav>

        {/* Acceso */}
        <div>
          <button className="px-3.5 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            [Iniciar Sesión]
          </button>
        </div>

      </div>
    </header>
  );
};