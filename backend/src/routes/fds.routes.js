const { Router } = require('express');
const { uploadPdf } = require('../middlewares/upload.middleware');
const { subirFds } = require('../controllers/fds.controller');

const router = Router();

// Endpoint POST /api/fds/upload (espera el archivo en el campo 'archivo_fds')
router.post('/upload', uploadPdf.single('archivo_fds'), subirFds);

module.exports = router;