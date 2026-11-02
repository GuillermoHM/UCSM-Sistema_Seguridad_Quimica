import { useState } from 'react';
import { AuthContext } from './authContextBase';
import { loginRequest } from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token_ucsm') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_ucsm');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);

      localStorage.setItem('token_ucsm', data.token);
      localStorage.setItem('user_ucsm', JSON.stringify(data.usuario));
      
      setToken(data.token);
      setUser(data.usuario);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token_ucsm');
    localStorage.removeItem('user_ucsm');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        esGestion: user?.rol === 'GESTION',
        esAcademico: user?.rol === 'ACADEMICO',
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};