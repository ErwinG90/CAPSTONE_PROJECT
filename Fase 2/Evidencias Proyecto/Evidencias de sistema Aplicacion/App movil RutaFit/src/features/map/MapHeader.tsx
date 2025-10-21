import React from "react";
import { View, Text, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function MapHeader({ displayName }: { displayName: string }) {
  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 4 : 4,
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
  );
}
