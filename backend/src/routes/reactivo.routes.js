const { Router } = require('express');
const { getReactivos, getReactivoById } = require('../controllers/reactivo.controller');

const router = Router();

router.get('/', getReactivos);
router.get('/:id', getReactivoById);

module.exports = router;