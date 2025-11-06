const express = require('express');
const router = express.Router();
const RutaController = require('../controllers/RutaController');

const rutaController = new RutaController();

// crear ruta
router.post('/', (req, res, next) => rutaController.save(req, res, next));

// listar todas las rutas
router.get('/', (req, res, next) => rutaController.findAll(req, res, next));

// listar rutas del usuario 
router.get('/mias', (req, res, next) => rutaController.findMine(req, res, next));

// calificar una ruta
router.post('/:id/valoraciones', (req, res, next) => rutaController.rate(req, res, next));

// listar valoraciones
router.get('/:id/valoraciones', (req, res, next) => rutaController.ratings(req, res, next));

// eliminar ruta
router.delete('/:id', (req, res, next) => rutaController.destroy(req, res, next));

// rutas populares (solo con valoraciones)
router.get('/populares', (req, res, next) => rutaController.popular(req, res, next));

module.exports = router;
