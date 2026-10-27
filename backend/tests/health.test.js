const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('debe responder con estado 200 y confirmar la conexión con Supabase', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('estado', 'OK');
    expect(res.body).toHaveProperty('dato_prueba');
  });
});