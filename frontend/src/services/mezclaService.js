const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token_ucsm');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const evaluarMezclaApi = async (codigosInstitucionales = []) => {
  const response = await fetch(`${API_URL}/mezclas/evaluar`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reactivos: codigosInstitucionales })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Error al evaluar la compatibilidad de la mezcla.');
  }

  return json.data;
};