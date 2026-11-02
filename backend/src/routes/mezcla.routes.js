const express = require('express');
const router = express.Router();
const { evaluarMezcla } = require('../controllers/mezcla.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Requiere sesión activa y admite roles ACADEMICO y GESTION
router.post(
  '/evaluar',
  authenticateToken,
  authorizeRoles('ACADEMICO', 'GESTION'),
  evaluarMezcla
);

module.exports = router;