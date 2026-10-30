// 1. Importación CommonJS de la configuración de Supabase
const supabaseModule = require('../config/supabase');
const supabase = supabaseModule.supabase || supabaseModule;

const PESO_GRUPO = {
  ROJO: 3,
  AMARILLO: 2,
  VERDE: 1
};

// Clasificación de severidad basada únicamente en la columna nivel_riesgo
const mapearRiesgoGrupo = (nivel) => {
  if (!nivel) return { severidad: 'VERDE', etiqueta: 'Compatible' };
  const n = nivel.toLowerCase().trim();
  if (n.includes('crítico') || n.includes('critico') || n.includes('severo')) {
    return { severidad: 'ROJO', etiqueta: 'Incompatible' };
  }
  if (n.includes('moderado')) {
    return { severidad: 'AMARILLO', etiqueta: 'Precaución' };
  }
  return { severidad: 'VERDE', etiqueta: 'Compatible' };
};

const evaluarMezclaReactivos = async (codigosReactivos = []) => {
  if (!Array.isArray(codigosReactivos) || codigosReactivos.length < 2 || codigosReactivos.length > 3) {
    throw new Error('Debes seleccionar entre 2 y 3 reactivos para evaluar.');
  }

  // 1. Consultar reactivos con sus grupos y pictogramas
  const { data: reactivos, error: errReactivos } = await supabase
    .from('reactivo')
    .select(`
      numero_cas,
      codigo_institucional,
      nombre_quimico,
      formula_quimica,
      id_grupo,
      grupo_quimico:id_grupo ( id_grupo, nombre_grupo ),
      pictograma_reactivo (
        id_pictograma,
        pictograma_sga:id_pictograma ( id_pictograma, cod_ghs, peligro )
      )
    `)
    .in('codigo_institucional', codigosReactivos);

  if (errReactivos || !reactivos || reactivos.length !== codigosReactivos.length) {
    throw new Error('Uno o más reactivos no existen en la base de datos.');
  }

  // 2. Generar pares combinatorios C(n, 2)
  const pares = [];
  for (let i = 0; i < reactivos.length; i++) {
    for (let j = i + 1; j < reactivos.length; j++) {
      pares.push([reactivos[i], reactivos[j]]);
    }
  }

  // Pre-cargar matriz de pictogramas para evaluación simétrica
  const { data: matrizPictos } = await supabase
    .from('incompatibilidad_pictograma')
    .select('*');

  let maxPesoGlobal = 1;
  const paresEvaluados = [];

  // 3. Evaluar cada par binario (A x B)
  for (const [rA, rB] of pares) {
    const grupoA = rA.grupo_quimico?.nombre_grupo || 'Desconocido';
    const grupoB = rB.grupo_quimico?.nombre_grupo || 'Desconocido';

    // --- A. EVALUACIÓN POR GRUPO QUÍMICO (Determina el color del semáforo) ---
    let evaluacionGrupo = {
      severidad: 'VERDE',
      etiqueta: 'Compatible',
      consecuencias: rA.id_grupo === rB.id_grupo
        ? 'Mismo grupo químico: sin riesgo de incompatibilidad.'
        : 'No se registran incompatibilidades directas entre estos grupos.',
      contramedidas: 'Manipulación estándar con EPP reglamentario.'
    };

    if (rA.id_grupo !== rB.id_grupo) {
      // Búsqueda simétrica en la tabla Incompatibilidad_GrupoQ
      const { data: reglasGrupo, error: errG } = await supabase
        .from('incompatibilidad_grupoq')
        .select('*')
        .or(`and(id_grupo_orig.eq.${rA.id_grupo},id_grupo_dest.eq.${rB.id_grupo}),and(id_grupo_orig.eq.${rB.id_grupo},id_grupo_dest.eq.${rA.id_grupo})`);

      if (!errG && reglasGrupo && reglasGrupo.length > 0) {
        const regla = reglasGrupo[0];
        const clasif = mapearRiesgoGrupo(regla.nivel_riesgo);
        evaluacionGrupo = {
          severidad: clasif.severidad,
          etiqueta: clasif.etiqueta,
          consecuencias: regla.descripcion ? regla.descripcion.trim() : 'Reacción química no especificada.',
          contramedidas: regla.medidas ? regla.medidas.trim() : 'Almacenar y manipular en áreas separadas.'
        };
      }
    }

    const pesoActual = PESO_GRUPO[evaluacionGrupo.severidad];
    if (pesoActual > maxPesoGlobal) {
      maxPesoGlobal = pesoActual;
    }

    // --- B. EVALUACIÓN POR PICTOGRAMAS SGA ---
    const pictosA = (rA.pictograma_reactivo || []).map(p => p.id_pictograma);
    const pictosB = (rB.pictograma_reactivo || []).map(p => p.id_pictograma);

    let evaluacionPictogramas = {
      tiene_restriccion: false,
      advertencias: 'Sin restricciones de segregación GHS identificadas.',
      detalles: []
    };

    if (pictosA.length > 0 && pictosB.length > 0 && matrizPictos) {
      // 1. Encontrar cruces entre los pictogramas de ambos reactivos
      const cruces = matrizPictos.filter(regla =>
        (pictosA.includes(regla.id_picto_orig) && pictosB.includes(regla.id_picto_dest)) ||
        (pictosB.includes(regla.id_picto_orig) && pictosA.includes(regla.id_picto_dest))
      );

      if (cruces.length > 0) {
        // 2. Extraer observaciones únicas eliminando repeticiones bidireccionales
        const observacionesUnicas = [
          ...new Set(
            cruces
              .map(c => c.observaciones?.trim())
              .filter(Boolean)
          )
        ];

        // 3. Extraer detalles únicos (por restricción y observación)
        const detallesUnicos = [];
        const paresVistos = new Set();

        cruces.forEach(c => {
          const restr = c.restriccion ? c.restriccion.trim() : 'Restricción no especificada';
          const obs = c.observaciones ? c.observaciones.trim() : '';
          const clave = `${restr}:::${obs}`;

          if (!paresVistos.has(clave)) {
            paresVistos.add(clave);
            detallesUnicos.push({ restriccion: restr, observaciones: obs });
          }
        });

        evaluacionPictogramas = {
          tiene_restriccion: true,
          advertencias: observacionesUnicas.join('. ') || 'Requiere segregación física preventiva.',
          detalles: detallesUnicos
        };
      }
    }

    paresEvaluados.push({
      par_titulo: `${rA.formula_quimica} + ${rB.formula_quimica}`,
      grupos_titulo: `${grupoA} × ${grupoB}`,
      reactivo_a: {
        codigo: rA.codigo_institucional,
        nombre: rA.nombre_quimico,
        formula: rA.formula_quimica,
        grupo: grupoA
      },
      reactivo_b: {
        codigo: rB.codigo_institucional,
        nombre: rB.nombre_quimico,
        formula: rB.formula_quimica,
        grupo: grupoB
      },
      evaluacion_grupo: evaluacionGrupo,
      evaluacion_pictogramas: evaluacionPictogramas
    });
  }

  const estadoGlobal = Object.keys(PESO_GRUPO).find(k => PESO_GRUPO[k] === maxPesoGlobal);
  let tituloGlobal = 'Mezcla Compatible';
  let mensajeGlobal = 'No se detectan conflictos entre los grupos químicos seleccionados.';

  if (estadoGlobal === 'ROJO') {
    tituloGlobal = 'Mezcla Incompatible';
    mensajeGlobal = 'Se identificaron riesgos críticos/severos de reactividad entre los reactivos seleccionados.';
  } else if (estadoGlobal === 'AMARILLO') {
    tituloGlobal = 'Mezcla con Precaución';
    mensajeGlobal = 'Existen advertencias moderadas de reactividad. Aplicar contramedidas específicas.';
  }

  return {
    semaforo_global: estadoGlobal,
    titulo_global: tituloGlobal,
    mensaje_global: mensajeGlobal,
    pares: paresEvaluados
  };
};

module.exports = {
  evaluarMezclaReactivos
};