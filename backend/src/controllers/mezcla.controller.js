const { evaluarMezclaReactivos } = require('../services/mezcla.service');

const evaluarMezcla = async (req, res) => {
  try {
    const { reactivos } = req.body;

    if (!reactivos || !Array.isArray(reactivos) || reactivos.length < 2 || reactivos.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Debes enviar un arreglo de 2 o 3 reactivos.'
      });
    }

    const resultado = await evaluarMezclaReactivos(reactivos);

    return res.status(200).json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error al evaluar mezcla:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error interno en la evaluación de mezclas.'
    });
  }
};

module.exports = {
  evaluarMezcla
};