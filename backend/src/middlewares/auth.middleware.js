const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado: Token de autorización no provisto.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id_usuario, email, nombres, apellidos, rol }
    next();
  } catch (error) {
    // 401 para cumplir el criterio de aceptación ante token inválido o expirado
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido. Se requiere rol: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };