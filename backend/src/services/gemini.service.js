const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Esquema de datos estricto para extracción normalizada de FDS (SSQ-15)
const fdsResponseSchema = {
  type: 'OBJECT',
  properties: {
    es_fds_valida: {
      type: 'BOOLEAN',
      description: 'true si el documento es una Ficha de Datos de Seguridad / MSDS legible y contiene información de un reactivo. false si es ilegible o no es una FDS.'
    },
    motivo_invalidez: {
      type: 'STRING',
      description: 'Explicación técnica si es_fds_valida es false (ej: texto ilegible, escaneo degradado, documento ajeno). Cadena vacía si es válida.'
    },
    numero_cas: {
      type: 'STRING',
      description: 'Número de registro CAS estandarizado (formato XXXXXXX-XX-X). Si no existe o no aplica, string vacío.'
    },
    nombre_oficial: {
      type: 'STRING',
      description: 'Nombre químico oficial o de la sustancia según la sección 1 o 3.'
    },
    formula_quimica: {
      type: 'STRING',
      description: 'Fórmula molecular lineal (ej: H2SO4, NaOH). Si no está disponible, string vacío.'
    },
    concentracion: {
      type: 'STRING',
      description: 'Pureza o concentración declarada (ej: 98%, >= 99.5%, P.A.).'
    },
    pictogramas_sga: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Códigos GHS identificados en la sección 2 (GHS01 a GHS09). Array vacío si no presenta.'
    },
    epp_recomendado: {
      type: 'OBJECT',
      properties: {
        proteccion_ocular: { type: 'STRING', description: 'Gafas de seguridad, pantalla facial, etc.' },
        proteccion_manos: { type: 'STRING', description: 'Tipo de guantes recomendados (ej: nitrilo, neopreno).' },
        proteccion_respiratoria: { type: 'STRING', description: 'Tipo de respirador o filtro según sección 8.' },
        proteccion_cuerpo: { type: 'STRING', description: 'Bata de laboratorio, mandil, traje de protección.' }
      },
      required: ['proteccion_ocular', 'proteccion_manos', 'proteccion_respiratoria', 'proteccion_cuerpo']
    }
  },
  required: [
    'es_fds_valida',
    'numero_cas',
    'nombre_oficial',
    'formula_quimica',
    'concentracion',
    'pictogramas_sga',
    'epp_recomendado'
  ]
};

/**
 * Procesa el buffer binario de un PDF de FDS y extrae sus atributos químicos mediante Gemini
 * @param {Buffer} pdfBuffer - Buffer binario provisto por Multer
 * @returns {Promise<Object>} Datos estructurados extraídos
 */
const extraerDatosFDS = async (pdfBuffer) => {
  try {
    const base64Data = pdfBuffer.toString('base64');

    const prompt = `
      Eres un perito químico universitario especializado en Fichas de Datos de Seguridad (FDS/MSDS) bajo el Sistema Globalmente Armonizado (SGA).
      Analiza minuciosamente el documento PDF adjunto (habitualmente de fabricantes como Sigma-Aldrich, Merck, Panreac o similares).
      
      Reglas críticas:
      1. Extrae los datos con máxima fidelidad técnica.
      2. Si el PDF es un escaneo con resolución degradada, texto borroso o corrupto que impide identificar con certeza la sustancia y sus peligros, marca "es_fds_valida": false y describe la limitación en "motivo_invalidez".
      3. Para "pictogramas_sga", devuelve exclusivamente los identificadores estándar en mayúsculas: GHS01, GHS02, GHS03, GHS04, GHS05, GHS06, GHS07, GHS08, GHS09.
      4. Los datos de EPP deben extraerse de la Sección 8 (Controles de exposición / protección individual).
    `;

    const response = await (async () => {
        const maxRetries = 3;
        let delay = 1500; // 1.5 segundos iniciales

        for (let i = 0; i < maxRetries; i++) {
            try {
            return await ai.models.generateContent({
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
            } catch (err) {
            const isOverloaded = err.message?.includes('503') || 
                                err.message?.includes('overloaded') || 
                                err.message?.includes('429');
            if (isOverloaded && i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2; // Duplicar espera (1.5s -> 3s)
                continue;
            }
            throw err;
            }
        }
        })();

    const parsedData = JSON.parse(response.text);

    // Validación ante PDF ilegible o degradado
    if (!parsedData.es_fds_valida) {
      const errorDegradado = new Error(parsedData.motivo_invalidez || 'El PDF de la FDS no contiene texto legible o presenta degradación severa.');
      errorDegradado.status = 422;
      throw errorDegradado;
    }

    return parsedData;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(`Error en el servicio de extracción Gemini: ${error.message}`);
  }
};

module.exports = {
  extraerDatosFDS
};