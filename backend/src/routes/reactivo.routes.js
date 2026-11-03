const express = require('express');
const router = express.Router();

// Middlewares
const { uploadPdf, handleUploadError } = require('../middlewares/upload.middleware');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Controladores (una sola importación destructurada)
const {
  getReactivos,
  getReactivoById,
  crearReactivo
} = require('../controllers/reactivo.controller');

// Rutas de consulta pública / autenticada
router.get('/', getReactivos);
router.get('/:id', getReactivoById);

// Ruta de persistencia con subida de PDF
router.post(
  '/',
  authenticateToken,
  authorizeRoles('GESTION'),
  uploadPdf.single('archivo_fds'),
  handleUploadError,
  crearReactivo
);

module.exports = router;