// app/(tabs)/_layout.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../src/firebaseConfig";
import { usePermissionsStore } from "../../src/permissions/store";

export default function TabsLayout() {
  const router = useRouter();
  const { checkLocationPermission } = usePermissionsStore();

  const [checking, setChecking] = useState(true);

  // Guard de autenticación + verificación de correo
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/(auth)/Login");
        setChecking(false);
        return;
      }

      // Refresca datos de usuario (por si el emailVerified cambió)
      try { await user.reload(); } catch { }

      if (!user.emailVerified) {
        try { await signOut(auth); } catch { }
        router.replace("/(auth)/Login?verify=1");
        setChecking(false);
        return;
      }

      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  // Pide permisos de ubicación solo cuando ya pasó el guard
  useEffect(() => {
    if (!checking) checkLocationPermission();
  }, [checking, checkLocationPermission]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
        <Text className="mt-2 text-gray-500">Comprobando sesión…</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rutas"
        options={{
          title: "Rutas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trail-sign-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="eventos"
        options={{
          title: "Eventos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
