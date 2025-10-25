const express = require('express');
const router = express.Router();
const RutaController = require('../controllers/RutaController');

const rutaController = new RutaController();

// crear ruta
router.post('/', (req, res, next) => rutaController.save(req, res, next));

// listar todas las rutas
router.get('/', (req, res, next) => rutaController.findAll(req, res, next));

module.exports = router;
