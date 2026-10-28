import { FlaskConical, Lock, Menu } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Identidad Institucional */}
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="border border-gray-300 rounded p-1.5 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-gray-800" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-gray-900 tracking-tight text-base">UCSM</span>
              <span className="hidden sm:inline text-gray-500 text-sm">Sistema de Seguridad Química</span>
            </div>
          </div>
        </div>

        {/* Enlaces de Navegación (Escritorio) */}
        <nav className="hidden md:flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium">
            Inicio
          </button>
          <button className="px-3.5 py-1.5 text-sm font-semibold text-gray-900 border border-gray-400/80 rounded-lg bg-gray-50/50 shadow-sm">
            Catálogo de Reactivos
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5">
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