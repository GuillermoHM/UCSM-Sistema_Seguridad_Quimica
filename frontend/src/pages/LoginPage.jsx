import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Microscope, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    
    // Validación de dominio institucional antes del envío al backend
    if (!cleanEmail.endsWith('@ucsm.edu.pe')) {
      setErrorMsg('Acceso restringido: Solo se permiten correos institucionales (@ucsm.edu.pe).');
      return;
    }

    const res = await login(cleanEmail, password);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.message || 'Credenciales inválidas.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gray-50/50">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        
        {/* Logotipo / Cabecera */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 border border-gray-300 rounded-2xl flex items-center justify-center mb-4 shadow-2xs">
            <Microscope className="w-7 h-7 text-gray-800" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Sistema de Seguridad Química UCSM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Universidad Católica de Santa María
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="mb-5 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo Institucional
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ucsm.edu.pe"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-10 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Validando...' : '[ Iniciar Sesión ]'}
          </button>

          {/* Botón Secundario / Retorno */}
          <Link
            to="/"
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-200/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio (Consulta rápida)
          </Link>
        </form>

      </div>
    </div>
  );
};