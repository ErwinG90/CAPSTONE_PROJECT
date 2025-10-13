const express = require('express');
const TipoDeporteController = require('../controllers/TipoDeporteController');

const router = express.Router();
const tipoDeporteController = new TipoDeporteController();

// GET /tipos-deporte - Obtener todos los tipos de deporte
router.get('/', (req, res) => tipoDeporteController.findAll(req, res));

module.exports = router;