import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  ShieldAlert,
  X,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import {
  fetchMatrizGrupos,
  updateReglaGrupo,
  fetchMatrizPictogramas,
  updateReglaPictograma
} from '../services/matrizService';

export const MatrizIncompatibilidad = () => {
  const navigate = useNavigate();

  // Estados de datos y navegación
  const [tabActiva, setTabActiva] = useState('grupos'); // 'grupos' | 'pictogramas'
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Datos de Grupos
  const [grupos, setGrupos] = useState([]);
  const [reglasGrupos, setReglasGrupos] = useState([]);

  // Datos de Pictogramas
  const [pictogramas, setPictogramas] = useState([]);
  const [reglasPictogramas, setReglasPictogramas] = useState([]);

  // Estado del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [celdaSeleccionada, setCeldaSeleccionada] = useState(null);
  const [formGrupo, setFormGrupo] = useState({ nivel_riesgo: 'Compatible', descripcion: '', medidas: '' });
  const [formPicto, setFormPicto] = useState({ restriccion: '', observaciones: '' });

  // Carga inicial al montar el componente (sin setState síncrono en el efecto)
  useEffect(() => {
    let cancelado = false;

    const inicializar = async () => {
      try {
        const [resGrupos, resPictos] = await Promise.all([
          fetchMatrizGrupos(),
          fetchMatrizPictogramas()
        ]);
        if (!cancelado) {
          setGrupos(resGrupos.grupos || []);
          setReglasGrupos(resGrupos.reglas || []);
          setPictogramas(resPictos.pictogramas || []);
          setReglasPictogramas(resPictos.reglas || []);
          setCargando(false);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err.message);
          setCargando(false);
        }
      }
    };

    inicializar();

    return () => {
      cancelado = true;
    };
  }, []);

  // Función de refresco invocada desde eventos (guardado del modal)
  const recargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);
      const [resGrupos, resPictos] = await Promise.all([
        fetchMatrizGrupos(),
        fetchMatrizPictogramas()
      ]);
      setGrupos(resGrupos.grupos || []);
      setReglasGrupos(resGrupos.reglas || []);
      setPictogramas(resPictos.pictogramas || []);
      setReglasPictogramas(resPictos.reglas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // --- Lógica de cruces para Grupos ---
  const obtenerReglaGrupo = (idA, idB) => {
    return reglasGrupos.find(
      (r) =>
        (r.id_grupo_orig === idA && r.id_grupo_dest === idB) ||
        (r.id_grupo_orig === idB && r.id_grupo_dest === idA)
    );
  };

  const obtenerColorGrupo = (regla, esDiagonal) => {
    if (esDiagonal) return 'bg-slate-100 text-slate-400 border-slate-200';
    if (!regla || !regla.nivel_riesgo) return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80';
    const n = regla.nivel_riesgo.toLowerCase();
    if (n.includes('crítico') || n.includes('critico') || n.includes('severo')) {
      return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200/80 font-bold';
    }
    if (n.includes('moderado')) {
      return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/80 font-semibold';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80';
  };

  // --- Lógica de cruces para Pictogramas ---
  const obtenerReglaPictograma = (idA, idB) => {
    return reglasPictogramas.find(
      (r) =>
        (r.id_picto_orig === idA && r.id_picto_dest === idB) ||
        (r.id_picto_orig === idB && r.id_picto_dest === idA)
    );
  };

  const obtenerColorPicto = (regla, esDiagonal) => {
    if (esDiagonal) return 'bg-slate-100 text-slate-400 border-slate-200';
    if (!regla || !regla.restriccion) return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80';
    const r = regla.restriccion.toLowerCase();
    if (r.includes('prohibido') || r.includes('incompatible') || r.includes('no almacenar')) {
      return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200/80 font-bold';
    }
    return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/80 font-semibold';
  };

  // --- Apertura del Modal ---
  const handleAbrirCelda = (itemA, itemB, tipo) => {
    const esDiagonal = itemA.id === itemB.id;
    if (esDiagonal) return; // La diagonal principal (mismo elemento) no requiere edición

    setCeldaSeleccionada({ itemA, itemB, tipo });

    if (tipo === 'grupos') {
      const regla = obtenerReglaGrupo(itemA.id, itemB.id);
      setFormGrupo({
        nivel_riesgo: regla ? regla.nivel_riesgo : 'Compatible',
        descripcion: regla ? regla.descripcion || '' : '',
        medidas: regla ? regla.medidas || '' : ''
      });
    } else {
      const regla = obtenerReglaPictograma(itemA.id, itemB.id);
      setFormPicto({
        restriccion: regla ? regla.restriccion || '' : '',
        observaciones: regla ? regla.observaciones || '' : ''
      });
    }
    setModalAbierto(true);
  };

  // --- Guardado Simétrico ---
  const handleGuardarModal = async (e) => {
    e.preventDefault();
    if (!celdaSeleccionada) return;

    try {
      setGuardando(true);
      const { itemA, itemB, tipo } = celdaSeleccionada;

      if (tipo === 'grupos') {
        await updateReglaGrupo({
          id_grupo_orig: itemA.id,
          id_grupo_dest: itemB.id,
          nivel_riesgo: formGrupo.nivel_riesgo,
          descripcion: formGrupo.descripcion,
          medidas: formGrupo.medidas
        });
      } else {
        await updateReglaPictograma({
          id_picto_orig: itemA.id,
          id_picto_dest: itemB.id,
          restriccion: formPicto.restriccion,
          observaciones: formPicto.observaciones
        });
      }

      await recargarDatos();
      setModalAbierto(false);
    } catch (err) {
      alert('Error al guardar regla: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* Cabecera y Navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/reactivos')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Catálogo
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Matriz Interactiva de Incompatibilidad
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Consulta y gestión de reglas de reactividad química y segregación de almacenamiento.
            </p>
          </div>

          {/* Selector de Pestañas (Tabs) */}
          <div className="inline-flex bg-gray-200/80 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setTabActiva('grupos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tabActiva === 'grupos'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Grupos Químicos</span>
            </button>
            <button
              onClick={() => setTabActiva('pictogramas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tabActiva === 'pictogramas'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Pictogramas SGA</span>
            </button>
          </div>
        </div>

        {/* Leyenda Visual */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-gray-700">Leyenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Incompatible / Crítico / Prohibido</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-gray-600">Precaución / Restringido / Moderado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-gray-600">Compatible / Almacenamiento Conjunto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300"></span>
            <span className="text-gray-400">Diagonal (Mismo elemento)</span>
          </div>
        </div>

        {/* Contenedor de la Matriz Tabular */}
        {cargando ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Cargando datos matriciales...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
              
              {tabActiva === 'grupos' ? (
                // TABLA: GRUPOS QUÍMICOS (Corregida para móvil)
                <table className="min-w-full text-center border-separate border-spacing-0">
                  <thead className="bg-slate-100 sticky top-0 z-20">
                    <tr>
                      <th className="p-3 text-xs font-bold text-gray-600 text-left sticky left-0 top-0 bg-slate-100 z-30 min-w-[160px] max-w-[160px] border-b border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                        Grupo Químico
                      </th>
                      {grupos.map((g) => (
                        <th
                          key={g.id_grupo}
                          className="p-3 text-xs font-bold text-gray-700 min-w-[120px] max-w-[140px] truncate border-b border-gray-200 bg-slate-100"
                          title={g.nombre_grupo}
                        >
                          {g.nombre_grupo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {grupos.map((fila) => (
                      <tr key={fila.id_grupo} className="hover:bg-slate-50/50">
                        {/* Columna fija con z-10 y fondo blanco sólido */}
                        <td
                          className="p-3 font-semibold text-gray-800 text-left sticky left-0 bg-white z-10 border-r border-b border-gray-200 truncate max-w-[160px] shadow-[1px_0_0_0_#e5e7eb]"
                          title={fila.nombre_grupo}
                        >
                          {fila.nombre_grupo}
                        </td>
                        {grupos.map((col) => {
                          const esDiag = fila.id_grupo === col.id_grupo;
                          const regla = obtenerReglaGrupo(fila.id_grupo, col.id_grupo);
                          const claseColor = obtenerColorGrupo(regla, esDiag);
                          const etiqueta = esDiag
                            ? '-'
                            : regla?.nivel_riesgo || 'Compatible';

                          return (
                            <td key={col.id_grupo} className="p-1.5 border-b border-gray-100">
                              <button
                                disabled={esDiag}
                                onClick={() => handleAbrirCelda(
                                  { id: fila.id_grupo, nombre: fila.nombre_grupo },
                                  { id: col.id_grupo, nombre: col.nombre_grupo },
                                  'grupos'
                                )}
                                className={`w-full py-2 px-1 rounded-lg border text-[11px] transition-all cursor-pointer ${claseColor} ${
                                  esDiag ? 'cursor-not-allowed opacity-60' : ''
                                }`}
                                title={!esDiag ? `${fila.nombre_grupo} × ${col.nombre_grupo}: ${etiqueta}` : ''}
                              >
                                {etiqueta}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // TABLA: PICTOGRAMAS SGA (Corregida para móvil)
                <table className="min-w-full text-center border-separate border-spacing-0">
                  <thead className="bg-slate-100 sticky top-0 z-20">
                    <tr>
                      <th className="p-3 text-xs font-bold text-gray-600 text-left sticky left-0 top-0 bg-slate-100 z-30 min-w-[170px] max-w-[170px] border-b border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                        Pictograma SGA
                      </th>
                      {pictogramas.map((p) => (
                        <th
                          key={p.id_pictograma}
                          className="p-2.5 text-xs font-bold text-gray-700 min-w-[110px] border-b border-gray-200 bg-slate-100"
                        >
                          <div className="flex flex-col items-center gap-1">
                            {p.url_icon && (
                              <img src={p.url_icon} alt={p.cod_ghs} className="w-6 h-6 object-contain" />
                            )}
                            <span className="font-mono text-[11px]">{p.cod_ghs}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {pictogramas.map((fila) => (
                      <tr key={fila.id_pictograma} className="hover:bg-slate-50/50">
                        {/* Columna fija con z-10 y fondo blanco sólido */}
                        <td className="p-3 font-semibold text-gray-800 text-left sticky left-0 bg-white z-10 border-r border-b border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                          <div className="flex items-center gap-2">
                            {fila.url_icon && (
                              <img src={fila.url_icon} alt={fila.cod_ghs} className="w-5 h-5 object-contain shrink-0" />
                            )}
                            <span className="truncate max-w-[120px]" title={fila.peligro}>
                              {fila.cod_ghs} · {fila.peligro}
                            </span>
                          </div>
                        </td>
                        {pictogramas.map((col) => {
                          const esDiag = fila.id_pictograma === col.id_pictograma;
                          const regla = obtenerReglaPictograma(fila.id_pictograma, col.id_pictograma);
                          const claseColor = obtenerColorPicto(regla, esDiag);
                          const etiqueta = esDiag
                            ? '-'
                            : regla?.restriccion ? 'Restringido' : 'Permitido';

                          return (
                            <td key={col.id_pictograma} className="p-1.5 border-b border-gray-100">
                              <button
                                disabled={esDiag}
                                onClick={() => handleAbrirCelda(
                                  { id: fila.id_pictograma, nombre: `${fila.cod_ghs} (${fila.peligro})` },
                                  { id: col.id_pictograma, nombre: `${col.cod_ghs} (${col.peligro})` },
                                  'pictogramas'
                                )}
                                className={`w-full py-2 px-1 rounded-lg border text-[11px] transition-all cursor-pointer ${claseColor} ${
                                  esDiag ? 'cursor-not-allowed opacity-60' : ''
                                }`}
                                title={!esDiag ? `${fila.cod_ghs} × ${col.cod_ghs}: ${regla?.restriccion || 'Permitido'}` : ''}
                              >
                                {etiqueta}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        )}

      </main>

      {/* MODAL DE EDICIÓN / DETALLE SIMÉTRICO */}
      {modalAbierto && celdaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  {celdaSeleccionada.tipo === 'grupos' ? 'Regla de Grupo Químico' : 'Regla de Pictograma SGA'}
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cruce involucrado */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-gray-800">Interacción Simétrica:</p>
              <p className="text-gray-600 font-medium">
                {celdaSeleccionada.itemA.nombre} <span className="font-bold text-blue-600">⇄</span> {celdaSeleccionada.itemB.nombre}
              </p>
            </div>

            {/* Formulario Dinámico según la pestaña activa */}
            <form onSubmit={handleGuardarModal} className="space-y-4 text-xs">
              
              {celdaSeleccionada.tipo === 'grupos' ? (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nivel de Riesgo (Semáforo):</label>
                    <select
                      value={formGrupo.nivel_riesgo}
                      onChange={(e) => setFormGrupo({ ...formGrupo, nivel_riesgo: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Compatible">Compatible (Sin riesgo / Verde)</option>
                      <option value="Moderado">Moderado (Precaución / Amarillo)</option>
                      <option value="Severo">Severo (Incompatible / Rojo)</option>
                      <option value="Crítico">Crítico (Incompatible / Rojo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Descripción / Consecuencias:</label>
                    <textarea
                      rows={2}
                      value={formGrupo.descripcion}
                      onChange={(e) => setFormGrupo({ ...formGrupo, descripcion: e.target.value })}
                      placeholder="Ej. Reacción exotérmica con desprendimiento de calor..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Medidas Preventivas / Contramedidas:</label>
                    <textarea
                      rows={2}
                      value={formGrupo.medidas}
                      onChange={(e) => setFormGrupo({ ...formGrupo, medidas: e.target.value })}
                      placeholder="Ej. Almacenar en armarios ignífugos separados..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Restricción de Almacenamiento:</label>
                    <input
                      type="text"
                      value={formPicto.restriccion}
                      onChange={(e) => setFormPicto({ ...formPicto, restriccion: e.target.value })}
                      placeholder="Ej. Almacenamiento Conjunto Prohibido (Vacío para Permitido)"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Observaciones / Segregación:</label>
                    <textarea
                      rows={2}
                      value={formPicto.observaciones}
                      onChange={(e) => setFormPicto({ ...formPicto, observaciones: e.target.value })}
                      placeholder="Ej. Requiere barrera física de separación preventiva..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  {guardando ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Regla Simétrica</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default MatrizIncompatibilidad;