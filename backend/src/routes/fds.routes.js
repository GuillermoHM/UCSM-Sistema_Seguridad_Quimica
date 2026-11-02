const { Router } = require('express');
const { uploadPdf, handleUploadError } = require('../middlewares/upload.middleware');
const { subirFds, extraerFds } = require('../controllers/fds.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();

// Endpoint POST /api/fds/extraer (Extracción asistida con Gemini)
// Protegido: Solo accesible por usuarios autenticados con rol GESTION
router.post(
  '/extraer',
  authenticateToken,
  authorizeRoles('GESTION'),
  uploadPdf.single('archivo_fds'),
  handleUploadError,
  extraerFds
);

// Endpoint POST /api/fds/upload (Persistencia a Supabase Storage)
// Protegido: Solo accesible por usuarios autenticados con rol GESTION
router.post(
  '/upload',
  authenticateToken,
  authorizeRoles('GESTION'),
  uploadPdf.single('archivo_fds'),
  handleUploadError,
  subirFds
);

module.exports = router;