import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  Pencil,
  FlaskConical,
  Package,
  HeartPulse,
  Flame,
  Shield,
  ArrowRightLeft,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { fetchReactivoById } from '../services/reactivoService';

export const FichaTecnica = () => {
  const { codigo } = useParams();
  const navigate = useNavigate();

  const [reactivo, setReactivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalActivo, setModalActivo] = useState(null); 
  // 'fisicoquimica' | 'almacenamiento' | 'trasvase' | 'primerosAux' | 'incendios' | 'epp'

  useEffect(() => {
    let cancelado = false;
    const cargarDetalle = async () => {
      try {
        setLoading(true);
        const data = await fetchReactivoById(codigo);
        if (!cancelado) setReactivo(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    cargarDetalle();
    return () => { cancelado = true; };
  }, [codigo]);

  const abrirFDS = () => {
    if (!reactivo?.url_fds) {
      alert('Este reactivo no tiene asociada una Ficha de Datos de Seguridad (PDF).');
      return;
    }
    window.open(reactivo.url_fds, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Cargando ficha técnica...</p>
        </div>
      </div>
    );
  }

  if (!reactivo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reactivo no encontrado</h2>
          <p className="text-sm text-gray-500 mb-6">
            El reactivo con identificador "{codigo}" no existe en el sistema.
          </p>
          <button
            onClick={() => navigate('/reactivos')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  // Desestructuración directa de los campos JSONB
  const almac = reactivo.condiciones_almac;
  const aux = reactivo.primeros_aux;
  const incendio = reactivo.control_incendio;
  const derrame = reactivo.control_derrame;
  const trasvase = reactivo.proc_trasvase;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* Volver */}
        <button
          onClick={() => navigate('/reactivos')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </button>

        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {reactivo.nombre_quimico}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-600 mt-2">
              <span>Código: <strong className="font-semibold text-gray-800">{reactivo.codigo_institucional}</strong></span>
              <span>•</span>
              <span>CAS: <strong className="font-semibold font-mono text-gray-800">{reactivo.numero_cas}</strong></span>
              <span>•</span>
              <span>Fórmula: <strong className="font-semibold font-mono text-gray-800">{reactivo.formula_quimica}</strong></span>
              {reactivo.grupo_quimico?.nombre_grupo && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700">
                  {reactivo.grupo_quimico.nombre_grupo}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={abrirFDS}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-gray-600" />
              <span>Descargar FDS (PDF)</span>
            </button>

            <button
              onClick={() => alert(`Editor de reactivo: ${reactivo.codigo_institucional}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar Ficha</span>
              <span className="sm:hidden">Editar</span>
            </button>
          </div>
        </div>

        {/* Peligros GHS */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-5">
            Peligros GHS — Identificación de Riesgos
          </h2>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {reactivo.pictogramas && reactivo.pictogramas.length > 0 ? (
              reactivo.pictogramas.map((pic) => (
                <div key={pic.id_pictograma || pic.cod_ghs} className="flex flex-col items-center">
                  <div className="w-14 h-14 border-2 border-red-600 rotate-45 flex items-center justify-center bg-white shadow-xs">
                    {pic.url_icon ? (
                      <img
                        src={pic.url_icon}
                        alt={pic.peligro}
                        className="-rotate-45 w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="-rotate-45 text-xs font-bold text-red-600">{pic.cod_ghs}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 mt-4 text-center max-w-[90px]">
                    {pic.peligro || pic.cod_ghs}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No presenta pictogramas SGA clasificados.</p>
            )}
          </div>
        </div>

        {/* Botonera: Grilla 3x2 Equilibrada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BotonModal
            icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
            titulo="Especificaciones Físicas y Químicas"
            onClick={() => setModalActivo('fisicoquimica')}
          />
          <BotonModal
            icon={<Package className="w-5 h-5 text-blue-600" />}
            titulo="Almacenamiento y Envases Aptos"
            onClick={() => setModalActivo('almacenamiento')}
          />
          <BotonModal
            icon={<ArrowRightLeft className="w-5 h-5 text-teal-600" />}
            titulo="Procedimiento de Trasvase"
            onClick={() => setModalActivo('trasvase')}
          />
          <BotonModal
            icon={<HeartPulse className="w-5 h-5 text-rose-600" />}
            titulo="Primeros Auxilios"
            onClick={() => setModalActivo('primerosAux')}
          />
          <BotonModal
            icon={<Flame className="w-5 h-5 text-amber-600" />}
            titulo="Control de Incendios y Derrames"
            onClick={() => setModalActivo('incendios')}
          />
          <BotonModal
            icon={<Shield className="w-5 h-5 text-emerald-600" />}
            titulo="Equipos de Protección Personal (EPP)"
            onClick={() => setModalActivo('epp')}
          />
        </div>

      </main>

      {/* --- MODAL 1: FISICOQUÍMICA --- */}
      {modalActivo === 'fisicoquimica' && (
        <ModalWrapper title="Especificaciones Físicas y Químicas" onClose={() => setModalActivo(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FichaCampo label="Masa Molar" valor={reactivo.masa_molar ? `${reactivo.masa_molar} g/mol` : 'No registrada'} />
            <FichaCampo label="Concentración" valor={reactivo.concentracion || 'N/A'} />
            <FichaCampo label="Presentación" valor={reactivo.presentacion || 'N/A'} />
            <FichaCampo label="Fórmula Química" valor={reactivo.formula_quimica} />
            <FichaCampo label="Nombre Comercial" valor={reactivo.nombre_comercial || 'No registrado'} />
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 2: ALMACENAMIENTO Y ENVASES --- */}
      {modalActivo === 'almacenamiento' && (
        <ModalWrapper title="Almacenamiento y Envases Aptos" onClose={() => setModalActivo(null)}>
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-bold text-gray-700 uppercase tracking-wider mb-2">Materiales de Envase Compatibles</p>
              {reactivo.materiales && reactivo.materiales.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {reactivo.materiales.map((mat) => (
                    <div key={mat.id_material} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="font-bold text-gray-800">{mat.nombre_material}</p>
                      {mat.descripcion && <p className="text-gray-500 text-[11px] mt-0.5">{mat.descripcion}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No se han registrado envases específicos.</p>
              )}
            </div>

            <div>
              <p className="font-bold text-gray-700 uppercase tracking-wider mb-2">Condiciones de Almacenamiento</p>
              <FormatoJsonb data={almac} emptyMessage="No hay condiciones de almacenamiento registradas." />
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 3: PROCEDIMIENTO DE TRASVASE (NUEVO) --- */}
      {modalActivo === 'trasvase' && (
        <ModalWrapper title="Procedimiento Seguro de Trasvase y Manipulación" onClose={() => setModalActivo(null)}>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 flex items-start gap-2.5 mb-3">
              <Info className="w-4 h-4 shrink-0 text-teal-600 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Protocolo estandarizado para fraccionamiento de reactivos en campana o área de dosificación.
              </p>
            </div>
            <FormatoJsonb data={trasvase} emptyMessage="No se ha definido un procedimiento específico de trasvase para este reactivo." />
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 4: PRIMEROS AUXILIOS --- */}
      {modalActivo === 'primerosAux' && (
        <ModalWrapper title="Protocolo de Primeros Auxilios" onClose={() => setModalActivo(null)}>
          <div className="space-y-3 text-xs">
            <FormatoJsonb data={aux} emptyMessage="No se han registrado medidas de primeros auxilios." />
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 5: INCENDIOS Y DERRAMES --- */}
      {modalActivo === 'incendios' && (
        <ModalWrapper title="Control de Incendios y Derrames" onClose={() => setModalActivo(null)}>
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-bold text-gray-700 uppercase tracking-wider mb-2">Actuación en Caso de Incendio</p>
              <FormatoJsonb data={incendio} emptyMessage="No se registran medidas para extinción de incendios." />
            </div>
            <div>
              <p className="font-bold text-gray-700 uppercase tracking-wider mb-2">Actuación ante Derrames o Fugas</p>
              <FormatoJsonb data={derrame} emptyMessage="No se registran medidas para control de derrames." />
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 6: EQUIPOS DE PROTECCIÓN PERSONAL --- */}
      {modalActivo === 'epp' && (
        <ModalWrapper title="Equipos de Protección Personal Requeridos" onClose={() => setModalActivo(null)}>
          <div className="space-y-3 text-xs">
            {reactivo.epps && reactivo.epps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reactivo.epps.map((epp) => {
                  const props = typeof epp.propiedades === 'object' && epp.propiedades !== null 
                    ? epp.propiedades 
                    : {};
                  const categoria = props.categoria || 'General';
                  const tipoDetalle = props.tipo || (typeof epp.propiedades === 'string' ? epp.propiedades : 'Sin especificación adicional.');

                  return (
                    <div 
                      key={epp.id_epp || epp.nombre} 
                      className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className="font-bold text-gray-900 leading-tight">{epp.nombre}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full shrink-0">
                            {categoria}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px] leading-relaxed">
                          {tipoDetalle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
                <Info className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                <p>No se han asignado equipos de protección obligatorios específicos.</p>
              </div>
            )}
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};

// Componente inteligente para procesar cualquier formato guardado en JSONB
const FormatoJsonb = ({ data, emptyMessage = 'No registrado' }) => {
  if (!data) {
    return <p className="text-gray-400 italic text-xs">{emptyMessage}</p>;
  }

  // Si se guardó como string directo
  if (typeof data === 'string') {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 leading-relaxed text-xs">
        {data}
      </div>
    );
  }

  // Si se guardó como un array de indicaciones o pasos
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-gray-400 italic text-xs">{emptyMessage}</p>;
    return (
      <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside bg-gray-50 p-3 rounded-xl border border-gray-200">
        {data.map((item, i) => (
          <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    );
  }

  // Si se guardó como objeto clave-valor
  const entradas = Object.entries(data);
  if (entradas.length === 0) {
    return <p className="text-gray-400 italic text-xs">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {entradas.map(([clave, valor]) => {
        const titulo = clave.replace(/_/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase());
        return (
          <div key={clave} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {titulo}
            </p>
            <div className="text-xs text-gray-800 leading-relaxed">
              {typeof valor === 'object' && valor !== null ? (
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-gray-700 bg-white p-2 rounded border border-gray-200">
                  {JSON.stringify(valor, null, 2)}
                </pre>
              ) : (
                String(valor)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BotonModal = ({ icon, titulo, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3.5 p-4 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl shadow-xs transition-all text-left group cursor-pointer"
  >
    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white shrink-0">
      {icon}
    </div>
    <span className="text-sm font-semibold text-gray-800">
      {titulo}
    </span>
  </button>
);

const ModalWrapper = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 max-h-[75vh] overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

const FichaCampo = ({ label, valor }) => (
  <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl">
    <p className="text-[11px] font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{valor}</p>
  </div>
);

export default FichaTecnica;