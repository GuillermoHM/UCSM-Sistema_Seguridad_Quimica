import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, FlaskConical, Lock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { QrScannerModal } from '../components/QrScannerModal';

export const Inicio = () => {
  const navigate = useNavigate();
  const [scannerAbierto, setScannerAbierto] = useState(false);

  const handleScanSuccess = (codigoDecodificado) => {
    setScannerAbierto(false);
    navigate(`/reactivos/${codigoDecodificado}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 flex-1 flex flex-col items-center justify-center">
        
        {/* Icono Central Superior */}
        <div className="w-16 h-16 border border-gray-300 rounded-2xl flex items-center justify-center bg-white shadow-xs mb-6">
          <FlaskConical className="w-8 h-8 text-slate-800" />
        </div>

        {/* Títulos */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center mb-2">
          Sistema de Seguridad Química
        </h1>
        <p className="text-sm text-gray-600 text-center max-w-md mb-10 leading-relaxed">
          Laboratorio de Química UCSM — Selecciona una acción para comenzar:
        </p>

        {/* Grilla de Acciones Principales */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Tarjeta 1: Escanear QR (Destacada en azul) */}
          <button
            onClick={() => setScannerAbierto(true)}
            className="w-full p-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl shadow-sm text-left flex items-start gap-4 transition-all group cursor-pointer"
          >
            <div className="p-3 bg-blue-500/50 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-snug">
                Escanear Frasco con Código QR
              </h2>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Identifica un reactivo físico de inmediato usando la cámara de tu dispositivo.
              </p>
            </div>
          </button>

          {/* Tarjeta 2: Catálogo de Reactivos */}
          <button
            onClick={() => navigate('/reactivos')}
            className="w-full p-5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-gray-200 rounded-2xl shadow-xs text-left flex items-start gap-4 transition-all group cursor-pointer"
          >
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl shrink-0 text-gray-600 group-hover:scale-105 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 leading-snug">
                Catálogo de Reactivos
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Busca por nombre químico, número CAS o filtra por pictogramas del SGA.
              </p>
            </div>
          </button>

          {/* Tarjeta 3: Verificador de Mezclas (Ocupa las dos columnas en desktop) */}
          <div
            onClick={() => navigate('/mezclas')}
            className="w-full sm:col-span-2 p-5 bg-white hover:bg-slate-50 border border-gray-200 rounded-2xl shadow-xs text-left flex items-start gap-4 cursor-pointer transition-all group"
          >
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl shrink-0 text-gray-600 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-bold text-base text-gray-900 leading-snug">
                  Verificador de Mezclas Químicas
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Acceso Activo
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Evalúa la compatibilidad química y normas de segregación entre reactivos del laboratorio.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Modal Lector QR reutilizado */}
      <QrScannerModal
        isOpen={scannerAbierto}
        onClose={() => setScannerAbierto(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default Inicio;