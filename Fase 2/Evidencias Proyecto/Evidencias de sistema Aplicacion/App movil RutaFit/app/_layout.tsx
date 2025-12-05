import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { OneSignal, LogLevel } from "react-native-onesignal";
import { useEffect } from "react";

export default function RootLayout() {
    useEffect(() => {
        // Logs detallados mientras pruebas (luego puedes quitarlo)
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);

        // Inicializar OneSignal con tu App ID
        OneSignal.initialize("43460cd2-02b7-44be-bc6a-10366830ab96");

        // Pedir permiso para notificaciones (Android / iOS)
        OneSignal.Notifications.requestPermission(true);
    }, []);

    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
    );
}