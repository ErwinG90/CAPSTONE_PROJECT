const express = require('express');
const router = express.Router();
const EventoController = require('../controllers/EventoController');

const eventoController = new EventoController();

// crear evento
router.post('/', (req, res, next) => eventoController.save(req, res, next));

// listar todos
router.get('/', (req, res, next) => eventoController.findAll(req, res, next));

// === NUEVAS RUTAS ===
// lista unificada (creador + participante) con paginación/filtro
router.get('/mios', (req, res, next) => eventoController.getMyEvents(req, res, next));

// dos listas (creados / unidos) sin paginar
router.get('/mios/buckets', (req, res, next) => eventoController.getMyEventsBuckets(req, res, next));

// buscar por id (debe ir al final para no capturar /mios)
router.get('/:id', (req, res, next) => eventoController.findById(req, res, next));

// === participar y cancelar participacion ===
router.post('/:id/participar', (req, res, next) => eventoController.participate(req, res, next));
router.delete('/:id/participar', (req, res, next) => eventoController.cancelParticipation(req, res, next));

module.exports = router;