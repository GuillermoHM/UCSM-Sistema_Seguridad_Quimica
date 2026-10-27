const { supabase } = require('../config/supabase');

const obtenerPictogramas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pictograma_sga')
      .select('id_pictograma, cod_ghs, peligro, url_icon')
      .order('id_pictograma');

    if (error) throw error;
    return res.status(200).json({ exito: true, datos: data });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: error.message });
  }
};

const obtenerGruposQuimicos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grupo_quimico')
      .select('id_grupo, nombre_grupo, descripcion')
      .order('id_grupo');

    if (error) throw error;
    return res.status(200).json({ exito: true, datos: data });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: error.message });
  }
};

const obtenerEpp = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('epp')
      .select('cod_epp, nombre, propiedades')
      .order('nombre');

    if (error) throw error;
    return res.status(200).json({ exito: true, datos: data });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: error.message });
  }
};

module.exports = {
  obtenerPictogramas,
  obtenerGruposQuimicos,
  obtenerEpp
};