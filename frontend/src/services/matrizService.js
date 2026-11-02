const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token_ucsm');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// --- Matriz Grupos Químicos ---
export const fetchMatrizGrupos = async () => {
  const res = await fetch(`${API_URL}/matriz/grupos`, {
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al obtener matriz de grupos');
  return json.data;
};

export const updateReglaGrupo = async (regla) => {
  const res = await fetch(`${API_URL}/matriz/grupos`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(regla)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar regla de grupo');
  return json.data;
};

// --- Matriz Pictogramas SGA ---
export const fetchMatrizPictogramas = async () => {
  const res = await fetch(`${API_URL}/matriz/pictogramas`, {
    headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al obtener matriz de pictogramas');
  return json.data;
};

export const updateReglaPictograma = async (regla) => {
  const res = await fetch(`${API_URL}/matriz/pictogramas`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(regla)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar regla de pictograma');
  return json.data;
};