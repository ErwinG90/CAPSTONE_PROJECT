import React from "react";
import { Pressable } from "react-native";

export default function Fab({
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
        borderColor: active ? "#ef4444" : "#e5e7eb",
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
