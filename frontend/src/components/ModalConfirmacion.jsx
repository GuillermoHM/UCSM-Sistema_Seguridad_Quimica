import { RotateCcw, Save } from 'lucide-react';

export const ModalConfirmacion = ({
  abierto,
  tipo = 'peligro', // 'peligro' (descartar) o 'accion' (actualizar)
  titulo,
  mensaje,
  textoCancelar = 'Cancelar',
  textoConfirmar = 'Confirmar',
  onCancelar,
  onConfirmar,
  cargando = false
}) => {
  if (!abierto) return null;

  const esPeligro = tipo === 'peligro';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-6 space-y-4">
        
        {/* Encabezado con Icono */}
        <div className="flex items-center gap-2.5 text-gray-900">
          {esPeligro ? (
            <RotateCcw className="w-5 h-5 text-gray-700 stroke-[2.2]" />
          ) : (
            <Save className="w-5 h-5 text-blue-600 stroke-[2.2]" />
          )}
          <h3 className="text-base font-bold tracking-tight">
            {titulo}
          </h3>
        </div>

        {/* Mensaje descriptivo */}
        <p className="text-xs text-gray-500 leading-relaxed">
          {mensaje}
        </p>

        {/* Botonera de acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs ${
              esPeligro
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>

      </div>
    </div>
  );
};