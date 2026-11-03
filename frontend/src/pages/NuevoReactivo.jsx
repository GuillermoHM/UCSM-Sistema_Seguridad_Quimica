import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Info
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
// Reemplaza las dos líneas que daban error por esta sola importación:
import {
  extraerFdsApi,
  crearReactivoApi,
  fetchGruposQuimicos,
  fetchPictogramas,
  fetchEpps,
  fetchMateriales
} from '../services/reactivoService';

export const NuevoReactivo = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Control de flujo del Wizard
  const [pasoActual, setPasoActual] = useState(1);
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');

  // Registro de campos poblados por IA para aplicar borde verde
  const [reconocidosPorIA, setReconocidosPorIA] = useState({});

  // Catálogos maestros desde la base de datos
  const [catalogos, setCatalogos] = useState({
    grupos: [],
    pictogramas: [],
    epps: [],
    materiales: []
  });

  // Estado unificado del reactivo
  const [formData, setFormData] = useState({
    numero_cas: '',
    codigo_institucional: '',
    nombre_quimico: '',
    nombre_comercial: '',
    formula_quimica: '',
    masa_molar: '',
    concentracion: '',
    presentacion: '',
    id_grupo: '',
    pictogramas_ids: [],
    materiales_ids: [],
    epp_ids: [],
    condiciones_almac: '',
    resumen_epp_texto: '',
    // Listas dinámicas ordenables (JSONB arrays)
    proc_trasvase: ['Manipular exclusivamente en campana extractora de gases.'],
    primeros_aux: ['Inhalación: trasladar al aire libre inmediatamente.'],
    control_incendio: ['Usar polvo químico seco, CO2 o espuma adecuada según el entorno.'],
    control_derrame: ['Absorber con material inerte (arena seca o neutralizante). No verter al desagüe.']
  });

  // Carga inicial de catálogos mediante fetch
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [grupos, pictogramas, epps, materiales] = await Promise.all([
          fetchGruposQuimicos(),
          fetchPictogramas(),
          fetchEpps(),
          fetchMateriales()
        ]);
        setCatalogos({ grupos, pictogramas, epps, materiales });
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    };
    cargarCatalogos();
  }, []);

  // Manejador del archivo PDF
  const handleFileChange = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrorGlobal('El archivo debe ser un documento PDF válido.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorGlobal('El archivo excede el límite máximo de 10 MB.');
      return;
    }
    setArchivoPdf(file);
    setErrorGlobal('');
  };

  // Disparo de extracción asistida con Gemini (Paso 1)
  const ejecutarExtraccionIA = async () => {
    if (!archivoPdf) {
      setErrorGlobal('Por favor selecciona o arrastra una FDS en PDF primero.');
      return;
    }

    setProcesandoIA(true);
    setErrorGlobal('');

    try {
      const res = await extraerFdsApi(archivoPdf);
      const extraido = res.data;

      // Mapear pictogramas extraídos a IDs locales
      const codigosGhs = extraido.pictogramas_sga || [];
      const idsPicto = catalogos.pictogramas
        .filter((p) => codigosGhs.includes(p.cod_ghs))
        .map((p) => p.id_pictograma);

      // Convertir strings extraídos a listas de pasos si vienen poblados
      const listaPrimerosAux = extraido.primeros_aux
        ? extraido.primeros_aux.split('. ').filter(Boolean).map((s) => s.trim())
        : formData.primeros_aux;

      const listaIncendio = extraido.control_incendio
        ? [extraido.control_incendio]
        : formData.control_incendio;

      const listaDerrame = extraido.control_derrame
        ? [extraido.control_derrame]
        : formData.control_derrame;

      const listaTrasvase = extraido.proc_trasvase
        ? [extraido.proc_trasvase]
        : formData.proc_trasvase;

      setFormData((prev) => ({
        ...prev,
        numero_cas: extraido.numero_cas || prev.numero_cas,
        nombre_quimico: extraido.nombre_quimico || prev.nombre_quimico,
        nombre_comercial: extraido.nombre_comercial || prev.nombre_comercial,
        formula_quimica: extraido.formula_quimica || prev.formula_quimica,
        masa_molar: extraido.masa_molar ? String(extraido.masa_molar) : prev.masa_molar,
        concentracion: extraido.concentracion || prev.concentracion,
        presentacion: extraido.presentacion !== 'No especificada' ? extraido.presentacion : prev.presentacion,
        pictogramas_ids: idsPicto,
        condiciones_almac: extraido.condiciones_almac || prev.condiciones_almac,
        resumen_epp_texto: extraido.resumen_epp_texto || '',
        proc_trasvase: listaTrasvase,
        primeros_aux: listaPrimerosAux,
        control_incendio: listaIncendio,
        control_derrame: listaDerrame
      }));

      // Marcar campos autocompletados para feedback visual verde
      setReconocidosPorIA({
        numero_cas: !!extraido.numero_cas,
        nombre_quimico: !!extraido.nombre_quimico,
        formula_quimica: !!extraido.formula_quimica,
        masa_molar: !!extraido.masa_molar,
        concentracion: !!extraido.concentracion,
        presentacion: !!extraido.presentacion
      });

      setPasoActual(2);
    } catch (err) {
      setErrorGlobal(err.response?.data?.mensaje || err.message || 'Error durante la extracción asistida.');
    } finally {
      setProcesandoIA(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (campo, id) => {
    setFormData((prev) => {
      const lista = prev[campo];
      return lista.includes(id)
        ? { ...prev, [campo]: lista.filter((item) => item !== id) }
        : { ...prev, [campo]: [...lista, id] };
    });
  };

  // Funciones de ordenamiento y edición para listas dinámicas (Paso 3 y 4)
  const agregarPasoLista = (campo) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: [...prev[campo], '']
    }));
  };

  const actualizarPasoLista = (campo, index, valor) => {
    setFormData((prev) => {
      const copia = [...prev[campo]];
      copia[index] = valor;
      return { ...prev, [campo]: copia };
    });
  };

  const eliminarPasoLista = (campo, index) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index)
    }));
  };

  const moverPasoLista = (campo, index, direccion) => {
    setFormData((prev) => {
      const copia = [...prev[campo]];
      const targetIndex = index + direccion;
      if (targetIndex < 0 || targetIndex >= copia.length) return prev;
      const temporal = copia[index];
      copia[index] = copia[targetIndex];
      copia[targetIndex] = temporal;
      return { ...prev, [campo]: copia };
    });
  };

  // Validaciones antes de avanzar
  const avanzarPaso = () => {
    setErrorGlobal('');
    if (pasoActual === 2) {
      if (!formData.numero_cas.trim() || !formData.nombre_quimico.trim() || !formData.formula_quimica.trim()) {
        setErrorGlobal('Por favor completa los campos químicos principales.');
        return;
      }
      if (!formData.codigo_institucional.trim()) {
        setErrorGlobal('El código institucional es obligatorio.');
        return;
      }
      if (!/^[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(formData.codigo_institucional.toUpperCase())) {
        setErrorGlobal('El código institucional debe cumplir el formato de 8 caracteres (ej: 26RQ0001).');
        return;
      }
      if (!formData.id_grupo) {
        setErrorGlobal('Debe seleccionar un grupo químico.');
        return;
      }
    }
    setPasoActual((prev) => Math.min(prev + 1, 4));
  };

  // Guardado transaccional final (Paso 4)
  const handleGuardarReactivo = async () => {
    try {
      setGuardando(true);
      setErrorGlobal('');

      if (!archivoPdf) {
        throw new Error('Se requiere adjuntar el archivo PDF de la FDS para el registro.');
      }

      const payload = {
        ...formData,
        codigo_institucional: formData.codigo_institucional.toUpperCase()
      };

      await crearReactivoApi(archivoPdf, payload);
      navigate(`/reactivos/${payload.codigo_institucional}`);
    } catch (err) {
      setErrorGlobal(err.response?.data?.mensaje || err.message || 'Error al persistir el reactivo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        
        {/* Cabecera Superior */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/reactivos')}
            className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" /> Cancelar registro
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Nuevo Reactivo
          </h1>
        </div>

        {/* Stepper Superior */}
        <div className="relative mb-10 max-w-3xl mx-auto">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 -z-0" />
          <div className="relative flex justify-between z-10">
            {[
              { num: 1, label: 'Carga FDS' },
              { num: 2, label: 'Identificación' },
              { num: 3, label: 'Envases, EPP y Almacenamiento' },
              { num: 4, label: 'Protocolos' }
            ].map((p) => {
              const completado = pasoActual > p.num;
              const activo = pasoActual === p.num;

              return (
                <div key={p.num} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                      completado
                        ? 'bg-slate-900 text-white'
                        : activo
                        ? 'bg-white border-2 border-slate-900 text-slate-900'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                  >
                    {completado ? <Check className="w-4 h-4 stroke-[3]" /> : p.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 max-w-[90px] text-center leading-tight ${
                      activo ? 'text-gray-900 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notificación de Error */}
        {errorGlobal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="leading-relaxed">{errorGlobal}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 1: CARGA E INGESTA DE FDS                            */}
        {/* ========================================================= */}
        {pasoActual === 1 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xs max-w-3xl mx-auto">
            <h2 className="text-base font-bold text-gray-900 mb-1">Carga e Ingesta de FDS</h2>
            <p className="text-xs text-gray-500 mb-6">
              Sube el documento FDS en PDF para extracción automática con IA.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors mb-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-xs font-semibold text-gray-700">
                {archivoPdf ? archivoPdf.name : 'Arrastra el archivo PDF aquí o haz clic para seleccionar'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">Formato: .pdf · Tamaño máx: 10MB</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                disabled={!archivoPdf || procesandoIA}
                onClick={ejecutarExtraccionIA}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
              >
                {procesandoIA ? (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> Procesando FDS con Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-600" /> [ Procesar FDS con IA ]
                  </>
                )}
              </button>

              <button
                onClick={() => setPasoActual(2)}
                className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Omitir e ingresar manualmente
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 2: IDENTIFICACIÓN QUÍMICA Y SGA                      */}
        {/* ========================================================= */}
        {pasoActual === 2 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Identificación Química y SGA</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Los campos con borde verde fueron reconocidos automáticamente.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Reconocido automáticamente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número CAS *</label>
                <input
                  type="text"
                  name="numero_cas"
                  value={formData.numero_cas}
                  onChange={handleChange}
                  placeholder="Ej: 7664-93-9"
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none font-mono transition-colors ${
                    reconocidosPorIA.numero_cas ? 'border-green-500 bg-green-50/20' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Código Interno (Inventario) *</label>
                <input
                  type="text"
                  name="codigo_institucional"
                  value={formData.codigo_institucional}
                  onChange={handleChange}
                  placeholder="Ej: 26RQ0001"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white outline-none font-mono uppercase focus:border-blue-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">Formato: 2 dígitos, 2 letras y 4 dígitos (ej: 26RQ0001).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Químico *</label>
                <input
                  type="text"
                  name="nombre_quimico"
                  value={formData.nombre_quimico}
                  onChange={handleChange}
                  placeholder="Ej: Ácido Sulfúrico"
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none font-medium transition-colors ${
                    reconocidosPorIA.nombre_quimico ? 'border-green-500 bg-green-50/20' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fórmula *</label>
                <input
                  type="text"
                  name="formula_quimica"
                  value={formData.formula_quimica}
                  onChange={handleChange}
                  placeholder="Ej: H2SO4"
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none font-mono transition-colors ${
                    reconocidosPorIA.formula_quimica ? 'border-green-500 bg-green-50/20' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Masa Molar</label>
                <input
                  type="text"
                  name="masa_molar"
                  value={formData.masa_molar}
                  onChange={handleChange}
                  placeholder="Ej: 98.08 g/mol"
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none transition-colors ${
                    reconocidosPorIA.masa_molar ? 'border-green-500 bg-green-50/20' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Grupo Químico *</label>
                <select
                  name="id_grupo"
                  value={formData.id_grupo}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-600"
                >
                  <option value="">Seleccionar...</option>
                  {catalogos.grupos.map((g) => (
                    <option key={g.id_grupo} value={g.id_grupo}>
                      {g.nombre_grupo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nuevos campos agregados para cumplir con el DDL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Concentración / Pureza *</label>
                <input
                  type="text"
                  name="concentracion"
                  value={formData.concentracion}
                  onChange={handleChange}
                  placeholder="Ej: 98% p.a."
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none transition-colors ${
                    reconocidosPorIA.concentracion ? 'border-green-500 bg-green-50/20' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Presentación Habitual *</label>
                <input
                  type="text"
                  name="presentacion"
                  value={formData.presentacion}
                  onChange={handleChange}
                  placeholder="Ej: Frasco de vidrio ámbar"
                  className={`w-full text-xs p-2.5 rounded-lg border outline-none transition-colors ${
                    reconocidosPorIA.presentacion ? 'border-green-500 bg-green-50/20' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Pictogramas SGA */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-3">
                Pictogramas SGA (Seleccionar)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {catalogos.pictogramas.map((p) => {
                  const seleccionado = formData.pictogramas_ids.includes(p.id_pictograma);
                  return (
                    <div
                      key={p.id_pictograma}
                      onClick={() => toggleArrayItem('pictogramas_ids', p.id_pictograma)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all select-none ${
                        seleccionado
                          ? 'border-blue-600 bg-blue-50/30'
                          : 'border-gray-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 border border-red-600 rotate-45 flex items-center justify-center bg-white my-2">
                        {p.url_icon ? (
                          <img src={p.url_icon} alt={p.peligro} className="-rotate-45 w-6 h-6 object-contain" />
                        ) : (
                          <span className="-rotate-45 text-[9px] font-bold text-red-600">{p.cod_ghs}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-gray-600 mt-2">{p.cod_ghs}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 3: ENVASES, EPP Y ALMACENAMIENTO                     */}
        {/* ========================================================= */}
        {pasoActual === 3 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Envases, EPP y Almacenamiento</h2>
              <p className="text-xs text-gray-500">
                Selecciona envases aprobados, EPP requerido y condiciones de almacenamiento.
              </p>
            </div>

            {/* Envases Aprobados */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Envases Aprobados</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalogos.materiales.map((m) => {
                  const check = formData.materiales_ids.includes(m.id_material);
                  return (
                    <label
                      key={m.id_material}
                      onClick={() => toggleArrayItem('materiales_ids', m.id_material)}
                      className="p-3 border border-gray-200 hover:bg-slate-50 rounded-xl flex items-center gap-3 cursor-pointer select-none text-xs text-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={check}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-0"
                      />
                      <span>{m.nombre_material}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Condiciones de Almacenamiento */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Condiciones de Almacenamiento
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                Define requisitos de temperatura, ventilación, luz y aislamiento físico según la FDS.
              </p>
              <textarea
                name="condiciones_almac"
                rows={3}
                value={formData.condiciones_almac}
                onChange={handleChange}
                placeholder="Ej: Almacenar en armario ventilado exclusivo para ácidos. Mantener alejado de bases y fuentes de ignición. Rango térmico: 15°C - 25°C."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-600 leading-relaxed"
              />
            </div>

            {/* EPP Requerido */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700">EPP Requerido</label>
              </div>

              {formData.resumen_epp_texto && (
                <div className="mb-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="font-semibold">Recomendación FDS: </strong>
                    {formData.resumen_epp_texto}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalogos.epps.map((e) => {
                  const check = formData.epp_ids.includes(e.id_epp);
                  return (
                    <label
                      key={e.id_epp}
                      onClick={() => toggleArrayItem('epp_ids', e.id_epp)}
                      className="p-3 border border-gray-200 hover:bg-slate-50 rounded-xl flex items-center gap-3 cursor-pointer select-none text-xs text-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={check}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 focus:ring-0"
                      />
                      <span>{e.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Procedimiento de Trasvase (Antes Reglas de Manejo) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Procedimiento de Trasvase (JSON editable)
              </label>
              <div className="space-y-2">
                {formData.proc_trasvase.map((paso, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <input
                      type="text"
                      value={paso}
                      onChange={(e) => actualizarPasoLista('proc_trasvase', idx, e.target.value)}
                      placeholder="Paso de trasvase o manipulación..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                      <button
                        onClick={() => moverPasoLista('proc_trasvase', idx, -1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                        title="Mover arriba"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moverPasoLista('proc_trasvase', idx, 1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                        title="Mover abajo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => eliminarPasoLista('proc_trasvase', idx)}
                        className="p-1 hover:text-red-600 cursor-pointer text-red-400"
                        title="Eliminar paso"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => agregarPasoLista('proc_trasvase')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-slate-50 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar paso
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 4: PROTOCOLOS DE EMERGENCIA                          */}
        {/* ========================================================= */}
        {pasoActual === 4 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Protocolos de Emergencia</h2>
              <p className="text-xs text-gray-500">
                Ordena los pasos de cada protocolo arrastrando las filas.
              </p>
            </div>

            {/* Sección: Primeros Auxilios */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                PRIMEROS AUXILIOS
              </label>
              <div className="space-y-2">
                {formData.primeros_aux.map((paso, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <input
                      type="text"
                      value={paso}
                      onChange={(e) => actualizarPasoLista('primeros_aux', idx, e.target.value)}
                      placeholder="Paso de primeros auxilios..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                      <button
                        onClick={() => moverPasoLista('primeros_aux', idx, -1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moverPasoLista('primeros_aux', idx, 1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => eliminarPasoLista('primeros_aux', idx)}
                        className="p-1 hover:text-red-600 cursor-pointer text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => agregarPasoLista('primeros_aux')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-slate-50 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar paso
              </button>
            </div>

            {/* Sección: Control y Extinción de Incendios */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                CONTROL Y EXTINCIÓN DE INCENDIOS
              </label>
              <div className="space-y-2">
                {formData.control_incendio.map((paso, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <input
                      type="text"
                      value={paso}
                      onChange={(e) => actualizarPasoLista('control_incendio', idx, e.target.value)}
                      placeholder="Paso de extinción o control de fuego..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                      <button
                        onClick={() => moverPasoLista('control_incendio', idx, -1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moverPasoLista('control_incendio', idx, 1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => eliminarPasoLista('control_incendio', idx)}
                        className="p-1 hover:text-red-600 cursor-pointer text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => agregarPasoLista('control_incendio')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-slate-50 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar paso
              </button>
            </div>

            {/* Sección: Neutralización de Derrames */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                NEUTRALIZACIÓN DE DERRAMES
              </label>
              <div className="space-y-2">
                {formData.control_derrame.map((paso, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <input
                      type="text"
                      value={paso}
                      onChange={(e) => actualizarPasoLista('control_derrame', idx, e.target.value)}
                      placeholder="Paso de neutralización..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                      <button
                        onClick={() => moverPasoLista('control_derrame', idx, -1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moverPasoLista('control_derrame', idx, 1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => eliminarPasoLista('control_derrame', idx)}
                        className="p-1 hover:text-red-600 cursor-pointer text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => agregarPasoLista('control_derrame')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-slate-50 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar paso
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BOTONERA INFERIOR DE NAVEGACIÓN                          */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between max-w-4xl mx-auto mt-6 px-2">
          <button
            disabled={pasoActual === 1}
            onClick={() => {
              setErrorGlobal('');
              setPasoActual((prev) => Math.max(prev - 1, 1));
            }}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 shadow-2xs transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-gray-400 font-medium">
            Paso {pasoActual} de 4
          </span>

          {pasoActual < 4 ? (
            <button
              onClick={avanzarPaso}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-xs transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={guardando}
              onClick={handleGuardarReactivo}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                '[ Guardar Reactivo en Catálogo ]'
              )}
            </button>
          )}
        </div>

      </main>
    </div>
  );
};

export default NuevoReactivo;