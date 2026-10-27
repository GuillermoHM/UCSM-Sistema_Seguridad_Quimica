const { Router } = require('express');
const {
  obtenerPictogramas,
  obtenerGruposQuimicos,
  obtenerEpp
} = require('../controllers/catalogo.controller');

const router = Router();

router.get('/pictogramas', obtenerPictogramas);
router.get('/grupos-quimicos', obtenerGruposQuimicos);
router.get('/epp', obtenerEpp);

module.exports = router;