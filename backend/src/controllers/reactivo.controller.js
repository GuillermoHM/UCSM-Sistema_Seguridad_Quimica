const { supabase } = require('../config/supabase');

// GET /api/reactivos?q=&grupo=
const getReactivos = async (req, res) => {
  try {
    const { q, grupo } = req.query;

    // Selecciona todas las columnas de 'reactivo' y la relación con 'grupo_quimico'
    let query = supabase
      .from('reactivo')
      .select(`
        *,
        grupo_quimico (*)
      `)
      .order('nombre_quimico', { ascending: true });

    // Filtro libre en las 4 columnas de texto reales
    if (q) {
      const term = q.trim();
      query = query.or(
        `nombre_quimico.ilike.%${term}%,nombre_comercial.ilike.%${term}%,numero_cas.ilike.%${term}%,codigo_institucional.ilike.%${term}%`
      );
    }

    // Filtro por clave foránea de grupo químico
    if (grupo) {
      query = query.eq('id_grupo', grupo);
    }

    const { data: reactivos, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error al consultar catálogo de reactivos.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      count: reactivos.length,
      data: reactivos
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error interno en el servidor.',
      error: err.message
    });
  }
};

// GET /api/reactivos/:identifier (resuelve por codigo_institucional o por numero_cas)
const getReactivoById = async (req, res) => {
  try {
    const { id } = req.params;
    const identifier = id.trim();

    let query = supabase
      .from('reactivo')
      .select(`
        *,
        grupo_quimico (*)
      `);

    // Validación según nomenclatura oficial: 8 caracteres (ej. 26RQ0001) o numero_cas (ej. 7647-01-0)
    if (/^[0-9]{2}[A-Z]{2}[0-9]{4}$/i.test(identifier)) {
      query = query.ilike('codigo_institucional', identifier);
    } else {
      query = query.eq('numero_cas', identifier);
    }

    const { data: reactivo, error } = await query.single();

    if (error || !reactivo) {
      return res.status(404).json({
        success: false,
        message: `Reactivo no encontrado con el identificador: ${identifier}`
      });
    }

    // Si reactivo.url_fds no viene en BD, generamos el enlace de Supabase Storage
    let url_fds = reactivo.url_fds;
    if (!url_fds && reactivo.codigo_institucional) {
      const { data: publicUrlData } = supabase.storage
        .from('archivos_fds')
        .getPublicUrl(`fichas/${reactivo.codigo_institucional}.pdf`);

      url_fds = publicUrlData ? publicUrlData.publicUrl : null;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...reactivo,
        url_fds
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del reactivo.',
      error: err.message
    });
  }
};

module.exports = {
  getReactivos,
  getReactivoById
};