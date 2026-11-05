import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Save,
  FileText,
  UploadCloud,
  Eye,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ModalConfirmacion } from '../components/ModalConfirmacion';
import { Toast } from '../components/Toast';
import {
  fetchReactivoById,
  actualizarReactivoApi,
  fetchGruposQuimicos,
  fetchPictogramas,
  fetchEpps,
  fetchMateriales
} from '../services/reactivoService';

export const EditarReactivo = () => {
  const { identificador } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estados de carga y navegación de pestañas
  const [tabActiva, setTabActiva] = useState('datos');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');

  // Modales de confirmación
  const [modalDescartar, setModalDescartar] = useState(false);
  const [modalGuardar, setModalGuardar] = useState(false);

  // Toast de retroalimentación
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'exito' });

  // Nuevo PDF seleccionado
  const [nuevoArchivoPdf, setNuevoArchivoPdf] = useState(null);

  // Catálogos
  const [catalogos, setCatalogos] = useState({
    grupos: [],
    pictogramas: [],
    epps: [],
    materiales: []
  });

  // Estado del formulario
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
    url_fds: '',
    pictogramas_ids: [],
    materiales_ids: [],
    epp_ids: [],
    condiciones_almac: '',
    proc_trasvase: [],
    primeros_aux: [],
    control_incendio: [],
    control_derrame: []
  });

  // Carga de datos iniciales del reactivo y catálogos
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        setCargando(true);
        const [reactivo, grupos, pictogramas, epps, materiales] = await Promise.all([
          fetchReactivoById(identificador),
          fetchGruposQuimicos(),
          fetchPictogramas(),
          fetchEpps(),
          fetchMateriales()
        ]);

        if (!reactivo) {
          setErrorGlobal('No se encontró el reactivo solicitado.');
          setCargando(false);
          return;
        }

        setCatalogos({ grupos, pictogramas, epps, materiales });

        // Poblado del formulario mapeando relaciones N:M
        setFormData({
          numero_cas: reactivo.numero_cas || '',
          codigo_institucional: reactivo.codigo_institucional || '',
          nombre_quimico: reactivo.nombre_quimico || '',
          nombre_comercial: reactivo.nombre_comercial || '',
          formula_quimica: reactivo.formula_quimica || '',
          masa_molar: reactivo.masa_molar ? String(reactivo.masa_molar) : '',
          concentracion: reactivo.concentracion || '',
          presentacion: reactivo.presentacion || '',
          id_grupo: reactivo.id_grupo ? String(reactivo.id_grupo) : '',
          url_fds: reactivo.url_fds || '',
          pictogramas_ids: reactivo.pictogramas ? reactivo.pictogramas.map((p) => p.id_pictograma) : [],
          materiales_ids: reactivo.materiales ? reactivo.materiales.map((m) => m.id_material) : [],
          epp_ids: reactivo.epps ? reactivo.epps.map((e) => e.id_epp) : [],
          condiciones_almac: reactivo.condiciones_almac || '',
          proc_trasvase: Array.isArray(reactivo.proc_trasvase) ? reactivo.proc_trasvase : [],
          primeros_aux: Array.isArray(reactivo.primeros_aux) ? reactivo.primeros_aux : [],
          control_incendio: Array.isArray(reactivo.control_incendio) ? reactivo.control_incendio : [],
          control_derrame: Array.isArray(reactivo.control_derrame) ? reactivo.control_derrame : []
        });
      } catch (err) {
        console.error('Error al inicializar edición:', err);
        setErrorGlobal('Error al cargar la información del reactivo.');
      } finally {
        setCargando(false);
      }
    };

    inicializarDatos();
  }, [identificador]);

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

  const agregarPasoLista = (campo) => {
    setFormData((prev) => ({ ...prev, [campo]: [...prev[campo], ''] }));
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

  // Validación y confirmación del guardado
  const validarYConfirmarGuardado = () => {
    setErrorGlobal('');
    if (!formData.codigo_institucional.trim()) {
      setErrorGlobal('El código institucional es obligatorio.');
      setTabActiva('datos');
      return;
    }
    if (!/^[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(formData.codigo_institucional.toUpperCase())) {
      setErrorGlobal('El código institucional debe tener 8 caracteres (ej: 26RQ0001).');
      setTabActiva('datos');
      return;
    }
    if (!formData.nombre_quimico.trim() || !formData.formula_quimica.trim()) {
      setErrorGlobal('Nombre químico y fórmula no pueden quedar vacíos.');
      setTabActiva('datos');
      return;
    }
    setModalGuardar(true);
  };

  // Ejecución del guardado vía API
  const ejecutarActualizacion = async () => {
    try {
      setGuardando(true);
      setModalGuardar(false);

      const payload = {
        ...formData,
        codigo_institucional: formData.codigo_institucional.toUpperCase()
      };

      const res = await actualizarReactivoApi(formData.numero_cas, nuevoArchivoPdf, payload);

      setToast({
        visible: true,
        mensaje: res.mensaje || 'Reactivo actualizado exitosamente.',
        tipo: 'exito'
      });

      // Redirigir a la ficha actualizada tras 1.5s
      setTimeout(() => {
        navigate(`/reactivos/${payload.codigo_institucional || formData.numero_cas}`);
      }, 1500);
    } catch (err) {
      setGuardando(false);
      setToast({
        visible: true,
        mensaje: err.message || 'Error de red al actualizar el reactivo.',
        tipo: 'error'
      });
    }
  };

  const nombresGhsMap = {
    GHS01: 'Explosivo',
    GHS02: 'Inflamable',
    GHS03: 'Comburente',
    GHS04: 'Gas a presión',
    GHS05: 'Corrosivo',
    GHS06: 'Toxicidad aguda',
    GHS07: 'Irritante / Nocivo',
    GHS08: 'Peligro salud',
    GHS09: 'Peligro ambiental'
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs text-gray-500 font-medium">Cargando reactivo para edición...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        
        {/* Barra Superior de Control */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:px-6 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs text-gray-400">Modificando:</span>
            <span className="text-sm font-bold text-gray-900 truncate max-w-xs">
              {formData.nombre_quimico || 'Reactivo'}
            </span>
            <span className="text-xs text-gray-400">
              — Código: <strong className="text-gray-700">{formData.codigo_institucional}</strong> (CAS: {formData.numero_cas})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">
              Estado: <span className="text-green-600">Activo</span>
            </div>

            <button
              type="button"
              onClick={() => setModalDescartar(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Descartar Cambios
            </button>

            <button
              type="button"
              disabled={guardando}
              onClick={validarYConfirmarGuardado}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {guardando ? 'Actualizando...' : 'Actualizar Reactivo'}
            </button>
          </div>
        </div>

        {/* Notificación de Error */}
        {errorGlobal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="leading-relaxed">{errorGlobal}</span>
          </div>
        )}

        {/* Selector de Pestañas (Tabs) */}
        <div className="flex border-b border-gray-200 mb-6 gap-6 sm:gap-8 px-2 overflow-x-auto">
          {[
            { id: 'datos', label: 'Datos Químicos' },
            { id: 'fds', label: 'Documento FDS' },
            { id: 'envases', label: 'Envases y Manejo' },
            { id: 'protocolos', label: 'Protocolos de Emergencia' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`pb-3 text-xs font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                tabActiva === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900 font-bold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* PESTAÑA 1: DATOS QUÍMICOS                                 */}
        {/* ========================================================= */}
        {tabActiva === 'datos' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CAS Bloqueado (solo lectura) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Número CAS (solo lectura)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.numero_cas}
                    readOnly
                    className="w-full text-xs p-2.5 pl-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-mono select-none cursor-not-allowed outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Código Interno UCSM *
                </label>
                <input
                  type="text"
                  name="codigo_institucional"
                  value={formData.codigo_institucional}
                  onChange={handleChange}
                  placeholder="Ej: 26RQ0001"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white font-mono uppercase outline-none focus:border-blue-600"
                />
                <p className="text-[10px] text-gray-400 mt-1">Formato: 2 dígitos, 2 letras y 4 dígitos (Ej: 26RQ0001).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Químico *</label>
                <input
                  type="text"
                  name="nombre_quimico"
                  value={formData.nombre_quimico}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fórmula *</label>
                <input
                  type="text"
                  name="formula_quimica"
                  value={formData.formula_quimica}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Masa Molar</label>
                <input
                  type="text"
                  name="masa_molar"
                  value={formData.masa_molar}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Grupo Químico</label>
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Concentración / Pureza</label>
                <input
                  type="text"
                  name="concentracion"
                  value={formData.concentracion}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Presentación Habitual</label>
                <input
                  type="text"
                  name="presentacion"
                  value={formData.presentacion}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Pictogramas SGA */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-3">
                Pictogramas SGA (Seleccionar)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {catalogos.pictogramas.map((p) => {
                  const seleccionado = formData.pictogramas_ids.includes(p.id_pictograma);
                  const nombrePeligro = p.peligro || p.nombre || nombresGhsMap[p.cod_ghs] || '';

                  return (
                    <div
                      key={p.id_pictograma}
                      onClick={() => toggleArrayItem('pictogramas_ids', p.id_pictograma)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${
                        seleccionado
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-slate-50 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center my-1">
                        {p.url_icon ? (
                          <img src={p.url_icon} alt={nombrePeligro} className="w-12 h-12 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-red-600">{p.cod_ghs}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-gray-800 mt-1">
                        {p.cod_ghs}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-1">
                        {nombrePeligro}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 2: DOCUMENTO FDS                                  */}
        {/* ========================================================= */}
        {tabActiva === 'fds' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">Documento FDS Actual</h2>
              <p className="text-xs text-gray-500">
                Reemplaza el PDF sin re-extraer con IA.
              </p>
            </div>

            {/* Ficha técnica actual */}
            <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {formData.url_fds ? formData.url_fds.split('/').pop() : 'FDS no asignada'}
                  </p>
                  <p className="text-[11px] text-gray-400">PDF registrado en Supabase Storage</p>
                </div>
              </div>

              {formData.url_fds && (
                <a
                  href={formData.url_fds}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver PDF
                </a>
              )}
            </div>

            {/* Zona de reemplazo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  setNuevoArchivoPdf(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/30 hover:bg-slate-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setNuevoArchivoPdf(e.target.files[0])}
              />
              <UploadCloud className="w-9 h-9 text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-700">
                {nuevoArchivoPdf ? nuevoArchivoPdf.name : '[ Cargar nueva versión (.pdf) ]'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Solo reemplazo de archivo (eliminará el anterior)</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 3: ENVASES Y MANEJO                               */}
        {/* ========================================================= */}
        {tabActiva === 'envases' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
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
              <textarea
                name="condiciones_almac"
                rows={3}
                value={formData.condiciones_almac}
                onChange={handleChange}
                placeholder="Condiciones de temperatura, humedad y luz..."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-600 leading-relaxed"
              />
            </div>

            {/* EPP Requerido */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">EPP Requerido</label>
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

            {/* Procedimiento de Trasvase */}
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
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moverPasoLista('proc_trasvase', idx, 1)}
                        className="p-1 hover:text-gray-700 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => eliminarPasoLista('proc_trasvase', idx)}
                        className="p-1 hover:text-red-600 cursor-pointer text-red-400"
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
        {/* PESTAÑA 4: PROTOCOLOS DE EMERGENCIA                       */}
        {/* ========================================================= */}
        {tabActiva === 'protocolos' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Primeros Auxilios */}
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
                      <button onClick={() => moverPasoLista('primeros_aux', idx, -1)} className="p-1 hover:text-gray-700 cursor-pointer">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moverPasoLista('primeros_aux', idx, 1)} className="p-1 hover:text-gray-700 cursor-pointer">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => eliminarPasoLista('primeros_aux', idx)} className="p-1 hover:text-red-600 cursor-pointer text-red-400">
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

            {/* Control y Extinción de Incendios */}
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
                      placeholder="Paso de extinción o control..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                      <button onClick={() => moverPasoLista('control_incendio', idx, -1)} className="p-1 hover:text-gray-700 cursor-pointer">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moverPasoLista('control_incendio', idx, 1)} className="p-1 hover:text-gray-700 cursor-pointer">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => eliminarPasoLista('control_incendio', idx)} className="p-1 hover:text-red-600 cursor-pointer text-red-400">
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

            {/* Neutralización de Derrames */}
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
                      placeholder="Paso de neutralización de derrame..."
                      className="w-full text-xs outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                      <button onClick={() => moverPasoLista('control_derrame', idx, -1)} className="p-1 hover:text-gray-700 cursor-pointer">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moverPasoLista('control_derrame', idx, 1)} className="p-1 hover:text-gray-700 cursor-pointer">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => eliminarPasoLista('control_derrame', idx)} className="p-1 hover:text-red-600 cursor-pointer text-red-400">
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

      </main>

      {/* Modal Descartar Cambios */}
      <ModalConfirmacion
        abierto={modalDescartar}
        tipo="peligro"
        titulo="¿Descartar cambios?"
        mensaje="Se perderán todas las modificaciones no guardadas."
        textoCancelar="Continuar editando"
        textoConfirmar="Sí, descartar"
        onCancelar={() => setModalDescartar(false)}
        onConfirmar={() => navigate(`/reactivos/${formData.codigo_institucional || formData.numero_cas}`)}
      />

      {/* Modal Guardar Actualización */}
      <ModalConfirmacion
        abierto={modalGuardar}
        tipo="accion"
        titulo="¿Actualizar reactivo?"
        mensaje="Se guardarán las modificaciones en la base de datos y se actualizarán los protocolos técnicos."
        textoCancelar="Revisar"
        textoConfirmar="Sí, guardar cambios"
        cargando={guardando}
        onCancelar={() => setModalGuardar(false)}
        onConfirmar={ejecutarActualizacion}
      />

      {/* Notificación Toast Flotante */}
      <Toast
        visible={toast.visible}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default EditarReactivo;