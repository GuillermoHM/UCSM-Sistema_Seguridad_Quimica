const { subirFdsStorage } = require('../services/storage.service');

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

module.exports = { subirFds };