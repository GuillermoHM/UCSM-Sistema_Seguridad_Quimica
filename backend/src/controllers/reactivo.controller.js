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

// PUT /api/reactivos/:cas
const actualizarReactivo = async (req, res) => {
  try {
    const { cas } = req.params;

    // 1. Parsear datos si vienen como form-data (con archivo) o JSON directo
    let datos = req.body.datos ? JSON.parse(req.body.datos) : req.body;

    // 2. Criterio de aceptación 1: Bloqueo de modificación sobre numero_cas
    delete datos.numero_cas;

    // 3. Verificar existencia del reactivo
    const { data: reactivoExistente, error: errBusqueda } = await supabase
      .from('reactivo')
      .select('numero_cas, codigo_institucional, url_fds')
      .eq('numero_cas', cas)
      .single();

    if (errBusqueda || !reactivoExistente) {
      return res.status(404).json({ exito: false, mensaje: 'Reactivo no encontrado para editar.' });
    }

    let urlFdsFinal = reactivoExistente.url_fds;

    // 4. Criterio 3: Reemplazo de archivo PDF y eliminación de huérfano
    if (req.file) {
      // Subir el nuevo archivo
      const fileExt = req.file.originalname.split('.').pop() || 'pdf';
      const codLimpio = (datos.codigo_institucional || reactivoExistente.codigo_institucional).toLowerCase();
      const nuevoPath = `fichas/fds-${codLimpio}-${Date.now()}.${fileExt}`;

      const { error: errUpload } = await supabase.storage
        .from('archivos_fds')
        .upload(nuevoPath, req.file.buffer, {
          contentType: req.file.mimetype || 'application/pdf',
          upsert: true
        });

      if (errUpload) throw new Error(`Error al subir nuevo PDF: ${errUpload.message}`);

      // Obtener nueva URL pública
      const { data: urlData } = supabase.storage
        .from('archivos_fds')
        .getPublicUrl(nuevoPath);
      urlFdsFinal = urlData.publicUrl;

      // Eliminar el archivo huérfano anterior si existía
      if (reactivoExistente.url_fds) {
        try {
          const partesUrl = reactivoExistente.url_fds.split('/archivos_fds/');
          if (partesUrl.length > 1) {
            const oldPath = decodeURIComponent(partesUrl[1]);
            await supabase.storage.from('archivos_fds').remove([oldPath]);
          }
        } catch (errRemove) {
          console.warn('No se pudo borrar el PDF antiguo de Storage:', errRemove.message);
        }
      }
    }

    // 5. Preparar actualización de la tabla reactivo
    const datosActualizar = {
      nombre_quimico: datos.nombre_quimico,
      nombre_comercial: datos.nombre_comercial || null,
      formula_quimica: datos.formula_quimica,
      masa_molar: datos.masa_molar ? parseFloat(datos.masa_molar) : null,
      concentracion: datos.concentracion,
      presentacion: datos.presentacion,
      id_grupo: datos.id_grupo ? parseInt(datos.id_grupo) : null,
      condiciones_almac: datos.condiciones_almac || null,
      proc_trasvase: datos.proc_trasvase || [],
      primeros_aux: datos.primeros_aux || [],
      control_incendio: datos.control_incendio || [],
      control_derrame: datos.control_derrame || [],
      url_fds: urlFdsFinal
    };

    if (datos.codigo_institucional) {
      datosActualizar.codigo_institucional = datos.codigo_institucional.toUpperCase();
    }

    const { error: errUpdate } = await supabase
      .from('reactivo')
      .update(datosActualizar)
      .eq('numero_cas', cas);

    if (errUpdate) throw errUpdate;

    // 6. Actualizar relaciones N:M solo si vienen definidas en el payload
    if (Array.isArray(datos.pictogramas_ids)) {
      await supabase.from('pictograma_reactivo').delete().eq('numero_cas', cas);
      if (datos.pictogramas_ids.length > 0) {
        const filas = datos.pictogramas_ids.map((id) => ({ numero_cas: cas, id_pictograma: id }));
        await supabase.from('pictograma_reactivo').insert(filas);
      }
    }

    if (Array.isArray(datos.epp_ids)) {
      await supabase.from('epp_reactivo').delete().eq('numero_cas', cas);
      if (datos.epp_ids.length > 0) {
        const filas = datos.epp_ids.map((id) => ({ numero_cas: cas, id_epp: id }));
        await supabase.from('epp_reactivo').insert(filas);
      }
    }

    if (Array.isArray(datos.materiales_ids)) {
      await supabase.from('material_reactivo').delete().eq('numero_cas', cas);
      if (datos.materiales_ids.length > 0) {
        const filas = datos.materiales_ids.map((id) => ({ numero_cas: cas, id_material: id }));
        await supabase.from('material_reactivo').insert(filas);
      }
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'Reactivo actualizado exitosamente.',
      codigo_institucional: datosActualizar.codigo_institucional || reactivoExistente.codigo_institucional
    });
  } catch (error) {
    console.error('Error al actualizar reactivo:', error);
    return res.status(500).json({ exito: false, mensaje: error.message });
  }
};

module.exports = {
  getReactivos,
  getReactivoById,
  crearReactivo,
  actualizarReactivo
};