import { View, Text, Pressable, ScrollView } from "react-native";
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

/** Helpers para enriquecer eventos con deporte/creador en el front */
function withDeporte(e: Evento, deportes: Deporte[]): Evento {
  const d = deportes.find(x => (x as any)._id === (e as any).deporte_id);
  return d ? { ...e, deporte: d } : e;
}

function withCreador(e: Evento, currentUid?: string | null): Evento {
  if ((e as any).createdBy && currentUid && (e as any).createdBy === currentUid) {
    return { ...e, creador: { ...(e as any).creador, uid: (e as any).createdBy, nombre: "Tú" } as any };
  }
  // si backend ya manda creador.nombre, se respeta; si no, quedará “Usuario” en la tarjeta
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
      setMisEventos(res.data ?? []); // { total, page, limit, data }
    } catch (e) {
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

  // cancelar evento (creador) o participación (participante)
  const handleCancelar = async ({
    evento,
    motivo,
  }: {
    evento: Evento;
    motivo: "event" | "participation";
  }) => {
    try {
      if (motivo === "event") {
        // TODO: await eventoService.cancelarEvento(evento._id);
        console.log("Cancelar evento (creador):", evento._id);
      } else {
        // TODO: await eventoService.salirDeEvento(evento._id, currentUid);
        console.log("Cancelar participación:", evento._id, "uid:", currentUid);
      }
      await cargarMisEventos(); // refrescar lista
    } catch (e) {
      console.log(e);
    }
  };

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
            ) : eventos.length === 0 ? (
              <Text className="text-gray-400 text-center mt-20">No hay eventos disponibles</Text>
            ) : (
              eventos
                .map(e => withDeporte(e, deportes))
                .map((evento, index) => (
                  <EventCard
                    key={evento._id || index}
                    evento={withCreador(evento, currentUid)}
                    currentUid={currentUid}
                    variant="disponibles"
                    onVerDetalles={handleVerDetalles}
                    onUnirse={(id) => console.log("Unirse:", id)}
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
