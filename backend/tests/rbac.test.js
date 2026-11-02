// 1. Cargar dotenv y garantizar la clave ANTES de cualquier importación
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_desarrollo_ucsm_2026';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth.middleware');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// Endpoint simulado exclusivo para rol GESTION
app.post(
  '/api/test/gestion',
  authenticateToken,
  authorizeRoles('GESTION'),
  (req, res) => res.status(200).json({ success: true, rol: req.user.rol })
);

// Endpoint simulado accesible para ACADEMICO y GESTION
app.post(
  '/api/test/mezcla',
  authenticateToken,
  authorizeRoles('ACADEMICO', 'GESTION'),
  (req, res) => res.status(200).json({ success: true, rol: req.user.rol })
);

describe('Control de Acceso Basado en Roles (RBAC) - auth.middleware', () => {

  describe('Autenticación (authenticateToken - Código 401)', () => {
    test('Debe retornar 401 si no se envía el header Authorization', async () => {
      const res = await request(app).post('/api/test/gestion');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Token de autorización no provisto/i);
    });

    test('Debe retornar 401 si el header Authorization no usa el formato Bearer', async () => {
      const res = await request(app)
        .post('/api/test/gestion')
        .set('Authorization', 'Basic 123456');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Debe retornar 401 si el token es corrupto, inválido o expiró', async () => {
      const res = await request(app)
        .post('/api/test/gestion')
        .set('Authorization', 'Bearer token_invalido_falso');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Token inválido o expirado/i);
    });
  });

  describe('Autorización por Rol (authorizeRoles - Código 403)', () => {
    test('Debe retornar 403 si un usuario ACADEMICO intenta acceder a un recurso de GESTION', async () => {
      const tokenAcademico = jwt.sign(
        { id_usuario: 10, email: 'alumno@ucsm.edu.pe', rol: 'ACADEMICO' },
        JWT_SECRET
      );

      const res = await request(app)
        .post('/api/test/gestion')
        .set('Authorization', `Bearer ${tokenAcademico}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Acceso restringido/i);
    });

    test('Debe retornar 200 OK si un usuario GESTION accede a un recurso de GESTION', async () => {
      const tokenGestion = jwt.sign(
        { id_usuario: 1, email: 'almacen@ucsm.edu.pe', rol: 'GESTION' },
        JWT_SECRET
      );

      const res = await request(app)
        .post('/api/test/gestion')
        .set('Authorization', `Bearer ${tokenGestion}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rol).toBe('GESTION');
    });

    test('Debe retornar 200 OK tanto para ACADEMICO como para GESTION en verificación de mezclas', async () => {
      const tokenAcademico = jwt.sign(
        { id_usuario: 10, email: 'docente@ucsm.edu.pe', rol: 'ACADEMICO' },
        JWT_SECRET
      );

      const res = await request(app)
        .post('/api/test/mezcla')
        .set('Authorization', `Bearer ${tokenAcademico}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

});