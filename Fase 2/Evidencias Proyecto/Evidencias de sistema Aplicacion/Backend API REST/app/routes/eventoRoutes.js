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

// DEBUG endpoint para probar notificaciones
router.post('/debug/notification', async (req, res, next) => {
  try {
    const NotificationService = require('../services/NotificationService');
    const notificationService = new NotificationService();
    
    const { playerId, title, message } = req.body;
    
    // Verificar que las variables de entorno estén configuradas
    console.log('OneSignal Config:', {
      appId: process.env.ONESIGNAL_APP_ID ? 'Configurado' : 'NO configurado',
      restApiKey: process.env.ONESIGNAL_REST_API_KEY ? 'Configurado' : 'NO configurado'
    });
    
    if (!playerId) {
      return res.status(400).json({ error: 'playerId es requerido' });
    }
    
    const result = await notificationService.sendToUser(
      playerId, 
      title || 'Notificación de prueba', 
      message || 'Esta es una notificación de prueba desde el backend'
    );
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error en debug notification:', error);
    res.status(500).json({ 
      error: 'Error enviando notificación', 
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;