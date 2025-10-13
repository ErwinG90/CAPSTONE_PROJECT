import "dotenv/config";

export default {
  expo: {
    name: "rutafitD",
    slug: "rutafitD",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "miapp",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "RutaFit usa tu ubicación para mostrar mapas y eventos cerca de ti.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "RutaFit necesita tu ubicación para mostrar el mapa y eventos cercanos.",
        },
      ],
    ],

    // Variables públicas de Firebase (se incrustan en el cliente)
    extra: {
      EXPO_PUBLIC_FB_API_KEY: process.env.EXPO_PUBLIC_FB_API_KEY,
      EXPO_PUBLIC_FB_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
      EXPO_PUBLIC_FB_PROJECT_ID: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
      EXPO_PUBLIC_FB_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
      EXPO_PUBLIC_FB_MESSAGING_SENDER_ID:
        process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID,
      EXPO_PUBLIC_FB_APP_ID: process.env.EXPO_PUBLIC_FB_APP_ID,
    },
  },
};
