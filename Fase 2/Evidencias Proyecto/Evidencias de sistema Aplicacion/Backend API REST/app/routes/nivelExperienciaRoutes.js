const express = require('express');
const NivelExperienciaController = require('../controllers/NivelExperienciaController');

const router = express.Router();
const nivelExperienciaController = new NivelExperienciaController();

// GET /nivel-experiencia - Obtener todos los niveles de experiencia
router.get('/', (req, res) => nivelExperienciaController.findAll(req, res));

module.exports = router;
