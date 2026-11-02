const { subirFdsStorage } = require('../services/storage.service');
const { extraerDatosFDS } = require('../services/gemini.service');

// Subida definitiva y persistencia a Supabase Storage (SSQ-16)
const subirFds = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se envió ningún archivo PDF en la petición'
      });
    }

    const codigo = req.body.codigo || 'DOC';
    const resultado = await subirFdsStorage(req.file, codigo);

    return res.status(201).json({
      exito: true,
      mensaje: 'FDS subida exitosamente al almacenamiento en la nube',
      url_fds: resultado.url_fds,
      ruta_storage: resultado.path
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: error.message
    });
  }
};

// Extracción asistida con Gemini API en memoria (SSQ-15)
const extraerFds = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se envió ningún archivo PDF en la petición'
      });
    }

    const datosExtraidos = await extraerDatosFDS(req.file.buffer);

    return res.status(200).json({
      exito: true,
      mensaje: 'FDS analizada y procesada exitosamente con Gemini',
      data: datosExtraidos
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      exito: false,
      mensaje: error.message || 'Error interno al procesar la FDS con Gemini'
    });
  }
};

module.exports = {
  subirFds,
  extraerFds
};