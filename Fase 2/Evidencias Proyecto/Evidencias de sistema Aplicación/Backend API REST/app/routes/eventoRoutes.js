const express = require('express');
const router = express.Router();
const EventoController = require('../controllers/EventoController');

const eventoController = new EventoController();

router.post('/', (req, res, next) => eventoController.save(req, res, next));

router.get('/', (req, res, next) => eventoController.findAll(req, res, next));

router.get('/:id', (req, res, next) => eventoController.findById(req, res, next));


module.exports = router;