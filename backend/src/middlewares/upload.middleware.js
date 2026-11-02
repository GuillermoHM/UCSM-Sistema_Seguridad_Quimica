const multer = require('multer');

// Almacenamiento en memoria volátil (RAM)
const storage = multer.memoryStorage();

// Filtro estricto: solo admitir documentos PDF (application/pdf)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Formato no permitido: El archivo debe ser un documento PDF (.pdf)');
    error.status = 400;
    cb(error, false);
  }
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite estricto de 10 MB según SSQ-15
  }
});

// Middleware para atrapar excepciones de Multer (ej: límite de tamaño excedido)
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo permitido de 10 MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error en la subida del archivo: ${err.message}`
    });
  }

  if (err) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message
    });
  }

  next();
};

module.exports = {
  uploadPdf,
  uploadFDS: uploadPdf, // Alias de conveniencia
  handleUploadError
};