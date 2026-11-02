// 1. Cargar variables de entorno antes de cualquier firma o importación
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_desarrollo_ucsm_2026';

const jwt = require('jsonwebtoken');
const request = require('supertest');

const JWT_SECRET = process.env.JWT_SECRET;
const tokenPrueba = jwt.sign(
  { id_usuario: 1, email: 'investigador@ucsm.edu.pe', rol: 'ACADEMICO' },
  JWT_SECRET
);

// 2. Importar la app una vez que process.env.JWT_SECRET está garantizado
const app = require('../src/app');

describe('Tarjeta 11: Certificación del Motor Químico de Mezclas', () => {

  // Caso 1: Validación de entrada
  test('Rechaza mezclas con menos de 2 o más de 3 reactivos', async () => {
    const unSoloReactivo = await request(app)
      .post('/api/mezclas/evaluar')
      .set('Authorization', `Bearer ${tokenPrueba}`)
      .send({ reactivos: ['26RQ0001'] });

    expect(unSoloReactivo.statusCode).toBe(400);

    const cuatroReactivos = await request(app)
      .post('/api/mezclas/evaluar')
      .set('Authorization', `Bearer ${tokenPrueba}`)
      .send({ reactivos: ['26RQ0001', '26RQ0026', '26RQ0060', '26RQ0099'] });

    expect(cuatroReactivos.statusCode).toBe(400);
  });

  // Caso 2: Simetría matemática (A x B = B x A)
  test('Verifica simetría: el orden de selección no altera el resultado de incompatibilidad', async () => {
    const resOrdenDirecto = await request(app)
      .post('/api/mezclas/evaluar')
      .set('Authorization', `Bearer ${tokenPrueba}`)
      .send({ reactivos: ['26RQ0001', '26RQ0060'] });

    const resOrdenInverso = await request(app)
      .post('/api/mezclas/evaluar')
      .set('Authorization', `Bearer ${tokenPrueba}`)
      .send({ reactivos: ['26RQ0060', '26RQ0001'] });

    expect(resOrdenDirecto.statusCode).toBe(200);
    expect(resOrdenInverso.statusCode).toBe(200);

    expect(resOrdenDirecto.body.data.semaforo_global).toBe(resOrdenInverso.body.data.semaforo_global);

    const parDirecto = resOrdenDirecto.body.data.pares[0];
    const parInverso = resOrdenInverso.body.data.pares[0];
    expect(parDirecto.evaluacion_grupo.severidad).toBe(parInverso.evaluacion_grupo.severidad);
    expect(parDirecto.evaluacion_grupo.consecuencias).toBe(parInverso.evaluacion_grupo.consecuencias);
  });

  // Caso 3: Evaluación de 3 reactivos y escalado de severidad máxima
  test('Mezcla ternaria (3 reactivos): evalúa 3 pares y el semáforo adopta el peor escenario', async () => {
    const res = await request(app)
      .post('/api/mezclas/evaluar')
      .set('Authorization', `Bearer ${tokenPrueba}`)
      .send({ reactivos: ['26RQ0001', '26RQ0026', '26RQ0060'] });

    expect(res.statusCode).toBe(200);
    const data = res.body.data;

    expect(data.pares).toHaveLength(3);

    const hayParesRojos = data.pares.some(p => p.evaluacion_grupo.severidad === 'ROJO');
    if (hayParesRojos) {
      expect(data.semaforo_global).toBe('ROJO');
      expect(data.titulo_global).toBe('Mezcla Incompatible');
    }
  });

  // Caso 4: Desacoplamiento de información
  test('Estructura desacoplada: cada par contiene sección de grupo químico y sección de pictograma', async () => {
    const res = await request(app)
      .post('/api/mezclas/evaluar')
      .set('Authorization', `Bearer ${tokenPrueba}`)
      .send({ reactivos: ['26RQ0001', '26RQ0026'] });

    expect(res.statusCode).toBe(200);
    const par = res.body.data.pares[0];

    expect(par).toHaveProperty('evaluacion_grupo');
    expect(par).toHaveProperty('evaluacion_pictogramas');

    expect(par.evaluacion_grupo).toHaveProperty('severidad');
    expect(par.evaluacion_grupo).toHaveProperty('consecuencias');
    expect(par.evaluacion_grupo).toHaveProperty('contramedidas');

    expect(par.evaluacion_pictogramas).toHaveProperty('tiene_restriccion');
    expect(par.evaluacion_pictogramas).toHaveProperty('advertencias');
  });

});