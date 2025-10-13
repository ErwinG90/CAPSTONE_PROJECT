import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import MapView, { Marker, MapType } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import RequestLocationView from "../../src/permissions/RequestLocationView";
import { usePermissionsStore } from "../../src/permissions/store";
import { PermissionStatus } from "../../src/permissions/types";

// Saludo real
import { auth } from "../../src/firebaseConfig";
import { getProfile } from "../../src/storage/localCache";

export default function MapaScreen() {
  const { locationStatus } = usePermissionsStore();

  // Ubicación
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);

  // UI mapa
  const [mapType, setMapType] = useState<MapType>("standard");
  const [followingHeading, setFollowingHeading] = useState(false);
  const [heading, setHeading] = useState(0);

  // Saludo
  const [displayName, setDisplayName] = useState<string>("");

  // Cargar nombre para saludo
  useEffect(() => {
    const loadName = async () => {
      const dn = auth.currentUser?.displayName?.trim();
      if (dn) {
        setDisplayName(dn);
        return;
      }
      const cached = await getProfile().catch(() => null);
      const name = [cached?.nombre, cached?.apellido].filter(Boolean).join(" ");
      setDisplayName(name || "Usuario");
    };
    loadName();
  }, []);

  // Obtener ubicación inicial
  useEffect(() => {
    (async () => {
      if (locationStatus === PermissionStatus.GRANTED) {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
      }
    })();
  }, [locationStatus]);

  // Seguir orientación (brújula)
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      if (!followingHeading) {
        if (location) {
          mapRef.current?.animateCamera({
            center: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            heading: 0,
            zoom: 16,
          });
        }
        return;
      }
      sub = await Location.watchHeadingAsync((h) => {
        const deg = h.trueHeading ?? h.magHeading ?? 0;
        setHeading(deg);
        if (location) {
          mapRef.current?.animateCamera({
            center: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            heading: deg,
            zoom: 16,
          });
        }
      });
    })();
    return () => sub?.remove();
  }, [followingHeading, location]);

  // Estados intermedios
  if (locationStatus !== PermissionStatus.GRANTED) {
    return <RequestLocationView />;
  }

  if (!location) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-2 text-gray-500">Obteniendo ubicación...</Text>
      </View>
    );
  }

  // Helpers
  const { latitude, longitude } = location.coords;

  const recenter = () => {
    mapRef.current?.animateCamera({
      center: { latitude, longitude },
      heading: followingHeading ? heading : 0,
      zoom: 16,
    });
  };

  const toggleCompassFollow = () => setFollowingHeading((s) => !s);

  const cycleMapType = () => {
    setMapType((t) => {
      if (t === "standard") return "satellite";
      if (t === "satellite")
        return Platform.OS === "android" ? "terrain" : "mutedStandard";
      if (t === "terrain") return "standard";
      return "standard";
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header con SafeArea, margen y tarjeta elegante */}
      <SafeAreaView
        edges={["top"]}
        style={{
          paddingTop:
            Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 4 : 4,
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 8,
            backgroundColor: "white",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#EEF2F7",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="person-outline" size={16} color="#111827" />
            </View>
            <View>
              <Text style={{ color: "#111827", fontWeight: "600" }}>
                ¡Hola, {displayName}!
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                Tu ubicación actual
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        mapType={mapType}
        showsUserLocation
        showsCompass
        rotateEnabled
        showsMyLocationButton={Platform.OS === "android"}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Tu ubicación"
          description="Aquí estás ahora mismo"
          pinColor="green"
        />
      </MapView>

      {/* Botones flotantes */}
      <View style={{ position: "absolute", right: 12, bottom: 20, gap: 10 }}>
        <Fab onPress={cycleMapType}>
          <Ionicons name="layers-outline" size={20} color="#111827" />
        </Fab>

        <Fab onPress={recenter}>
          <Ionicons name="locate" size={20} color="#111827" />
        </Fab>

        <Fab onPress={toggleCompassFollow} active={followingHeading}>
          <Ionicons
            name="compass-outline"
            size={20}
            color={followingHeading ? "#0ea5e9" : "#111827"}
          />
        </Fab>
      </View>
    </View>
  );
}

// FAB reutilizable
function Fab({
  onPress,
  children,
  active,
}: {
  onPress: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: "white",
        borderWidth: active ? 2 : 1,
        borderColor: active ? "#0ea5e9" : "#e5e7eb",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {children}
    </Pressable>
  );
}
