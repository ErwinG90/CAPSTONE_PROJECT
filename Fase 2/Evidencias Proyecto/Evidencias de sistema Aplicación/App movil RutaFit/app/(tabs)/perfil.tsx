// app/(tabs)/perfil.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, RefreshControl, Animated, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../src/firebaseConfig";
import { getProfile, saveProfile, clearAllCache } from "../../src/storage/localCache";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import StatsCard from "../../src/components/profile/StatsCard";
import SettingsCard from "../../src/components/profile/SettingsCard";
import { enrichProfile, preloadCatalogos } from "../../src/utils/refResolvers";
import AvatarPickerModal from "../../src/components/profile/AvatarPickerModal";
import EditProfileModal from "../../src/components/profile/EditProfileModal";
import { updateUserProfile, updateUserAvatar } from "../../services/UserService";


const API_BASE = "https://ms-rutafit-neg.vercel.app/ms-rutafit-neg";

export default function PerfilScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useRef(new Animated.Value(0)).current;
  // dentro del componente — ADD estados
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // NUEVO: estado para modal y guardado de avatar
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Precarga catálogos
  useEffect(() => {
    preloadCatalogos();
  }, []);

  const fetchFromApi = useCallback(async (uid: string) => {
    const { data } = await axios.get(`${API_BASE}/users/${encodeURIComponent(uid)}`);
    const enriched = await enrichProfile(data);
    await saveProfile({ ...enriched, updatedAt: new Date().toISOString() });
    return enriched;
  }, []);

  const load = useCallback(async () => {
    if (!refreshing) setLoading(true);
    setOffline(false);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const data = await fetchFromApi(uid);
          setProfile(data);
          return;
        } catch {
          setOffline(true);
        }
      }
      const cached = await getProfile();
      const maybeEnriched = cached?._display ? cached : await enrichProfile(cached);
      setProfile(maybeEnriched);
    } finally {
      setLoading(false);
    }
  }, [fetchFromApi, refreshing]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  async function onLogout() {
    try {
      await signOut(auth);
    } finally {
      await clearAllCache();
      router.replace("/(auth)/Login");
    }
  }

  const openSettings = () => {
    // router.push("/(settings)");
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-text mt-2">Cargando perfil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Animaciones del “header” de arrastre
  const rotate = pullY.interpolate({
    inputRange: [-120, 0],
    outputRange: ["180deg", "0deg"],
    extrapolate: "clamp",
  });
  const headerOpacity = pullY.interpolate({
    inputRange: [-80, -20, 0],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });
  const headerTranslate = pullY.interpolate({
    inputRange: [-120, 0],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const deporteNombre = profile?._display?.deporteFavoritoNombre;
  const nivelNombre = profile?._display?.nivelExperienciaNombre;
  const avatarActual = profile?.avatar ?? null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Topbar */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <Text className="text-text text-base font-semibold">Mi Perfil</Text>
        <Pressable
          onPress={onLogout}
          className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2"
        >
          <Ionicons name="exit-outline" size={18} color="#111827" />
          <Text className="text-text ml-1 font-semibold">Salir</Text>
        </Pressable>
      </View>

      {/* Scroll con pull-to-refresh y animación */}
      <Animated.ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: pullY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            titleColor="#16a34a"
            title={refreshing ? "Actualizando…" : "Desliza para refrescar"}
          />
        }
      >
        {/* Header animado que aparece al tirar */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            zIndex: 10,
            alignItems: "center",
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslate }, { rotate } as any],
          }}
        >
          <Ionicons name="chevron-down" size={22} color="#16a34a" />
          <Text className="text-[12px] text-[#16a34a] mt-1">Suelta para actualizar</Text>
        </Animated.View>

        {offline && (
          <View className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-100 px-3 py-2">
            <Text className="text-amber-700">
              Sin conexión o API no disponible. Mostrando datos en caché.
            </Text>
          </View>
        )}

        <ProfileHeader
          nombre={profile?.nombre}
          apellido={profile?.apellido}
          email={profile?.email}
          deporteNombre={deporteNombre}
          nivelNombre={nivelNombre}
          avatar={avatarActual}
          onPressChangeAvatar={() => setShowAvatarModal(true)}
          onPressEdit={() => setShowEditModal(true)}     // ← nuevo
        />

        <EditProfileModal
          visible={showEditModal}
          initial={{
            nombre: profile?.nombre ?? "",
            apellido: profile?.apellido ?? "",
            fechaNacimiento: profile?.fechaNacimiento ?? null, // "YYYY-MM-DD"
            genero: (profile?.genero as "hombre" | "mujer") ?? "hombre",
            deporteFavorito: profile?.deporteFavorito ?? null,
            nivelExperiencia: profile?.nivelExperiencia ?? null,
          }}
          onCancel={() => setShowEditModal(false)}
          onSave={async (payload) => {
            if (!profile?.uid) return;
            setSavingProfile(true);

            // Optimistic UI
            const prev = { ...profile };
            const updated = {
              ...profile,
              ...payload,
            };
            setProfile(updated);

            try {
              await updateUserProfile(profile.uid, payload); // PUT solo campos permitidos
              await saveProfile({ ...updated, updatedAt: new Date().toISOString() });
              setShowEditModal(false);
            } catch (e) {
              setProfile(prev);
            } finally {
              setSavingProfile(false);
            }
          }}
        />

        {savingProfile && (
          <View className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-100 px-3 py-2">
            <Text className="text-amber-700">Guardando cambios del perfil…</Text>
          </View>
        )}


        <AvatarPickerModal
          visible={showAvatarModal}
          initial={avatarActual}
          onCancel={() => setShowAvatarModal(false)}
          onSave={async (selected) => {
            if (!profile?.uid) {
              Alert.alert("Error", "No se encontró el UID del usuario.");
              return;
            }
            setSavingAvatar(true);

            const prev = profile?.avatar ?? null;
            setProfile({ ...profile, avatar: selected }); // Optimistic

            try {
              await updateUserAvatar(profile.uid, selected); // <-- AQUÍ EL CAMBIO
              await saveProfile({ ...profile, avatar: selected, updatedAt: new Date().toISOString() });
              setShowAvatarModal(false);
            } catch (e) {
              setProfile({ ...profile, avatar: prev });
              Alert.alert("Error", "No se pudo actualizar el avatar. Intenta nuevamente.");
            } finally {
              setSavingAvatar(false);
            }
          }}
        />


        {savingAvatar && (
          <View className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-100 px-3 py-2">
            <Text className="text-amber-700">Guardando avatar…</Text>
          </View>
        )}

        {/* Tarjetas de estadísticas y ajustes (sin cambios) */}
        <StatsCard
          rutas={profile?.stats?.rutas}
          distanciaTotal={profile?.stats?.distanciaTotal}
          eventos={profile?.stats?.eventos}
          metaMensual={profile?.stats?.metaMensual}
        />

        <SettingsCard
          notif={profile?.settings?.notif}
          privacy={profile?.settings?.privacy}
          units={profile?.settings?.units}
        // onOpenSettings={openSettings}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
