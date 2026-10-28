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
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { fetchReactivoById } from '../services/reactivoService';

export const FichaTecnica = () => {
  const { codigo } = useParams();
  const navigate = useNavigate();

  const [reactivo, setReactivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalActivo, setModalActivo] = useState(null); // 'fisicoquimica' | 'almacenamiento' | 'primerosAux' | 'incendios' | 'epp'

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
    // Abre el PDF en nueva pestaña sin bloquear CORS
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

  // Parseo seguro de los campos JSONB
  const almac = reactivo.condiciones_almac || {};
  const aux = reactivo.primeros_aux || {};
  const incendio = reactivo.control_incendio || {};
  const derrame = reactivo.control_derrame || {};
  const trasvase = reactivo.proc_trasvase || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* Botón Volver */}
        <button
          onClick={() => navigate('/reactivos')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </button>

        {/* Cabecera Principal */}
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

          {/* Acciones principales */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={abrirFDS}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-gray-600" />
              <span>Descargar FDS (PDF)</span>
            </button>

            {/* Botón de Gestión / Edición */}
            <button
              onClick={() => alert(`Acceso al editor del reactivo: ${reactivo.codigo_institucional}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar Ficha / Reactivo</span>
              <span className="sm:hidden">Editar</span>
            </button>
          </div>
        </div>

        {/* Sección: Peligros GHS */}
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
              <p className="text-xs text-gray-400 italic">No presenta pictogramas SGA de riesgo clasificados.</p>
            )}
          </div>
        </div>

        {/* Botonera de Bloques Informativos (Disparadores de Modales) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setModalActivo('fisicoquimica')}
            className="flex items-center gap-3.5 p-4 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl shadow-xs transition-all text-left group"
          >
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white text-gray-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Especificaciones Físicas y Químicas
            </span>
          </button>

          <button
            onClick={() => setModalActivo('almacenamiento')}
            className="flex items-center gap-3.5 p-4 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl shadow-xs transition-all text-left group"
          >
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white text-gray-700">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Almacenamiento y Envases Aptos
            </span>
          </button>

          <button
            onClick={() => setModalActivo('primerosAux')}
            className="flex items-center gap-3.5 p-4 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl shadow-xs transition-all text-left group"
          >
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white text-gray-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Primeros Auxilios
            </span>
          </button>

          <button
            onClick={() => setModalActivo('incendios')}
            className="flex items-center gap-3.5 p-4 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl shadow-xs transition-all text-left group"
          >
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white text-gray-700">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Control de Incendios y Derrames
            </span>
          </button>

          <button
            onClick={() => setModalActivo('epp')}
            className="flex items-center gap-3.5 p-4 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl shadow-xs transition-all text-left group sm:col-span-2 lg:col-span-1"
          >
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white text-gray-700">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Equipos de Protección Personal (EPP)
            </span>
          </button>
        </div>

      </main>

      {/* --- MODAL 1: ESPECIFICACIONES FÍSICAS Y QUÍMICAS --- */}
      {modalActivo === 'fisicoquimica' && (
        <ModalWrapper title="Especificaciones Físicas y Químicas" onClose={() => setModalActivo(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FichaCampo label="Masa Molar" valor={reactivo.masa_molar ? `${reactivo.masa_molar} g/mol` : 'No registrada'} />
            <FichaCampo label="Concentración" valor={reactivo.concentracion || 'N/A'} />
            <FichaCampo label="Presentación / Envase" valor={reactivo.presentacion || 'N/A'} />
            <FichaCampo label="Fórmula Química" valor={reactivo.formula_quimica} />
            <FichaCampo label="Nombre Comercial" valor={reactivo.nombre_comercial || 'No registrado'} />
            <FichaCampo label="Estado Físico" valor={almac.estado_fisico || 'Líquido'} />
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 2: ALMACENAMIENTO Y ENVASES APTOS --- */}
      {modalActivo === 'almacenamiento' && (
        <ModalWrapper title="Almacenamiento y Envases Aptos" onClose={() => setModalActivo(null)}>
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-bold text-gray-600 uppercase tracking-wider mb-2">Envases Aprobados</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(almac.envases_aprobados) && almac.envases_aprobados.length > 0 ? (
                  almac.envases_aprobados.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full font-medium text-gray-700">
                      [{item}]
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full font-medium text-gray-700">
                    [Vidrio Borosilicato] [PEAD] [Polipropileno]
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="font-bold text-gray-600 uppercase tracking-wider mb-2">Envases Prohibidos</p>
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{almac.envases_prohibidos || 'Metales reactivos, recipientes sin recubrimiento.'}</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-gray-600 uppercase tracking-wider mb-1">Ventilación</p>
              <p className="text-gray-800">{almac.ventilacion || 'Campana extractora obligatoria para manipulación.'}</p>
            </div>

            {almac.temperatura && (
              <div>
                <p className="font-bold text-gray-600 uppercase tracking-wider mb-1">Rango de Temperatura</p>
                <p className="text-gray-800">{almac.temperatura}</p>
              </div>
            )}
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 3: PRIMEROS AUXILIOS --- */}
      {modalActivo === 'primerosAux' && (
        <ModalWrapper title="Protocolo de Primeros Auxilios" onClose={() => setModalActivo(null)}>
          <div className="space-y-3 text-xs">
            <FichaCampo label="Inhalación" valor={aux.inhalacion || 'Trasladar al aire libre. Si no respira, suministrar respiración artificial y acudir a urgencias.'} />
            <FichaCampo label="Contacto con Ojos" valor={aux.contacto_ojos || 'Lavar abundantemente con agua durante al menos 15 minutos levantando los párpados. Consultar al oftalmólogo.'} />
            <FichaCampo label="Contacto con Piel" valor={aux.contacto_piel || 'Retirar ropa contaminada. Lavar con abundante agua y jabón neutro.'} />
            <FichaCampo label="Ingestión" valor={aux.ingestion || 'No inducir el vómito sin supervisión médica. Enjuagar la boca con agua.'} />
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 4: CONTROL DE INCENDIOS Y DERRAMES --- */}
      {modalActivo === 'incendios' && (
        <ModalWrapper title="Control de Incendios y Derrames" onClose={() => setModalActivo(null)}>
          <div className="space-y-3.5 text-xs">
            <div>
              <p className="font-bold text-gray-700 mb-1">Medios de Extinción de Incendios:</p>
              <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                {incendio.medios_extincion || 'Polvo químico seco, dióxido de carbono (CO2) o espuma resistente al alcohol.'}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-1">Procedimiento de Derrame:</p>
              <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                {derrame.procedimiento || 'Absorber con material inerte (arena, vermiculita). Recoger en contenedores etiquetados para su posterior disposición.'}
              </p>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* --- MODAL 5: EQUIPOS DE PROTECCIÓN PERSONAL (EPP) --- */}
      {modalActivo === 'epp' && (
        <ModalWrapper title="Equipos de Protección Personal (EPP)" onClose={() => setModalActivo(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <FichaCampo label="Protección Ocular / Facial" valor={trasvase.epp_ojos || 'Gafas de seguridad ajustadas herméticamente o pantalla facial.'} />
            <FichaCampo label="Protección de Manos" valor={trasvase.epp_manos || 'Guantes de nitrilo o neopreno de caña media resistente a productos químicos.'} />
            <FichaCampo label="Protección Corporal" valor={trasvase.epp_cuerpo || 'Bata de laboratorio de manga larga, calzado cerrado impermeable.'} />
            <FichaCampo label="Protección Respiratoria" valor={trasvase.epp_respiratoria || 'Mascara con filtro para vapores inorgánicos / ácidos en ausencia de campana.'} />
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};

// Componente envoltorio modal reutilizable
const ModalWrapper = ({ title, onClose, children }) => {
  return (
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
};

// Celda descriptiva de ficha
const FichaCampo = ({ label, valor }) => (
  <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl">
    <p className="text-[11px] font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{valor}</p>
  </div>
);

export default FichaTecnica;