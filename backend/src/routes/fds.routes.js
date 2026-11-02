const { Router } = require('express');
const { uploadPdf } = require('../middlewares/upload.middleware');
const { subirFds } = require('../controllers/fds.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();

// Endpoint POST /api/fds/upload
// Protegido: Solo accesible por usuarios autenticados con rol GESTION
router.post(
  '/upload',
  authenticateToken,
  authorizeRoles('GESTION'),
  uploadPdf.single('archivo_fds'),
  subirFds
);

module.exports = router;