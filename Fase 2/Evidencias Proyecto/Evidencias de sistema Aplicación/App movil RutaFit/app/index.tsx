import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import { useRouter } from "expo-router";
import "./global.css";

export default function BootstrapAuth() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      router.replace(user ? "/(tabs)" : "/(auth)/Login");
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-2">Cargando…</Text>
      </View>
    );
  }
  return null;
}
