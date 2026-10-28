const request = require('supertest');
const app = require('../src/app');

describe('Endpoints de Reactivos (Catálogo P-01 / P-02)', () => {

  it('GET /api/reactivos - debe responder 200 y listar reactivos', async () => {
    const res = await request(app).get('/api/reactivos');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/reactivos?q=clorh - debe filtrar reactivos por texto', async () => {
    const res = await request(app).get('/api/reactivos?q=clorh');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/reactivos/:id - debe resolver por código institucional de 8 caracteres', async () => {
    const res = await request(app).get('/api/reactivos/26RQ0001');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.codigo_institucional).toBe('26RQ0001');
  });

  it('GET /api/reactivos/:id - debe retornar 404 si el reactivo no existe', async () => {
    const res = await request(app).get('/api/reactivos/26RQ9999');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

});