const express = require('express');
const router = express.Router();
const { evaluarMezcla } = require('../controllers/mezcla.controller');

router.post('/evaluar', evaluarMezcla);

module.exports = router;