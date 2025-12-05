require("dotenv").config();

module.exports = {
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
      bundleIdentifier: "cl.rutafit.app",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "RutaFit usa tu ubicación para mostrar mapas y eventos cerca de ti.",
      },
    },
    android: {
      package: "cl.rutafit.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY, // 👈 misma var
        },
      },
      googleServicesFile: "./google-services.json", // 👈 NUEVO para OneSignal
    },
    web: { favicon: "./assets/favicon.png", bundler: "metro" },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "RutaFit necesita tu ubicación para mostrar el mapa y eventos cercanos.",
        },
      ],
      [
        "onesignal-expo-plugin",
        {
          mode: "development",
        },
      ],
    ],
    extra: {
      EXPO_PUBLIC_FB_API_KEY: process.env.EXPO_PUBLIC_FB_API_KEY,
      EXPO_PUBLIC_FB_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
      EXPO_PUBLIC_FB_PROJECT_ID: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
      EXPO_PUBLIC_FB_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
      EXPO_PUBLIC_FB_MESSAGING_SENDER_ID:
        process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID,
      EXPO_PUBLIC_FB_APP_ID: process.env.EXPO_PUBLIC_FB_APP_ID,
      oneSignalAppId: "43460cd2-02b7-44be-bc6a-10366830ab96",
      eas: {
        projectId: "e4472580-53f1-4f88-a69a-f70d68812bda",
      },
    },
  },
};
