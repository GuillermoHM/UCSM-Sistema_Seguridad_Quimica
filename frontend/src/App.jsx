import { useState, useEffect } from 'react';
import { Search, QrCode, Filter, RefreshCw } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ReactivoCard } from './components/ReactivoCard';
import { fetchReactivos, fetchGruposQuimicos } from './services/reactivoService';

const LISTA_PICTOGRAMAS_SGA = [
  { cod: 'GHS01', label: 'Explosivo (GHS01)' },
  { cod: 'GHS02', label: 'Inflamable (GHS02)' },
  { cod: 'GHS03', label: 'Comburente (GHS03)' },
  { cod: 'GHS04', label: 'Gas a presión (GHS04)' },
  { cod: 'GHS05', label: 'Corrosivo (GHS05)' },
  { cod: 'GHS06', label: 'Tóxico agudo (GHS06)' },
  { cod: 'GHS07', label: 'Nocivo / Irritante (GHS07)' },
  { cod: 'GHS08', label: 'Peligro salud (GHS08)' },
  { cod: 'GHS09', label: 'Medio ambiente (GHS09)' },
];

export const App = () => {
  const [reactivos, setReactivos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [pictoFiltro, setPictoFiltro] = useState('');

  // Carga inicial de todos los grupos químicos existentes
  useEffect(() => {
    fetchGruposQuimicos().then(setGrupos);
  }, []);

  // Búsqueda y filtrado reactivo con debounce de 300 ms
  useEffect(() => {
    let cancelado = false;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await fetchReactivos(busqueda, grupoFiltro, pictoFiltro);
        if (!cancelado) {
          setReactivos(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [busqueda, grupoFiltro, pictoFiltro]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setGrupoFiltro('');
    setPictoFiltro('');
  };

  const handleVerFicha = (codigo) => {
    alert(`Navegando a la Ficha Técnica del reactivo: ${codigo}`);
  };

  const handleAbrirScanner = () => {
    alert('Abriendo Lector Óptico QR con cámara...');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Título */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          Catálogo de Reactivos
        </h1>

        {/* Barra de Búsqueda y Botón QR */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar reactivo por nombre, CAS o código interno (ej. RQ1245)..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <button
            onClick={handleAbrirScanner}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <QrCode className="w-5 h-5" />
            <span>Escanear QR</span>
          </button>
        </div>

        {/* Fila de Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:inline" />

            {/* Selector con todos los grupos de la BD */}
            <select
              value={grupoFiltro}
              onChange={(e) => setGrupoFiltro(e.target.value)}
              className="py-1.5 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Grupo Químico (Todos)</option>
              {grupos.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre_grupo}
                </option>
              ))}
            </select>

            {/* Selector de Pictogramas SGA */}
            <select
              value={pictoFiltro}
              onChange={(e) => setPictoFiltro(e.target.value)}
              className="py-1.5 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Pictograma SGA (Todos)</option>
              {LISTA_PICTOGRAMAS_SGA.map((p) => (
                <option key={p.cod} value={p.cod}>
                  {p.label}
                </option>
              ))}
            </select>

            {(busqueda || grupoFiltro || pictoFiltro) && (
              <button
                onClick={limpiarFiltros}
                className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-gray-500">
            {loading ? 'Cargando reactivos...' : `${reactivos.length} reactivos`}
          </span>
        </div>

        {/* Grilla de Tarjetas */}
        <div className="mt-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
              <p className="text-sm">Consultando catálogo...</p>
            </div>
          ) : reactivos.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-sm">No se encontraron reactivos con los criterios seleccionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reactivos.map((r) => (
                <ReactivoCard
                  key={r.numero_cas}
                  reactivo={r}
                  onVerFicha={handleVerFicha}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;