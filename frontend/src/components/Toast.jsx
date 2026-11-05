import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const Toast = ({ mensaje, tipo = 'exito', visible, onClose, duracion = 4000 }) => {
  useEffect(() => {
    if (visible && duracion) {
      const timer = setTimeout(() => {
        onClose();
      }, duracion);
      return () => clearTimeout(timer);
    }
  }, [visible, duracion, onClose]);

  if (!visible) return null;

  const esExito = tipo === 'exito';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-200 animate-in slide-in-from-bottom-3 duration-200 max-w-md">
      {esExito ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
      )}

      <p className="text-xs font-medium text-gray-800 leading-snug">
        {mensaje}
      </p>

      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors ml-auto cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};