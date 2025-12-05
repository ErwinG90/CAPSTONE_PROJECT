const axios = require("axios");

class NotificationService {
    constructor() {
        this.appId = process.env.ONESIGNAL_APP_ID;
        this.restApiKey = process.env.ONESIGNAL_REST_API_KEY;
        this.baseUrl = "https://onesignal.com/api/v1";
    }

    async sendToUser(playerId, title, message, data = {}) {
        if (!playerId) {
            console.log("[NotificationService] Sin playerId, no se envía notificación");
            return;
        }

        try {
            const payload = {
                app_id: this.appId,
                include_player_ids: [playerId],
                headings: { en: title },
                contents: { en: message },
                data,
            };

            const response = await axios.post(
                `${this.baseUrl}/notifications`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${this.restApiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                `[NotificationService] Notificación enviada exitosamente: ${response.data.id}`
            );
            return response.data;

        } catch (error) {
            console.error(
                `[NotificationService] Error enviando notificación:`,
                error.response?.data || error.message
            );
            throw error;
        }
    }

    async notifyEventJoin(eventId, eventName, joinedUserName, creatorPlayerId) {
        if (!creatorPlayerId) {
            console.log(`[NotificationService] No se puede notificar - creador sin playerId`);
            return;
        }

        const title = "¡Nuevo participante!";
        const message = `${joinedUserName} se unió a tu evento "${eventName}"`;

        const data = {
            type: "event_join",
            eventId,
            action: "open_event",
        };

        return this.sendToUser(creatorPlayerId, title, message, data);
    }

    async notifyEventCancelled(eventId, eventName, participantPlayerIds) {
        if (!participantPlayerIds || participantPlayerIds.length === 0) {
            console.log(`[NotificationService] No hay participantes para notificar cancelación`);
            return;
        }

        try {
            const payload = {
                app_id: this.appId,
                include_player_ids: participantPlayerIds,
                headings: { en: "Evento cancelado" },
                contents: { en: `El evento "${eventName}" ha sido cancelado` },
                data: {
                    type: "event_cancelled",
                    eventId,
                    action: "open_events",
                },
            };

            const response = await axios.post(
                `${this.baseUrl}/notifications`,
                payload,
                {
                    headers: {
                        Authorization: `Basic ${this.restApiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                `[NotificationService] Notificación de cancelación enviada a ${participantPlayerIds.length} usuarios`
            );

            return response.data;

        } catch (error) {
            console.error(
                `[NotificationService] Error notificando cancelación:`,
                error.response?.data || error.message
            );
            throw error;
        }
    }
}

module.exports = NotificationService;
