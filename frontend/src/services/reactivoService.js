const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Obtiene el token del almacenamiento local (ajusta 'token' al nombre que uses)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchReactivos = async (filtroTexto = '', idGrupo = '', pictograma = '') => {
  const params = new URLSearchParams();
  if (filtroTexto) params.append('q', filtroTexto);
  if (idGrupo) params.append('grupo', idGrupo);
  if (pictograma) params.append('pictograma', pictograma);

  const res = await fetch(`${API_URL}/reactivos?${params.toString()}`);
  if (!res.ok) throw new Error('Error al consultar el catálogo');
  const json = await res.json();
  return json.data || [];
};

export const fetchReactivoById = async (identificador) => {
  const res = await fetch(`${API_URL}/reactivos/${identificador}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Error al obtener la ficha técnica');
  }
  const json = await res.json();
  return json.data;
};

export const fetchGruposQuimicos = async () => {
  try {
    const res = await fetch(`${API_URL}/catalogos/grupos-quimicos`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch {
    // Si el endpoint dedicado no está disponible, se retorna la lista base
  }
  return [
    { id_grupo: 1, nombre_grupo: 'Ácidos' },
    { id_grupo: 2, nombre_grupo: 'Bases' },
    { id_grupo: 3, nombre_grupo: 'Alcoholes' },
    { id_grupo: 4, nombre_grupo: 'Reactivos Orgánicos' },
    { id_grupo: 5, nombre_grupo: 'Reactivos Inorgánicos' },
    { id_grupo: 6, nombre_grupo: 'Soluciones Buffer' },
    { id_grupo: 7, nombre_grupo: 'Colorantes' },
    { id_grupo: 8, nombre_grupo: 'Reactivos de Biología Molecular' },
    { id_grupo: 9, nombre_grupo: 'Reactivos de Grado Comercial' },
  ];
};

export const fetchPictogramas = async () => {
  const res = await fetch(`${API_URL}/catalogos/pictogramas`);
  if (!res.ok) throw new Error('Error al cargar pictogramas');
  const json = await res.json();
  return json.datos || json.data || [];
};

export const fetchEpps = async () => {
  const res = await fetch(`${API_URL}/catalogos/epp`);
  if (!res.ok) throw new Error('Error al cargar equipos de protección');
  const json = await res.json();
  return json.datos || json.data || [];
};

export const fetchMateriales = async () => {
  const res = await fetch(`${API_URL}/catalogos/materiales`);
  if (!res.ok) throw new Error('Error al cargar materiales de envase');
  const json = await res.json();
  return json.datos || json.data || [];
};

// --- OPERACIONES WIZARD (INGESTA Y REGISTRO) ---

// 1. Envío de FDS a Gemini (Paso 1)
export const extraerFdsApi = async (archivoPdf) => {
  const formData = new FormData();
  formData.append('archivo_fds', archivoPdf);

  const res = await fetch(`${API_URL}/fds/extraer`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.mensaje || 'Error al procesar la FDS con Gemini');
  }
  return json;
};

// 2. Persistencia transaccional + subida a Storage (Paso 4)
export const crearReactivoApi = async (archivoPdf, datosReactivo) => {
  const formData = new FormData();
  formData.append('archivo_fds', archivoPdf);
  formData.append('datos', JSON.stringify(datosReactivo));

  const res = await fetch(`${API_URL}/reactivos`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.mensaje || 'Error al guardar el reactivo');
  }
  return json;
};