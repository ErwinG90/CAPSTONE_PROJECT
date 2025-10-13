import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth } from "../../src/firebaseConfig";
import { validateEmail, validatePassword } from "../../src/validators";
import type { Deporte } from "../../interface/Deporte";
import type { Nivel } from "../../interface/Nivel";
import { deporteService } from "../../services/DeporteService";
import { nivelService } from "../../services/NivelService";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PLACEHOLDERS,
  VALIDATION_CONFIG,
  SOLO_LETRAS,
} from "../../src/Constants";
import type { Genero } from "../../src/Constants";

export default function RegisterScreen() {
  const router = useRouter();

  // Datos básicos
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // Perfil
  const [genero, setGenero] = useState<Genero>("mujer");

  // Fecha de nacimiento (picker)
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [mostrarDatePickerNacimiento, setMostrarDatePickerNacimiento] = useState(false);
  const [errorFechaNac, setErrorFechaNac] = useState<string | null>(null);

  // Catálogos
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [deporteId, setDeporteId] = useState<string | undefined>();
  const [nivelId, setNivelId] = useState<string | undefined>();

  // UI
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch catálogos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const deportesRes = await deporteService.getDeportes();
        setDeportes(deportesRes);
        const nivelesRes = await nivelService.getNiveles();
        setNiveles(nivelesRes);
      } catch (error) {
        console.log("Error cargando datos:", error);
      }
    };
    fetchData();
  }, []);

  // ---------- VALIDACIONES ----------
  const nombreOk =
    nombre.trim().length >= VALIDATION_CONFIG.MIN_NAME_LENGTH && SOLO_LETRAS.test(nombre.trim());
  const apellidoOk =
    apellido.trim().length >= VALIDATION_CONFIG.MIN_NAME_LENGTH && SOLO_LETRAS.test(apellido.trim());
  const emailOk = validateEmail(email);
  const pwOk = validatePassword(pw);
  const pwMatch = pw.length > 0 && pw === pw2;

  // Fechas para UI y validación
  const hoy = new Date();                     // tope visual y validación
  const minPickerDate = new Date(1900, 0, 1); // solo visual
  const edadMinima = VALIDATION_CONFIG?.MIN_AGE ?? 16;
  const limiteEdad = new Date(                // hoy - 16 (solo validación)
    hoy.getFullYear() - edadMinima,
    hoy.getMonth(),
    hoy.getDate()
  );

  function validarFechaNacimiento(fecha: Date | null): string | null {
    if (!fecha) return ERROR_MESSAGES.VALIDATION.DATE_REQUIRED;
    if (fecha > hoy) return ERROR_MESSAGES.VALIDATION.DATE_FUTURE;         // por si escriben futura en web
    if (fecha > limiteEdad) return ERROR_MESSAGES.VALIDATION.DATE_UNDERAGE;// menor de 16
    if (fecha < minPickerDate) return ERROR_MESSAGES.VALIDATION.DATE_TOO_OLD;
    return null;
  }

  useEffect(() => {
    setErrorFechaNac(validarFechaNacimiento(fechaNacimiento));
  }, [fechaNacimiento]);

  const nombreHint = useMemo(() => (!nombre || nombreOk ? "" : ERROR_MESSAGES.VALIDATION.NAME_INVALID), [nombre, nombreOk]);
  const apellidoHint = useMemo(() => (!apellido || apellidoOk ? "" : ERROR_MESSAGES.VALIDATION.NAME_INVALID), [apellido, apellidoOk]);
  const emailHint = useMemo(() => (!email || emailOk ? "" : ERROR_MESSAGES.VALIDATION.EMAIL_INVALID), [email, emailOk]);
  const pwHint = useMemo(() => (!pw || pwOk ? "" : ERROR_MESSAGES.VALIDATION.PASSWORD_INVALID), [pw, pwOk]);
  const pw2Hint = useMemo(() => (!pw2 || pwMatch ? "" : ERROR_MESSAGES.VALIDATION.PASSWORD_MISMATCH), [pw2, pwMatch]);

  const fechaNacOk = !validarFechaNacimiento(fechaNacimiento);

  const canSubmit =
    nombreOk && apellidoOk && emailOk && pwOk && pwMatch && fechaNacOk && !submitting;

  // Helpers fecha (web)
  const fechaParaInputWeb = (fecha: Date): string => fecha.toISOString().split("T")[0];
  const crearFechaDesdeInputWeb = (s: string): Date => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const formatearFechaParaMostrar = (f: Date) =>
    f.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // ---------- SUBMIT ----------
  async function onSubmit() {
    if (!canSubmit || !fechaNacimiento) return;
    setSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      const displayName = `${nombre.trim()} ${apellido.trim()}`;
      await updateProfile(user, { displayName });
      try { await sendEmailVerification(user); } catch {}

      try {
        const yyyy = fechaNacimiento.getFullYear();
        const mm = String(fechaNacimiento.getMonth() + 1).padStart(2, "0");
        const dd = String(fechaNacimiento.getDate()).padStart(2, "0");
        await axios.post("https://ms-rutafit-neg.vercel.app/ms-rutafit-neg/users", {
          uid: user.uid,
          nombre,
          apellido,
          email,
          fechaNacimiento: `${yyyy}-${mm}-${dd}`,
          genero,
          deporteFavorito: deporteId,
          nivelExperiencia: nivelId,
        });
      } catch (err) {
        console.log("WARN backend:", err);
      }

      setSuccessMsg(SUCCESS_MESSAGES.ACCOUNT_CREATED);
      setTimeout(() => router.replace("/(auth)/Login"), 1500);
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") setFormError(ERROR_MESSAGES.AUTH.EMAIL_IN_USE);
      else if (code === "auth/invalid-email") setFormError(ERROR_MESSAGES.AUTH.INVALID_EMAIL);
      else if (code === "auth/weak-password") setFormError(ERROR_MESSAGES.AUTH.WEAK_PASSWORD);
      else if (code === "auth/network-request-failed") setFormError(ERROR_MESSAGES.AUTH.NETWORK_ERROR);
      else setFormError(ERROR_MESSAGES.AUTH.DEFAULT);
      console.log("signup error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="px-6 pt-10 pb-6">
          <Text className="uppercase tracking-widest text-primary text-3xl font-bold drop-shadow mb-2">
            Rutafit
          </Text>
          <Text className="text-lg font-semibold text-white mt-1">Crear cuenta</Text>
        </View>

        <View className="px-6">
          {/* Nombre */}
          <View className="mb-4">
            <Text className="text-[13px] text-white mb-2">Nombre</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
              <Ionicons name="person" size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-text"
                placeholder={PLACEHOLDERS.NAME}
                placeholderTextColor="#9ca3af"
                value={nombre}
                onChangeText={(t) => { setNombre(t); if (formError) setFormError(null); }}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
            {!!nombreHint && <Text className="text-xs mt-1" style={{ color: "#C51217" }}>{nombreHint}</Text>}
          </View>

          {/* Apellido */}
          <View className="mb-4">
            <Text className="text-[13px] text-white mb-2">Apellido</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
              <Ionicons name="person" size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-text"
                placeholder={PLACEHOLDERS.LAST_NAME}
                placeholderTextColor="#9ca3af"
                value={apellido}
                onChangeText={(t) => { setApellido(t); if (formError) setFormError(null); }}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
            {!!apellidoHint && <Text className="text-xs mt-1" style={{ color: "#C51217" }}>{apellidoHint}</Text>}
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-[13px] text-white mb-2">Email</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
              <Ionicons name="mail" size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-text"
                placeholder={PLACEHOLDERS.EMAIL}
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => { setEmail(t); if (formError) setFormError(null); }}
                returnKeyType="next"
              />
            </View>
            {!!emailHint && <Text className="text-xs mt-1" style={{ color: "#C51217" }}>{emailHint}</Text>}
          </View>

          {/* Contraseña */}
          <View className="mb-4">
            <Text className="text-[13px] text-white mb-2">Contraseña</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
              <Ionicons name="lock-closed" size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-text"
                placeholder={PLACEHOLDERS.PASSWORD}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPw}
                value={pw}
                onChangeText={(t) => { setPw(t); if (formError) setFormError(null); }}
                returnKeyType="next"
              />
              <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={8}>
                <Ionicons name={showPw ? "eye-off" : "eye"} size={18} color="#6b7280" />
              </Pressable>
            </View>
            {!!pwHint && <Text className="text-xs mt-1" style={{ color: "#C51217" }}>{pwHint}</Text>}
          </View>

          {/* Repetir contraseña */}
          <View className="mb-4">
            <Text className="text-[13px] text-white mb-2">Repetir contraseña</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-12 border border-gray-200">
              <Ionicons name="lock-closed" size={18} color="#6b7280" />
              <TextInput
                className="flex-1 ml-2 text-text"
                placeholder={PLACEHOLDERS.REPEAT_PASSWORD}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPw2}
                value={pw2}
                onChangeText={(t) => { setPw2(t); if (formError) setFormError(null); }}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <Pressable onPress={() => setShowPw2((s) => !s)} hitSlop={8}>
                <Ionicons name={showPw2 ? "eye-off" : "eye"} size={18} color="#6b7280" />
              </Pressable>
            </View>
            {!!pw2Hint && <Text className="text-xs mt-1" style={{ color: "#C51217" }}>{pw2Hint}</Text>}
          </View>

          {/* Fecha de nacimiento */}
          <Text className="text-[13px] text-white mb-2">Fecha de nacimiento</Text>
          <View className="bg-gray-100 rounded-xl px-4 py-3 mb-1">
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={fechaNacimiento ? fechaParaInputWeb(fechaNacimiento) : ""}
                min={`${minPickerDate.getFullYear()}-${String(minPickerDate.getMonth() + 1).padStart(2, "0")}-${String(minPickerDate.getDate()).padStart(2, "0")}`}
                max={`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`} // hasta HOY
                onChange={(e) => {
                  const f = e.target.value ? crearFechaDesdeInputWeb(e.target.value) : null;
                  setFechaNacimiento(f);
                  setErrorFechaNac(validarFechaNacimiento(f));
                }}
                style={{ width: "100%", padding: 8, border: "none", background: "transparent", fontSize: 16, color: "#374151" }}
              />
            ) : (
              <Pressable onPress={() => setMostrarDatePickerNacimiento(true)}>
                <Text className="text-gray-900 py-1">
                  <Ionicons name="calendar-outline" size={20} color="#111827" />{" "}
                  {fechaNacimiento ? formatearFechaParaMostrar(fechaNacimiento) : "Selecciona tu fecha"}
                </Text>
              </Pressable>
            )}
          </View>
          {!!errorFechaNac && (
            <Text className="text-xs mt-1" style={{ color: "#C51217" }}>
              {errorFechaNac}
            </Text>
          )}

          {/* Género */}
          <Text className="text-[13px] text-white mb-2 mt-4">Género</Text>
          <View className="flex-row gap-3 mb-4">
            <Pressable
              className={`flex-1 rounded-2xl px-6 py-3 items-center border ${genero === "mujer" ? "bg-primary/20 border-primary" : "bg-gray-100 border-gray-200"}`}
              onPress={() => setGenero("mujer")}
            >
              <Text className={`${genero === "mujer" ? "text-primary font-semibold" : "text-gray-800"}`}>Mujer</Text>
            </Pressable>

            <Pressable
              className={`flex-1 rounded-2xl px-6 py-3 items-center border ${genero === "hombre" ? "bg-primary/20 border-primary" : "bg-gray-100 border-gray-200"}`}
              onPress={() => setGenero("hombre")}
            >
              <Text className={`${genero === "hombre" ? "text-primary font-semibold" : "text-gray-800"}`}>Hombre</Text>
            </Pressable>
          </View>

          {/* Deporte */}
          <Text className="text-[13px] text-white mb-2">Deporte</Text>
          <View className="mb-4 bg-gray-100 rounded-xl border border-gray-200">
            <Picker selectedValue={deporteId} onValueChange={(v) => setDeporteId(v)}>
              <Picker.Item label="Selecciona un deporte" value={undefined} />
              {deportes.map((d) => (
                <Picker.Item key={d._id} label={d.nombre} value={d._id} />
              ))}
            </Picker>
          </View>

          {/* Nivel */}
          <Text className="text-[13px] text-white mb-2">Nivel de experiencia</Text>
          <View className="mb-2 bg-gray-100 rounded-xl border border-gray-200">
            <Picker selectedValue={nivelId} onValueChange={(v) => setNivelId(v)}>
              <Picker.Item label="Selecciona un nivel" value={undefined} />
              {niveles.map((n) => (
                <Picker.Item key={n._id} label={n.nombre} value={n._id} />
              ))}
            </Picker>
          </View>

          {/* Mensajes globales */}
          {!!formError && (
            <Text className="mt-2 text-[13px]" style={{ color: "#C51217" }}>
              {formError}
            </Text>
          )}
          {!!successMsg && (
            <Text className="mt-2 text-[13px]" style={{ color: "green" }}>
              {successMsg}
            </Text>
          )}

          {/* Botón Crear */}
          <View className="mt-4 mb-6">
            <Pressable
              className={`rounded-2xl px-6 py-3 items-center ${canSubmit ? "bg-primary" : "bg-primary/50"}`}
              disabled={!canSubmit}
              onPress={onSubmit}
            >
              <Text className="text-white font-semibold">{submitting ? "Creando..." : "Crear cuenta"}</Text>
            </Pressable>
          </View>

          {/* Enlace a Login */}
          <View className="items-center mb-10">
            <Link href="/(auth)/Login">
              <Text className="text-primary">¿Ya tienes cuenta? Inicia sesión</Text>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* DatePicker nativo (solo mobile) */}
      {mostrarDatePickerNacimiento && Platform.OS !== "web" && (
        <DateTimePicker
          value={fechaNacimiento ?? new Date()}      // abre en HOY
          mode="date"
          display={Platform.OS === "android" ? "calendar" : "inline"} // Android: calendario; iOS: inline
          minimumDate={minPickerDate}               // se ven todos los años desde 1900
          maximumDate={hoy}                         // hasta HOY
          onChange={(_, d) => {
            setMostrarDatePickerNacimiento(false);
            if (d) setFechaNacimiento(d);
          }}
        />
      )}
    </SafeAreaView>
  );
}
