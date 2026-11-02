const express = require('express');
const router = express.Router();
const {
  getMatrizGrupos,
  putReglaGrupo,
  getMatrizPictogramas,
  putReglaPictograma
} = require('../controllers/matriz.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Protección transversal: Solo usuarios autenticados con rol GESTION
router.use(authenticateToken, authorizeRoles('GESTION'));

// Matriz por Grupos Químicos
router.get('/grupos', getMatrizGrupos);
router.put('/grupos', putReglaGrupo);

// Matriz por Pictogramas SGA
router.get('/pictogramas', getMatrizPictogramas);
router.put('/pictogramas', putReglaPictograma);

module.exports = router;