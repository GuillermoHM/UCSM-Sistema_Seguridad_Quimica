const { supabase } = require('../config/supabase');

// GET /api/reactivos?q=&grupo=&pictograma=
const getReactivos = async (req, res) => {
  try {
    const { q, grupo, pictograma } = req.query;

    let query = supabase
      .from('reactivo')
      .select(`
        *,
        grupo_quimico (*),
        pictograma_reactivo (
          pictograma_sga (*)
        )
      `)
      .order('nombre_quimico', { ascending: true });

    // Filtro de texto libre
    if (q) {
      const term = q.trim();
      query = query.or(
        `nombre_quimico.ilike.%${term}%,nombre_comercial.ilike.%${term}%,numero_cas.ilike.%${term}%,codigo_institucional.ilike.%${term}%`
      );
    }

    // Filtro por grupo químico
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

    // Normalizar la respuesta: extraer pictogramas a un array plano directo
    let dataFormateada = reactivos.map((r) => {
      const pictogramas = (r.pictograma_reactivo || [])
        .map((pr) => pr.pictograma_sga)
        .filter(Boolean);

      const { pictograma_reactivo, ...resto } = r;
      return {
        ...resto,
        pictogramas
      };
    });

    // Filtro por pictograma (cod_ghs ej: 'GHS02' o id_pictograma)
    if (pictograma) {
      const pictoTerm = pictograma.trim().toUpperCase();
      dataFormateada = dataFormateada.filter((r) =>
        r.pictogramas.some(
          (p) =>
            p.cod_ghs?.toUpperCase() === pictoTerm ||
            String(p.id_pictograma) === pictoTerm
        )
      );
    }

    return res.status(200).json({
      success: true,
      count: dataFormateada.length,
      data: dataFormateada
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error interno en el servidor.',
      error: err.message
    });
  }
};

// GET /api/reactivos/:identifier
const getReactivoById = async (req, res) => {
  try {
    const { id } = req.params;
    const identifier = id.trim();

    let query = supabase
      .from('reactivo')
      .select(`
        *,
        grupo_quimico (*),
        pictograma_reactivo (
          pictograma_sga (*)
        )
      `);

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

    const pictogramas = (reactivo.pictograma_reactivo || [])
      .map((pr) => pr.pictograma_sga)
      .filter(Boolean);

    let url_fds = reactivo.url_fds;
    if (!url_fds && reactivo.codigo_institucional) {
      const { data: publicUrlData } = supabase.storage
        .from('archivos_fds')
        .getPublicUrl(`fichas/${reactivo.codigo_institucional}.pdf`);

      url_fds = publicUrlData ? publicUrlData.publicUrl : null;
    }

    const { pictograma_reactivo, ...resto } = reactivo;

    return res.status(200).json({
      success: true,
      data: {
        ...resto,
        url_fds,
        pictogramas
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