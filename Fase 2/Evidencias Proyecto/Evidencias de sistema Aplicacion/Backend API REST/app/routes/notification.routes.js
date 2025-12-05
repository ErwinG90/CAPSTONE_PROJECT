const express = require("express");
const router = express.Router();
const NotificationService = require("../services/NotificationService");

const notificationService = new NotificationService();

// --- Enviar notificación de prueba ---
router.post("/test", async (req, res) => {
    try {
        const { playerId, title, message } = req.body;

        if (!playerId) {
            return res.status(400).json({ error: "playerId es requerido" });
        }

        const result = await notificationService.sendToUser(
            playerId,
            title || "Título de prueba",
            message || "Mensaje de prueba desde RutaFit backend"
        );

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({
            error: "Error enviando notificación",
            details: error.response?.data || error.message,
        });
    }
});

module.exports = router;
