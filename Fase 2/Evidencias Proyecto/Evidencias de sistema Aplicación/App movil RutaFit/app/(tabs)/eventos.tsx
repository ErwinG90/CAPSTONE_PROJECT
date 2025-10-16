import { View, Text, Pressable, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import type { Deporte } from "../../interface/Deporte";
import type { Evento } from "../../interface/Evento";
import { deporteService } from "../../services/DeporteService";
import { eventoService } from "../../services/EventoService";
import EventCard from "../../src/components/events/EventCard";
import { useEvents } from "../../src/hooks/useEvents";
import EventModal from "../../src/components/events/EventModal";
import EventDetailsModal from "../../src/components/events/EventDetailsModal";
import { auth } from "../../src/firebaseConfig";
import { getProfile } from "../../src/storage/localCache";

/** Helpers para enriquecer eventos con deporte/creador en el front */
function withDeporte(e: Evento, deportes: Deporte[]): Evento {
  const d = deportes.find(x => (x as any)._id === (e as any).deporte_id);
  return d ? { ...e, deporte: d } : e;
}
// Lee el estado desde varias posibles claves y lo normaliza
function getEstado(e: any): string | null {
  const raw =
    e?.estado ??
    e?.status ??
    e?.estadoEvento ??
    e?.detalle?.estado ??
    null;

  if (raw == null) return null;
  return String(raw).normalize("NFKD").toLowerCase().trim();
}

function isProgramado(e: any): boolean {
  const s = getEstado(e);
  if (!s) return false; // null/undefined => no mostrar
  // Estados aceptados como "vigente"
  const activos = new Set(["programado", "scheduled", "activo", "active", "pendiente"]);
  // Estados que NO se muestran
  const noActivos = new Set([
    "cancelado",
    "canceled",
    "finalizado",
    "completado",
    "cerrado",
    "closed",
  ]);

  if (noActivos.has(s)) return false;
  return activos.has(s);
}


function withCreador(e: Evento, currentUid?: string | null): Evento {
  if ((e as any).createdBy && currentUid && (e as any).createdBy === currentUid) {
    return { ...e, creador: { ...(e as any).creador, uid: (e as any).createdBy, nombre: "Tú" } as any };
  }
  return e;
}

export default function EventosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  // “Disponibles”
  const { eventos, cargandoEventos, errorEventos, obtenerEventos } = useEvents(deportes);
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);

  // pestaña activa
  const [pestañaActiva, setPestañaActiva] = useState<"disponibles" | "mis-eventos">("disponibles");

  // “Mis eventos”
  const [misEventos, setMisEventos] = useState<Evento[]>([]);
  const [cargandoMis, setCargandoMis] = useState(false);
  const [errorMis, setErrorMis] = useState<string | null>(null);

  const currentUid = auth.currentUser?.uid || "";

  const handleVerDetalles = (evento: Evento) => {
    setEventoSeleccionado(evento);
    setModalDetallesVisible(true);
  };

  // cargar catálogo de deportes
  useEffect(() => {
    const fetchDeportes = async () => {
      try {
        const deportesRes = await deporteService.getDeportes();
        setDeportes(deportesRes);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    fetchDeportes();
  }, []);

  // función reutilizable para cargar “Mis eventos”
  const cargarMisEventos = useCallback(async () => {
    try {
      setCargandoMis(true);
      setErrorMis(null);

      const uid = auth.currentUser?.uid;
      if (!uid) {
        setErrorMis("Inicia sesión para ver tus eventos.");
        setMisEventos([]);
        return;
      }

      const res = await eventoService.getMisEventos(uid, 1, 50);
      const data = Array.isArray(res?.data) ? res.data : [];
      // 👉 Solo programados
      setMisEventos(data.filter(isProgramado));
    } catch {
      setErrorMis("No se pudieron cargar tus eventos.");
    } finally {
      setCargandoMis(false);
    }
  }, []);


  // cargar “Mis eventos” cuando se selecciona la pestaña
  useEffect(() => {
    if (pestañaActiva === "mis-eventos") {
      cargarMisEventos();
    }
  }, [pestañaActiva, cargarMisEventos]);

  // 🔹 Cancelar: evento (creador) o participación (participante)
  const handleCancelar = async ({
    evento,
    motivo,
  }: {
    evento: Evento;
    motivo: "event" | "participation";
  }) => {
    try {
      // Asegurar UID válido para participación
      let uid = auth.currentUser?.uid || "";
      if (!uid) {
        const profile = await getProfile();
        uid = (profile as any)?.uid || "";
      }

      if (motivo === "event") {
        // El creador elimina/cancela el evento -> también requiere uid
        await eventoService.cancelarEvento((evento as any)._id, uid);
        Platform.OS === "web"
          ? alert("Evento cancelado correctamente.")
          : Alert.alert("Listo", "Evento cancelado correctamente.");
      } else {
        // Un participante se baja del evento
        if (!uid) {
          Platform.OS === "web"
            ? alert("Debes estar autenticado para cancelar tu participación.")
            : Alert.alert("Inicia sesión", "Debes estar autenticado para cancelar tu participación.");
          return;
        }
        await eventoService.salirDeEvento((evento as any)._id, uid);
        Platform.OS === "web"
          ? alert("Has cancelado tu participación.")
          : Alert.alert("Listo", "Has cancelado tu participación.");
      }


      // Refrescar listas
      await cargarMisEventos(); // Mis eventos
      await obtenerEventos();   // Disponibles (por si vuelve a aparecer)
    } catch (e: any) {
      Platform.OS === "web"
        ? alert(e?.message || "No se pudo cancelar. Inténtalo nuevamente.")
        : Alert.alert("Error", e?.message || "No se pudo cancelar. Inténtalo nuevamente.");
    }
  };

  // 🔹 Unirse a evento (participar)
  const handleUnirse = async (eventoId: string) => {
    try {
      // 1) Obtener UID (auth primero, si no desde cache local)
      let uid = auth.currentUser?.uid || "";
      if (!uid) {
        const profile = await getProfile();
        uid = (profile as any)?.uid || "";
      }
      if (!uid) {
        Alert.alert("Inicia sesión", "Debes estar autenticado para unirte a un evento.");
        return;
      }

      // 2) Llamar API de participar
      await eventoService.participarEnEvento(eventoId, uid);

      // 3) Feedback
      if (Platform.OS === "web") {
        alert("¡Te has unido al evento!");
      } else {
        Alert.alert("Listo", "Te uniste al evento con éxito.");
      }

      // 4) Refrescar listas
      await obtenerEventos();
      await cargarMisEventos();
    } catch (e: any) {
      if (Platform.OS === "web") {
        alert(e?.message || "No se pudo unir al evento. Inténtalo nuevamente.");
      } else {
        Alert.alert("Error", e?.message || "No se pudo unir al evento. Inténtalo nuevamente.");
      }
    }
  };

  // 🔹 Filtrar “Disponibles” para mostrar SOLO "programado" y NO mostrar los ya creados/unidos por mí
  const disponiblesFiltrados = (eventos || [])
    .filter(isProgramado)
    .filter((e) => {
      const yaSoyCreador = (e as any).createdBy && (e as any).createdBy === currentUid;
      const yaParticipo =
        Array.isArray(e.participantes) && currentUid
          ? (e.participantes as any[]).includes(currentUid as any)
          : (e as any).role === "PARTICIPANT";
      return !yaSoyCreador && !yaParticipo;
    });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row justify-between items-center px-6 py-4">
        <View>
          <Text className="text-3xl font-bold text-green-500 drop-shadow-lg">Rutafit</Text>
          <Text className="text-sm text-black-500 mt-1">Únete o crea eventos deportivos</Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          className="bg-primary rounded-full px-4 py-2 flex-row items-center"
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-semibold ml-1">Crear</Text>
        </Pressable>
      </View>

      <View className="flex-row mx-6 mb-4">
        <Pressable
          onPress={() => setPestañaActiva("disponibles")}
          className={`flex-1 py-3 px-4 rounded-full mr-2 ${pestañaActiva === "disponibles" ? "bg-gray-200" : "bg-transparent"}`}
        >
          <Text className={`text-center font-medium ${pestañaActiva === "disponibles" ? "text-black" : "text-gray-500"}`}>
            Disponibles
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPestañaActiva("mis-eventos")}
          className={`flex-1 py-3 px-4 rounded-full ml-2 ${pestañaActiva === "mis-eventos" ? "bg-gray-200" : "bg-transparent"}`}
        >
          <Text className={`text-center font-medium ${pestañaActiva === "mis-eventos" ? "text-black" : "text-gray-500"}`}>
            Mis Eventos
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        {pestañaActiva === "disponibles" ? (
          <>
            {cargandoEventos ? (
              <Text className="text-gray-400 text-center mt-20">Cargando eventos...</Text>
            ) : errorEventos ? (
              <Text className="text-red-500 text-center mt-20">{errorEventos}</Text>
            ) : disponiblesFiltrados.length === 0 ? (
              <Text className="text-gray-400 text-center mt-20">No hay eventos disponibles</Text>
            ) : (
              disponiblesFiltrados
                .map(e => withDeporte(e, deportes))
                .map((evento, index) => (
                  <EventCard
                    key={evento._id || index}
                    evento={withCreador(evento, currentUid)}
                    currentUid={currentUid}
                    variant="disponibles"
                    onVerDetalles={handleVerDetalles}
                    onUnirse={handleUnirse}
                  />
                ))
            )}
          </>
        ) : (
          <>
            {cargandoMis ? (
              <Text className="text-gray-400 text-center mt-20">Cargando mis eventos...</Text>
            ) : errorMis ? (
              <Text className="text-red-500 text-center mt-20">{errorMis}</Text>
            ) : misEventos.length === 0 ? (
              <Text className="text-gray-400 text-center mt-20">
                Aún no tienes eventos creados o a los que te hayas unido
              </Text>
            ) : (
              misEventos
                .map(e => withDeporte(e, deportes))
                .map((evento, index) => (
                  <EventCard
                    key={evento._id || index}
                    evento={withCreador(evento, currentUid)}
                    currentUid={currentUid}
                    variant="mis"
                    onVerDetalles={handleVerDetalles}
                    onCancelar={handleCancelar}
                  />
                ))
            )}
          </>
        )}
      </ScrollView>

      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onEventCreated={() => {
          setModalVisible(false);
          obtenerEventos(); // refresca “Disponibles”
          if (pestañaActiva === "mis-eventos") {
            cargarMisEventos(); // refresca “Mis eventos” si estás ahí
          }
        }}
        deportes={deportes}
      />

      <EventDetailsModal
        visible={modalDetallesVisible}
        onClose={() => setModalDetallesVisible(false)}
        evento={eventoSeleccionado}
      />
    </SafeAreaView>
  );
}
