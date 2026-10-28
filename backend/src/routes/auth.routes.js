const { Router } = require('express');
const { login, getProfile } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = Router();

// Endpoint público institucional
router.post('/login', login);

// Endpoint protegido para validar sesión y perfil
router.get('/me', authenticateToken, getProfile);

module.exports = router;