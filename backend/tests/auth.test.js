const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/login - Autenticación Institucional', () => {

  it('debe rechazar solicitudes sin correo o contraseña con 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '', password: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('debe rechazar correos no institucionales con 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usuario@gmail.com', password: '123' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('@ucsm.edu.pe');
  });

  it('debe rechazar credenciales incorrectas con 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gestion@ucsm.edu.pe', password: 'password_erroneo' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('debe autenticar exitosamente y retornar un JWT con 200 OK', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gestion@ucsm.edu.pe', password: 'ucsm2026' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('GESTION');
  });

});