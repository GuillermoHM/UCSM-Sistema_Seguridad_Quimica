const { supabase } = require('../config/supabase');
const { subirFdsStorage } = require('../services/storage.service');

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

    // Consulta relacional con grupo químico, pictogramas, EPPs y materiales de envase
    let query = supabase
      .from('reactivo')
      .select(`
        *,
        grupo_quimico (*),
        pictograma_reactivo (
          pictograma_sga (*)
        ),
        epp_reactivo (
          epp (*)
        ),
        material_reactivo (
          material_envase (*)
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

    // Aplanar relaciones a colecciones directas
    const pictogramas = (reactivo.pictograma_reactivo || [])
      .map((pr) => pr.pictograma_sga)
      .filter(Boolean);

    const epps = (reactivo.epp_reactivo || [])
      .map((er) => er.epp)
      .filter(Boolean);

    const materiales = (reactivo.material_reactivo || [])
      .map((mr) => mr.material_envase)
      .filter(Boolean);

    let url_fds = reactivo.url_fds;
    if (!url_fds && reactivo.codigo_institucional) {
      const { data: publicUrlData } = supabase.storage
        .from('archivos_fds')
        .getPublicUrl(`fichas/${reactivo.codigo_institucional}.pdf`);

      url_fds = publicUrlData ? publicUrlData.publicUrl : null;
    }

    // Desacoplar las tablas intermedias de unión del objeto final
    const {
      pictograma_reactivo,
      epp_reactivo,
      material_reactivo,
      ...resto
    } = reactivo;

    return res.status(200).json({
      success: true,
      data: {
        ...resto,
        url_fds,
        pictogramas,
        epps,
        materiales
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


const crearReactivo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requiere adjuntar el archivo PDF de la FDS.'
      });
    }

    // Los datos del formulario llegan serializados en req.body.datos
    const datos = typeof req.body.datos === 'string' ? JSON.parse(req.body.datos) : req.body.datos;

    const {
      numero_cas,
      codigo_institucional,
      nombre_quimico,
      nombre_comercial,
      formula_quimica,
      masa_molar,
      concentracion,
      presentacion,
      id_grupo,
      proc_trasvase,
      condiciones_almac,
      primeros_aux,
      control_incendio,
      control_derrame,
      pictogramas_ids = [],
      epp_ids = [],
      materiales_ids = []
    } = datos;

    // Validación de regex institucional (ej: 26RQ0001)
    if (!/^[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(codigo_institucional)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El código institucional debe cumplir el formato estandarizado (ej: 26RQ0001).'
      });
    }

    // 1. Subir archivo a Supabase Storage usando el código institucional
    const storageResult = await subirFdsStorage(req.file, codigo_institucional);
    const url_fds = storageResult.url_fds;

    // 2. Insertar reactivo principal
    const id_usuario = req.user.id_usuario || req.user.id;

    const { data: reactivoCreado, error: errorReactivo } = await supabase
      .from('reactivo')
      .insert({
        numero_cas,
        codigo_institucional,
        nombre_quimico,
        nombre_comercial: nombre_comercial || null,
        formula_quimica,
        masa_molar: masa_molar ? parseFloat(masa_molar) : null,
        concentracion,
        presentacion,
        url_fds,
        proc_trasvase: proc_trasvase || {},
        condiciones_almac: condiciones_almac || {},
        primeros_aux: primeros_aux || {},
        control_incendio: control_incendio || {},
        control_derrame: control_derrame || {},
        id_usuario_creador: id_usuario,
        id_grupo
      })
      .select()
      .single();

    if (errorReactivo) {
      throw new Error(`Error al insertar reactivo: ${errorReactivo.message}`);
    }

    // 3. Asociar Pictogramas SGA (N:M)
    if (pictogramas_ids.length > 0) {
      const insertsPicto = pictogramas_ids.map((id_picto) => ({
        cas_reactivo: numero_cas,
        id_pictograma: id_picto
      }));
      const { error: errPicto } = await supabase.from('pictograma_reactivo').insert(insertsPicto);
      if (errPicto) console.error('Error asociando pictogramas:', errPicto.message);
    }

    // 4. Asociar EPPs (N:M)
    if (epp_ids.length > 0) {
      const insertsEpp = epp_ids.map((idEpp) => ({
        cas_reactivo: numero_cas,
        id_epp: idEpp
      }));
      const { error: errEpp } = await supabase.from('epp_reactivo').insert(insertsEpp);
      if (errEpp) console.error('Error asociando EPPs:', errEpp.message);
    }

    // 5. Asociar Materiales de Envase (N:M)
    if (materiales_ids.length > 0) {
      const insertsMat = materiales_ids.map((idMat) => ({
        cas_reactivo: numero_cas,
        id_material: idMat
      }));
      const { error: errMat } = await supabase.from('material_reactivo').insert(insertsMat);
      if (errMat) console.error('Error asociando materiales:', errMat.message);
    }

    return res.status(201).json({
      exito: true,
      mensaje: 'Reactivo registrado exitosamente con sus relaciones y FDS alojada.',
      datos: reactivoCreado
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: error.message
    });
  }
};

module.exports = {
  getReactivos,
  getReactivoById,
  crearReactivo
};