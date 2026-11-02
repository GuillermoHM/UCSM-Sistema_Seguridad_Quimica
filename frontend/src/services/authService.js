const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Envía credenciales al backend para autenticación y obtención de JWT
 */
export const loginRequest = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  return data; // Retorna { success, token, usuario }
};

/**
 * Consulta la sesión activa contra el endpoint /auth/me
 */
export const fetchProfileRequest = async (token) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Sesión no válida o expirada');
  }

  return data;
};