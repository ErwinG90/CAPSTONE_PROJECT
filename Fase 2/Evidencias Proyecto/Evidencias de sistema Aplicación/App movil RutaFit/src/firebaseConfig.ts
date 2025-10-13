// src/firebaseConfig.ts
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth,setPersistence,browserLocalPersistence,initializeAuth,
  getReactNativePersistence,} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const extra = Constants.expoConfig?.extra ?? {};
const firebaseConfig = {
  apiKey: extra.EXPO_PUBLIC_FB_API_KEY,
  authDomain: extra.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: extra.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: extra.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: extra.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: extra.EXPO_PUBLIC_FB_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;

if (Platform.OS === "web") {
  // Web: persistencia en localStorage
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
  // Nativo: persistencia en AsyncStorage
  // initializeAuth solo puede llamarse una vez; por si ya existe, hacemos fallback a getAuth
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { auth };
