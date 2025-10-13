import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../src/firebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onBackToLogin?: () => void;
};

export default function ForgotPasswordScreen({ onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const backToLogin = () => {
    if (onBackToLogin) onBackToLogin();
    else router.back();
  };

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setFormError("Por favor ingresa un correo válido.");
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setEmailSent(true);
    } catch (e: any) {
      const msg =
        e?.code === "auth/user-not-found"
          ? "No existe un usuario con ese correo."
          : e?.code === "auth/invalid-email"
            ? "El correo no es válido."
            : e?.message ?? "No se pudo enviar el correo de recuperación.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-6">
          <View className="items-center mb-4">
            <Ionicons name="mail" size={40} color="#22c55e" />
            <Text className="mt-4 text-lg font-semibold text-text">Email Enviado</Text>
            <Text className="mt-2 text-center text-sm text-gray-500">
              Hemos enviado las instrucciones a {email}
            </Text>
          </View>

          <Pressable
            onPress={backToLogin}
            className="w-full rounded-2xl bg-primary py-3 items-center"
          >
            <Text className="text-white font-semibold">Volver al inicio de sesión</Text>
          </Pressable>

          <Pressable
            onPress={() => setEmailSent(false)}
            className="mt-3 w-full items-center"
          >
            <Text className="text-primary font-semibold">Enviar nuevamente</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-6 pt-10">
      <Text className="uppercase tracking-widest text-primary text-3xl font-bold drop-shadow mb-2">
        Rutafit
      </Text>
      <Text className="text-lg font-semibold text-white mb-6">Recuperar contraseña</Text>

      {/* Input */}
      <Text className="text-[13px] text-white mb-2">Correo</Text>
      <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
        <Ionicons name="mail" size={18} color="#6b7280" />
        <TextInput
          className="flex-1 ml-2 text-text"
          placeholder="tu@correo.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (formError) setFormError(null);
          }}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      {/* Error */}
      {!!formError && (
        <Text className="mt-2 text-[13px]" style={{ color: "#C51217" }}>
          {formError}
        </Text>
      )}

      {/* Botón enviar */}
      <View className="mt-6">
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-2xl px-6 py-3 items-center ${loading ? "bg-primary/50" : "bg-primary"
            }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Enviar instrucciones</Text>
          )}
        </Pressable>
      </View>

      {/* Back link */}
      <View className="mt-6 items-center">
        <Pressable onPress={backToLogin}>
          <Text className="text-primary">Volver al inicio de sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}
