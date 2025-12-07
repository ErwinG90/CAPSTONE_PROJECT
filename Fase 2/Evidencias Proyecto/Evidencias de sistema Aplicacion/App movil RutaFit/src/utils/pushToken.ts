import OneSignal from 'react-native-onesignal';

const API_BASE_URL = 'https://capstone-project-3-13xo.onrender.com/ms-rutafit-neg';

// pequeño truco para evitar errores de tipos de TS
const OS: any = OneSignal;

export async function registerPushTokenForUser(uid: string) {
    try {
        // 1) Pedir permisos (TS antes se quejaba aquí)
        await OS.Notifications.requestPermission(true);

        // 2) Obtener el Player ID (pushId)
        const pushId = await OS.User.pushSubscription.getPushSubscriptionId();

        if (!pushId) {
            console.log('[PushToken] No hay pushId todavía');
            return;
        }

        console.log('[PushToken] pushId obtenido:', pushId);

        // 3) Enviar el token al backend
        await fetch(`${API_BASE_URL}/users/${uid}/push-token`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                expoPushToken: pushId,
                notifications: {
                    enabled: true,
                    onEventJoin: true,
                    onEventCancelled: true,
                },
            }),
        });

        console.log('[PushToken] Token registrado en backend');
    } catch (error) {
        console.log('[PushToken] Error registrando token:', error);
    }
}