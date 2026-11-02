const matrizService = require('../services/matriz.service');

const getMatrizGrupos = async (req, res) => {
  try {
    const data = await matrizService.obtenerMatrizGrupos();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const putReglaGrupo = async (req, res) => {
  try {
    const { id_grupo_orig, id_grupo_dest, nivel_riesgo, descripcion, medidas } = req.body;
    if (id_grupo_orig === undefined || id_grupo_dest === undefined) {
      return res.status(400).json({
        success: false,
        message: 'id_grupo_orig e id_grupo_dest son obligatorios.'
      });
    }

    const resultado = await matrizService.guardarReglaGrupo({
      id_grupo_orig,
      id_grupo_dest,
      nivel_riesgo,
      descripcion,
      medidas
    });

    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getMatrizPictogramas = async (req, res) => {
  try {
    const data = await matrizService.obtenerMatrizPictogramas();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const putReglaPictograma = async (req, res) => {
  try {
    const { id_picto_orig, id_picto_dest, restriccion, observaciones } = req.body;
    if (id_picto_orig === undefined || id_picto_dest === undefined) {
      return res.status(400).json({
        success: false,
        message: 'id_picto_orig e id_picto_dest son obligatorios.'
      });
    }

    const resultado = await matrizService.guardarReglaPictograma({
      id_picto_orig,
      id_picto_dest,
      restriccion,
      observaciones
    });

    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMatrizGrupos,
  putReglaGrupo,
  getMatrizPictogramas,
  putReglaPictograma
};