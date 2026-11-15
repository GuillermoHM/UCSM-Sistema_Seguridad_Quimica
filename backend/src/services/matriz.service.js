const supabaseModule = require('../config/supabase');
const supabase = supabaseModule.supabase || supabaseModule;

// ==========================================
// 1. MATRIZ POR GRUPOS QUÍMICOS
// ==========================================

const obtenerMatrizGrupos = async () => {
  const { data: grupos, error: errGrupos } = await supabase
    .from('grupo_quimico')
    .select('id_grupo, nombre_grupo, descripcion')
    .order('id_grupo', { ascending: true });

  if (errGrupos) throw new Error('Error al obtener grupos químicos: ' + errGrupos.message);

  const { data: reglas, error: errReglas } = await supabase
    .from('incompatibilidad_grupoq')
    .select('id_grupo_orig, id_grupo_dest, nivel_riesgo, descripcion, medidas');

  if (errReglas) throw new Error('Error al obtener matriz de grupos: ' + errReglas.message);

  return {
    grupos: grupos || [],
    reglas: reglas || []
  };
};

const guardarReglaGrupo = async ({ id_grupo_orig, id_grupo_dest, nivel_riesgo, descripcion, medidas }) => {
  const orig = parseInt(id_grupo_orig, 10);
  const dest = parseInt(id_grupo_dest, 10);

  if (isNaN(orig) || isNaN(dest)) {
    throw new Error('Los identificadores de grupo deben ser números válidos.');
  }

  const riesgoLimpio = nivel_riesgo ? nivel_riesgo.trim() : '';
  const descLimpia = descripcion ? descripcion.trim() : '';
  const medLimpia = medidas ? medidas.trim() : '';

  const esCompatible = !riesgoLimpio || riesgoLimpio.toLowerCase() === 'compatible';
  const tieneContenido = descLimpia !== '' || medLimpia !== '';

  // Caso 1: Compatible SIN notas técnicas -> Eliminar registro (matriz dispersa por defecto)
  if (esCompatible && !tieneContenido) {
    const { error: errDel } = await supabase
      .from('incompatibilidad_grupoq')
      .delete()
      .or(`and(id_grupo_orig.eq.${orig},id_grupo_dest.eq.${dest}),and(id_grupo_orig.eq.${dest},id_grupo_dest.eq.${orig})`);

    if (errDel) throw new Error('Error al limpiar regla de grupo: ' + errDel.message);
    return { accion: 'eliminado', id_grupo_orig: orig, id_grupo_dest: dest };
  }

  // Caso 2: Compatible CON notas O con riesgo activo -> Persistir vía UPSERT
  const nivelFinal = esCompatible ? 'Compatible' : riesgoLimpio;

  const payloadBase = {
    nivel_riesgo: nivelFinal,
    descripcion: descLimpia,
    medidas: medLimpia
  };

  const registros = [
    { id_grupo_orig: orig, id_grupo_dest: dest, ...payloadBase }
  ];

  if (orig !== dest) {
    registros.push({
      id_grupo_orig: dest,
      id_grupo_dest: orig,
      ...payloadBase
    });
  }

  const { data, error: errUpsert } = await supabase
    .from('incompatibilidad_grupoq')
    .upsert(registros, { onConflict: 'id_grupo_orig,id_grupo_dest' })
    .select();

  if (errUpsert) throw new Error('Error al guardar regla de grupo: ' + errUpsert.message);
  return { accion: 'guardado', registros: data };
};

// ==========================================
// 2. MATRIZ POR PICTOGRAMAS SGA
// ==========================================

const obtenerMatrizPictogramas = async () => {
  const { data: pictogramas, error: errPicto } = await supabase
    .from('pictograma_sga')
    .select('id_pictograma, cod_ghs, peligro, url_icon')
    .order('id_pictograma', { ascending: true });

  if (errPicto) throw new Error('Error al obtener pictogramas SGA: ' + errPicto.message);

  const { data: reglas, error: errReglas } = await supabase
    .from('incompatibilidad_pictograma')
    .select('id_picto_orig, id_picto_dest, restriccion, observaciones');

  if (errReglas) throw new Error('Error al obtener matriz de pictogramas: ' + errReglas.message);

  return {
    pictogramas: pictogramas || [],
    reglas: reglas || []
  };
};

const guardarReglaPictograma = async ({ id_picto_orig, id_picto_dest, restriccion, observaciones }) => {
  const orig = parseInt(id_picto_orig, 10);
  const dest = parseInt(id_picto_dest, 10);

  if (isNaN(orig) || isNaN(dest)) {
    throw new Error('Los identificadores de pictograma deben ser números válidos.');
  }

  const restLimpia = restriccion ? restriccion.trim() : '';
  const obsLimpia = observaciones ? observaciones.trim() : '';

  const esPermitido = !restLimpia || 
                      restLimpia.toLowerCase() === 'permitido' || 
                      restLimpia.toLowerCase() === 'compatible';
  const tieneObservaciones = obsLimpia !== '';

  // Caso 1: Permitido SIN observaciones -> Limpiar fila
  if (esPermitido && !tieneObservaciones) {
    const { error: errDel } = await supabase
      .from('incompatibilidad_pictograma')
      .delete()
      .or(`and(id_picto_orig.eq.${orig},id_picto_dest.eq.${dest}),and(id_picto_orig.eq.${dest},id_picto_dest.eq.${orig})`);

    if (errDel) throw new Error('Error al limpiar regla de pictograma: ' + errDel.message);
    return { accion: 'eliminado', id_picto_orig: orig, id_picto_dest: dest };
  }

  // Caso 2: Con restricción activa O permitido con observaciones -> Guardar
  const restriccionFinal = esPermitido ? 'PERMITIDO' : restLimpia;

  const payloadBase = {
    restriccion: restriccionFinal,
    observaciones: obsLimpia
  };

  const registros = [
    { id_picto_orig: orig, id_picto_dest: dest, ...payloadBase }
  ];

  if (orig !== dest) {
    registros.push({
      id_picto_orig: dest,
      id_picto_dest: orig,
      ...payloadBase
    });
  }

  const { data, error: errUpsert } = await supabase
    .from('incompatibilidad_pictograma')
    .upsert(registros, { onConflict: 'id_picto_orig,id_picto_dest' })
    .select();

  if (errUpsert) throw new Error('Error al guardar regla de pictograma: ' + errUpsert.message);
  return { accion: 'guardado', registros: data };
};

module.exports = {
  obtenerMatrizGrupos,
  guardarReglaGrupo,
  obtenerMatrizPictogramas,
  guardarReglaPictograma
};