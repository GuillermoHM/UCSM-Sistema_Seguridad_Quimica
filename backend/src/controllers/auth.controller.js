const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validación de campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar correo institucional y contraseña.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Validación de dominio institucional UCSM
    if (!cleanEmail.endsWith('@ucsm.edu.pe')) {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido: Solo se permiten correos institucionales (@ucsm.edu.pe).'
      });
    }

    // 3. Consulta a la tabla usuario_laboratorio
    const { data: usuario, error } = await supabase
      .from('usuario_laboratorio')
      .select('id_usuario, nombres, apellidos, email, password_hash, rol')
      .eq('email', cleanEmail)
      .single();

    if (error || !usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // 4. Comparación de contraseña con hash
    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // 5. Generación del JWT
    const payload = {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error interno en el servidor de autenticación.',
      error: err.message
    });
  }
};

// Endpoint para verificar sesión activa y datos de usuario logueado
const getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    usuario: req.user
  });
};

module.exports = { login, getProfile };