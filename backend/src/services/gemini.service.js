const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const fdsResponseSchema = {
  type: 'OBJECT',
  properties: {
    es_fds_valida: {
      type: 'BOOLEAN',
      description: 'true si el documento es una FDS/MSDS legible. false si es ilegible, degradada o ajena.'
    },
    motivo_invalidez: {
      type: 'STRING',
      description: 'Motivo técnico si es_fds_valida es false. Cadena vacía si es válida.'
    },

    // 1. Identificación y Especificaciones Fisicoquímicas
    numero_cas: {
      type: 'STRING',
      description: 'Número de registro CAS (ej: 7647-01-0).'
    },
    nombre_quimico: {
      type: 'STRING',
      description: 'Nombre químico oficial o de la sustancia según la sección 1 o 3.'
    },
    nombre_comercial: {
      type: 'STRING',
      description: 'Nombre comercial, marca o denominación del producto según la sección 1.'
    },
    formula_quimica: {
      type: 'STRING',
      description: 'Fórmula molecular lineal (ej: HCl, C14H14N3NaO3S). Cadena vacía si no aplica.'
    },
    masa_molar: {
      type: 'NUMBER',
      description: 'Masa molar en g/mol numérica (ej: 36.46). 0 si no figura.'
    },
    concentracion: {
      type: 'STRING',
      description: 'Concentración o pureza declarada (ej: 37% p.a., 99.5%, P.A.).'
    },
    presentacion: {
      type: 'STRING',
      description: 'Envase o forma física habitual descrita (ej: Frasco de vidrio, Botella PEAD). Si no se especifica, dejar "No especificada".'
    },

    // 2. Peligros SGA (Estándar fijo universal)
    pictogramas_sga: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Códigos GHS presentes en sección 2: GHS01 a GHS09 exclusivamente. Array vacío si no presenta.'
    },

    // 3. Guía de EPP (Human-in-the-loop)
    resumen_epp_texto: {
      type: 'STRING',
      description: 'Síntesis breve de 2 líneas sobre la protección requerida según sección 8 (ojos, manos, respiratoria, cuerpo).'
    },

    // 4. Bloques para columnas JSONB de la base de datos
    condiciones_almac: {
      type: 'STRING',
      description: 'Síntesis concisa de 1 a 2 líneas sobre condiciones de almacenamiento, temperatura y recipientes prohibidos.'
    },
    proc_trasvase: {
      type: 'STRING',
      description: 'Indicaciones breves sobre ventilación o campana de extracción durante la manipulación y fraccionamiento.'
    },
    primeros_aux: {
      type: 'STRING',
      description: 'Protocolo conciso en un párrafo: Inhalación, Contacto con Piel, Ojos e Ingestión.'
    },
    control_incendio: {
      type: 'STRING',
      description: 'Medios de extinción adecuados y peligros térmicos derivados.'
    },
    control_derrame: {
      type: 'STRING',
      description: 'Procedimiento de absorción o neutralización ante fugas o derrames.'
    }
  },
  required: [
    'es_fds_valida',
    'numero_cas',
    'nombre_quimico',
    'nombre_comercial',
    'formula_quimica',
    'masa_molar',
    'concentracion',
    'presentacion',
    'pictogramas_sga',
    'resumen_epp_texto',
    'condiciones_almac',
    'proc_trasvase',
    'primeros_aux',
    'control_incendio',
    'control_derrame'
  ]
};

const extraerDatosFDS = async (pdfBuffer) => {
  try {
    const base64Data = pdfBuffer.toString('base64');

    const prompt = `
      Eres un perito químico universitario y especialista en Fichas de Datos de Seguridad (FDS/MSDS) bajo el Sistema Globalmente Armonizado (SGA).
      Analiza el documento PDF adjunto y extrae con máxima rigurosidad técnica la información requerida.

      Reglas:
      1. Extrae número CAS, nombre químico, nombre comercial, fórmula lineal, masa molar numérica, concentración y presentación sugerida.
      2. En pictogramas_sga incluye únicamente los códigos estándar identificados en la sección 2: GHS01, GHS02, GHS03, GHS04, GHS05, GHS06, GHS07, GHS08, GHS09.
      3. En resumen_epp_texto resume de forma concisa los requerimientos de protección de la sección 8 para orientar al operador del laboratorio.
      4. Para condiciones_almac, proc_trasvase, primeros_aux, control_incendio y control_derrame genera resúmenes operativos directos y concisos de un solo párrafo sin adornos.
      5. Normalización lingüística (Crítico): Si el PDF está en inglés u otro idioma, traduce obligatoriamente el "nombre_quimico" y todos los textos explicativos (primeros auxilios, EPP, almacenamiento, incendios, derrames, trasvase) a español técnico formal de laboratorio. Conserva inalterados el número CAS, las fórmulas moleculares lineales y las marcas comerciales o grados analíticos (ej. EMSURE, ACS, Ph Eur).
      6. Si el documento no es legible o no corresponde a una FDS, marca "es_fds_valida": false y explica la causa en "motivo_invalidez".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'application/pdf'
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: fdsResponseSchema,
        temperature: 0.1
      }
    });

    const parsedData = JSON.parse(response.text);

    if (!parsedData.es_fds_valida) {
      const err = new Error(parsedData.motivo_invalidez || 'FDS ilegible o no válida.');
      err.status = 422;
      throw err;
    }

    return parsedData;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(`Error en el servicio de extracción Gemini: ${error.message}`);
  }
};

module.exports = { extraerDatosFDS };