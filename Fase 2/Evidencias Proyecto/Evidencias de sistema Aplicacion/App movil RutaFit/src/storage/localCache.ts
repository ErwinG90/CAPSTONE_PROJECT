import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PROFILE: "rutafit:profile",
  LAST_ROUTES: "rutafit:lastRoutes",
};

export async function saveProfile(profile: any) {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn("No se pudo guardar el perfil en cache:", err);
  }
}

export async function getProfile<T = any>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("No se pudo leer el perfil desde cache:", err);
    return null;
  }
}

export async function saveLastRoutes(routes: any[]) {
  try {
    await AsyncStorage.setItem(KEYS.LAST_ROUTES, JSON.stringify(routes));
  } catch (err) {
    console.warn("No se pudo guardar las rutas en cache:", err);
  }
}

export async function getLastRoutes<T = any[]>(): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_ROUTES);
    return raw ? (JSON.parse(raw) as T) : ([] as T);
  } catch (err) {
    console.warn("No se pudo leer las rutas desde cache:", err);
    return [] as T;
  }
}

/** 👉 Limpia TODO el cache local que usamos en la app */
export async function clearAllCache() {
  try {
    await AsyncStorage.multiRemove([KEYS.PROFILE, KEYS.LAST_ROUTES]);
  } catch (err) {
    console.warn("No se pudo limpiar el cache:", err);
  }
}
