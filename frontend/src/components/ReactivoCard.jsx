import { ArrowRight } from 'lucide-react';

export const ReactivoCard = ({ reactivo, onVerFicha }) => {
  const pictogramas = reactivo.pictogramas || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Cabecera: Nombre y Código */}
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-bold text-gray-900 text-lg leading-snug">
            {reactivo.nombre_quimico}
          </h3>
          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded border border-gray-200 shrink-0">
            {reactivo.codigo_institucional}
          </span>
        </div>

        {/* CAS y Fórmula */}
        <div className="text-xs text-gray-500 font-mono mb-3">
          <span>CAS: {reactivo.numero_cas}</span>
          <span className="ml-3 font-semibold text-gray-700">{reactivo.formula_quimica}</span>
        </div>

        {/* Grupo Químico */}
        <div className="mb-4">
          <span className="inline-block text-xs text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200 font-medium">
            {reactivo.grupo_quimico?.nombre_grupo || 'Reactivo General'}
          </span>
        </div>

        {/* Pictogramas SGA oficiales desde /public/pictogramas/ */}
        <div className="flex items-center gap-3 my-3 min-h-[44px]">
          {pictogramas.length > 0 ? (
            pictogramas.map((pic) => (
              <img
                key={pic.id_pictograma || pic.cod_ghs}
                src={pic.url_icon}
                alt={pic.peligro}
                title={`${pic.cod_ghs}: ${pic.peligro}`}
                className="w-10 h-10 object-contain drop-shadow-xs"
                onError={(e) => {
                  // Respaldo visual en caso de que falte algún SVG en public
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">Sin pictogramas asignados</span>
          )}
        </div>
      </div>

      {/* Botón de acción */}
      <button
        onClick={() => onVerFicha(reactivo.codigo_institucional)}
        className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <span>Ver Ficha Completa</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};