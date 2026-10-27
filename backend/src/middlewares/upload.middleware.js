const multer = require('multer');

// Almacenamiento en memoria volátil (RAM)
const storage = multer.memoryStorage();

// Filtro estricto: solo admitir documentos PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido: El archivo debe ser un documento PDF (.pdf)'), false);
  }
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // Límite de 15 MB
  }
});

module.exports = { uploadPdf };