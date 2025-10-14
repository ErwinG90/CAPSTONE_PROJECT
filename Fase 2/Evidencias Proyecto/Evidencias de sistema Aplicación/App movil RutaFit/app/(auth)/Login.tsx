import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Link } from "expo-router";
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth"; // ⬅️ añade estos
import { auth } from "../../src/firebaseConfig";
import { validateEmail, validatePassword } from "../../src/validators";
import axios from "axios";
import { saveProfile } from "../../src/storage/localCache";

const API_BASE = "https://ms-rutafit-neg.vercel.app/ms-rutafit-neg";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailOk = validateEmail(email);
  const pwOk = validatePassword(pw);
  const canSubmit = emailOk && pwOk && !submitting;

  const emailHint = useMemo(() => {
    if (!email) return "";
    if (!emailOk) return "Formato: palabra@palabra.com | palabra@palabra.cl";
    return "";
  }, [email, emailOk]);

  const pwHint = useMemo(() => {
    if (!pw) return "";
    if (!pwOk) return "Mín. 6, con minúscula y MAYÚSCULA";
    return "";
  }, [pw, pwOk]);

  function prettyError(e: any) {
    const code = e?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      return "Correo o contraseña inválidos.";
    }
    if (code === "auth/invalid-email") return "El correo no es válido.";
    if (code === "auth/too-many-requests") return "Demasiados intentos. Intenta más tarde.";
    if (code === "auth/network-request-failed") return "Sin conexión. Revisa tu internet.";
    return "No se pudo iniciar sesión.";
  }

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      // 1) Login Firebase
      await signInWithEmailAndPassword(auth, email.trim(), pw);

      // 2) Refrescar y validar verificación
      await auth.currentUser?.reload();
      const u = auth.currentUser;

      if (!u) {
        setFormError("Ocurrió un problema con tu sesión. Intenta nuevamente.");
        return;
      }

      if (!u.emailVerified) {
        // (Opcional) reenviar automáticamente
        try { await sendEmailVerification(u); } catch { }

        // Cerrar sesión para impedir acceso
        await signOut(auth);

        setFormError(
          "Debes verificar tu correo antes de entrar. Te enviamos (o re-enviamos) el email de verificación."
        );
        return;
      }

      // 3) Si está verificado: traer perfil y cachear
      const uid = u.uid;
      try {
        const { data } = await axios.get(`${API_BASE}/users/${uid}`);
        await saveProfile({ ...data, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.log("WARN fetch/cache profile:", err);
      }

      // 4) Navegar a la app
      router.replace("/(tabs)");
    } catch (e: any) {
      setFormError(prettyError(e));
      console.log("auth error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-6 pt-10 pb-6">
        <Text className="uppercase tracking-widest text-primary text-3xl font-bold drop-shadow mb-2">
          Rutafit
        </Text>
        <Text className="text-lg font-semibold text-white mt-1">Iniciar sesión</Text>
      </View>

      <View className="px-6">
        {/* Email */}
        <View className="mb-4">
          <Text className="text-[13px] text-white mb-2">Correo</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
            <Ionicons name="mail" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-text"
              placeholder="tu@correo.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (formError) setFormError(null);
              }}
              returnKeyType="next"
            />
          </View>
          {!!emailHint && (
            <Text className="text-xs mt-1" style={{ color: "#C51217" }}>
              {emailHint}
            </Text>
          )}
        </View>

        {/* Password */}
        <View className="mb-2">
          <Text className="text-[13px] text-white mb-2">Contraseña</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
            <Ionicons name="lock-closed" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-text"
              placeholder="••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPw}
              value={pw}
              onChangeText={(t) => {
                setPw(t);
                if (formError) setFormError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={8}>
              <Ionicons name={showPw ? "eye-off" : "eye"} size={18} color="#6b7280" />
            </Pressable>
          </View>
          {!!pwHint && (
            <Text className="text-xs mt-1" style={{ color: "#C51217" }}>
              {pwHint}
            </Text>
          )}
        </View>

        {/* Error global */}
        {!!formError && (
          <Text className="mt-2 text-[13px]" style={{ color: "#C51217" }}>
            {formError}
          </Text>
        )}

        {/* Botón Entrar */}
        <View className="mt-4">
          <Pressable
            className={`rounded-2xl px-6 py-3 items-center ${canSubmit ? "bg-primary" : "bg-primary/50"}`}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            <Text className="text-white font-semibold">
              {submitting ? "Cargando..." : "Entrar"}
            </Text>
          </Pressable>
        </View>

        {/* Enlaces */}
        <View className="mt-6 items-center">
          <Link href="/(auth)/Register">
            <Text className="text-primary font-semibold">¿No tienes cuenta? Regístrate</Text>
          </Link>
        </View>

        <View className="mt-2 items-center">
          <Link href="/(auth)/recuperar-contrasena">
            <Text className="text-primary">¿Olvidaste tu contraseña?</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
