const jwt = require('jsonwebtoken');

// Verifica la validez y vigencia del JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado: Token de autorización no provisto.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }
};

// Restringe el acceso a roles específicos ('GESTION', 'ACADEMICO')
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