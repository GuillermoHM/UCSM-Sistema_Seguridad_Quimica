import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  FlaskConical,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { fetchReactivos } from '../services/reactivoService';
import { evaluarMezclaApi } from '../services/mezclaService';

export const VerificadorMezclas = () => {
  const navigate = useNavigate();

  // Estados de reactivos y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  // Estados de evaluación
  const [evaluando, setEvaluando] = useState(false);
  const [diagnostico, setDiagnostico] = useState(null);
  const [errorEvaluacion, setErrorEvaluacion] = useState(null);

  const wrapperRef = useRef(null);

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Búsqueda predictiva con debounce
  useEffect(() => {
    if (!busqueda.trim()) return;

    let cancelado = false;
    const timer = setTimeout(async () => {
      try {
        setBuscando(true);
        const data = await fetchReactivos(busqueda);
        if (!cancelado) {
          setSugerencias(data || []);
          setMenuAbierto(true);
        }
      } catch (err) {
        console.error('Error buscando reactivos:', err);
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busqueda]);

  // Manejador del cambio de texto: limpia el menú y sugerencias en el evento
  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    if (!valor.trim()) {
      setSugerencias([]);
      setMenuAbierto(false);
    }
  };

  const agregarReactivo = (reactivo) => {
    if (seleccionados.length >= 3) return;
    if (seleccionados.some((r) => r.codigo_institucional === reactivo.codigo_institucional)) return;

    setSeleccionados([...seleccionados, reactivo]);
    setBusqueda('');
    setSugerencias([]); // Reseteo directo en el evento
    setMenuAbierto(false);
    setDiagnostico(null);
  };

  const quitarReactivo = (codigo) => {
    setSeleccionados(seleccionados.filter((r) => r.codigo_institucional !== codigo));
    setDiagnostico(null);
  };

  // Ejecución de la evaluación
  const handleEvaluar = async () => {
    if (seleccionados.length < 2 || seleccionados.length > 3) return;

    try {
      setEvaluando(true);
      setErrorEvaluacion(null);
      const codigos = seleccionados.map((r) => r.codigo_institucional);
      const resultado = await evaluarMezclaApi(codigos);
      setDiagnostico(resultado);
    } catch (err) {
      setErrorEvaluacion(err.message);
    } finally {
      setEvaluando(false);
    }
  };

  const puedeEvaluar = seleccionados.length >= 2 && seleccionados.length <= 3;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {/* Enlace Volver */}
        <button
          onClick={() => navigate('/reactivos')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          Verificador de Compatibilidad de Mezclas
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PANEL IZQUIERDO: SELECTOR Y CONFIGURACIÓN */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tarjeta 1: Buscador de Reactivos */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs relative" ref={wrapperRef}>
              <h2 className="text-sm font-bold text-gray-800 mb-2.5">Agregar Reactivos</h2>
              
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  onFocus={() => busqueda.trim() && setMenuAbierto(true)}
                  disabled={seleccionados.length >= 3}
                  placeholder={seleccionados.length >= 3 ? "Límite alcanzado (máx. 3)" : "Buscar reactivo..."}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                />

                {/* Menú Desplegable Predictivo */}
                {menuAbierto && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto">
                    {buscando ? (
                      <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        Buscando...
                      </div>
                    ) : sugerencias.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No se encontraron reactivos.
                      </div>
                    ) : (
                      sugerencias.map((item) => {
                        const yaAgregado = seleccionados.some(
                          (r) => r.codigo_institucional === item.codigo_institucional
                        );
                        return (
                          <div
                            key={item.codigo_institucional}
                            onClick={() => !yaAgregado && agregarReactivo(item)}
                            className={`flex items-center justify-between px-3.5 py-2.5 text-xs border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                              yaAgregado
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-blue-50/50 text-gray-800'
                            }`}
                          >
                            <div className="flex items-baseline gap-2 truncate pr-2">
                              <span className="font-semibold text-gray-900">{item.nombre_quimico}</span>
                              <span className="text-gray-400 font-mono text-[11px]">{item.numero_cas}</span>
                            </div>
                            <button
                              disabled={yaAgregado}
                              className={`p-1 rounded-md transition-colors ${
                                yaAgregado ? 'text-gray-300' : 'text-gray-400 hover:text-blue-600 hover:bg-white'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-gray-400 mt-2 font-medium">
                Máximo 3 reactivos · {seleccionados.length}/3 seleccionados
              </p>
            </div>

            {/* Tarjeta 2: Lista de Reactivos Seleccionados */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-800 mb-3">Reactivos Seleccionados</h2>

              {seleccionados.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  Sin reactivos seleccionados
                </div>
              ) : (
                <div className="space-y-2.5">
                  {seleccionados.map((item) => (
                    <div
                      key={item.codigo_institucional}
                      className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col gap-1 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900 font-mono">
                          {item.formula_quimica}
                        </span>
                        <button
                          onClick={() => quitarReactivo(item.codigo_institucional)}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      </div>

                      <p className="text-xs text-gray-600">
                        {item.nombre_quimico} · {item.grupo_quimico?.nombre_grupo || 'Reactivo'}
                      </p>

                      <button
                        onClick={() => navigate(`/reactivos/${item.codigo_institucional}`)}
                        className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 font-medium mt-1 w-fit transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver Ficha</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Principal de Evaluación */}
            <div>
              <button
                onClick={handleEvaluar}
                disabled={!puedeEvaluar || evaluando}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                  puedeEvaluar && !evaluando
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-blue-400/60 text-white cursor-not-allowed'
                }`}
              >
                {evaluando ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FlaskConical className="w-4 h-4" />
                )}
                <span>[ Evaluar Compatibilidad ]</span>
              </button>

              <p className="text-[11px] text-gray-500 text-center mt-2 font-medium">
                {seleccionados.length < 2
                  ? 'Seleccione al menos 2 reactivos para evaluar'
                  : 'Listo para evaluar la mezcla seleccionada'}
              </p>
            </div>

            {errorEvaluacion && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {errorEvaluacion}
              </div>
            )}

          </div>

          {/* PANEL DERECHO: ESTADO VACÍO PERMANENTE O RESULTADOS */}
          <div className="lg:col-span-7">
            {!diagnostico ? (
              // Estado Vacío Inicial
              <div className="w-full h-72 sm:h-80 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-transparent">
                <FlaskConical className="w-12 h-12 text-gray-300 stroke-1 mb-3" />
                <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xs leading-relaxed">
                  Seleccione 2 o más reactivos y presione "Evaluar Compatibilidad" para ver el diagnóstico.
                </p>
              </div>
            ) : (
              // Panel de Diagnóstico Activo
              <div className="space-y-4">
                
                {/* 1. Semáforo Global Superior */}
                <div
                  className={`p-5 rounded-2xl border transition-all flex items-start gap-3.5 shadow-xs ${
                    diagnostico.semaforo_global === 'ROJO'
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : diagnostico.semaforo_global === 'AMARILLO'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {diagnostico.semaforo_global === 'ROJO' && (
                      <AlertOctagon className="w-6 h-6 text-red-600" />
                    )}
                    {diagnostico.semaforo_global === 'AMARILLO' && (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    )}
                    {diagnostico.semaforo_global === 'VERDE' && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-tight">
                      {diagnostico.titulo_global}
                    </h3>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {diagnostico.mensaje_global}
                    </p>
                  </div>
                </div>

                {/* 2. Lista de Pares Evaluados */}
                <div className="space-y-3.5">
                  {diagnostico.pares.map((par, idx) => {
                    const sev = par.evaluacion_grupo?.severidad;
                    const esRojo = sev === 'ROJO';
                    const esAmarillo = sev === 'AMARILLO';

                    return (
                      <div
                        key={idx}
                        className={`p-5 bg-white border rounded-2xl shadow-xs transition-all ${
                          esRojo
                            ? 'border-red-200'
                            : esAmarillo
                            ? 'border-amber-200'
                            : 'border-emerald-300'
                        }`}
                      >
                        {/* Cabecera del Par */}
                        <div className="flex items-center gap-2 mb-3">
                          {esRojo ? (
                            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                          ) : esAmarillo ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <h4 className="text-sm font-bold text-gray-900 font-mono">
                            {par.par_titulo}{' '}
                            <span className="text-xs font-normal font-sans text-gray-500">
                              · {par.grupos_titulo}
                            </span>
                          </h4>
                        </div>

                        {/* Bloque A: Criterio por Grupo Químico */}
                        <div className="space-y-1.5 text-xs text-gray-700">
                          <p>
                            <span className="font-semibold text-gray-800">Consecuencias: </span>
                            {par.evaluacion_grupo?.consecuencias}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-800">Severidad: </span>
                            <span
                              className={`font-semibold ${
                                esRojo
                                  ? 'text-red-600'
                                  : esAmarillo
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {par.evaluacion_grupo?.etiqueta}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold text-gray-800">Contramedidas: </span>
                            {par.evaluacion_grupo?.contramedidas}
                          </p>
                        </div>

                        {/* Bloque B: Criterio por Pictogramas SGA (Desacoplado) */}
                        {par.evaluacion_pictogramas?.tiene_restriccion && (
                          <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-start gap-2 text-xs bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900">
                                Advertencia de Segregación SGA:
                              </p>
                              <p className="text-amber-800 mt-0.5">
                                {par.evaluacion_pictogramas.advertencias}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default VerificadorMezclas;