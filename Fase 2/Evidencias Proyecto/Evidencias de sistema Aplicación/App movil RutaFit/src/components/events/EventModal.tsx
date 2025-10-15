import { View, Text, Pressable, Modal, TextInput, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from "react";
import type { Deporte } from "../../../interface/Deporte";
import { eventoService } from '../../../services/EventoService';
import { getProfile } from '../../../src/storage/localCache';
import { validateEventoForm, prepararFechaHoraCombinada, validateFechaEvento, validateHoraEvento, validateDeporteEvento, validateTituloEvento, validateUbicacionEvento, validateParticipantesEvento } from "../../../src/validators";

interface EventModalProps {
    visible: boolean;
    onClose: () => void;
    onEventCreated: () => void;
    deportes: Deporte[];
}

export default function EventModal({ visible, onClose, onEventCreated, deportes }: EventModalProps) {
    const [nombreEvento, setNombreEvento] = useState("");
    const [deporteId, setDeporteId] = useState<string>("");
    const [lugar, setLugar] = useState("");

    // Estados para fecha y hora híbrida con DateTimePicker nativo
    const [fechaEvento, setFechaEvento] = useState(new Date());
    const [horaEvento, setHoraEvento] = useState(new Date());
    const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
    const [mostrarTimePicker, setMostrarTimePicker] = useState(false);

    const [maxParticipantes, setMaxParticipantes] = useState(0);
    const [descripcion, setDescripcion] = useState("");
    const [erroresValidacion, setErroresValidacion] = useState<string[]>([]);

    // Estados para errores específicos de campos
    const [errorFecha, setErrorFecha] = useState<string | null>(null);
    const [errorHora, setErrorHora] = useState<string | null>(null);
    const [errorDeporte, setErrorDeporte] = useState<string | null>(null);
    const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
    const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
    const [errorParticipantes, setErrorParticipantes] = useState<string | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [creandoEvento, setCreandoEvento] = useState(false);

    // Funciones para manejar DateTimePicker
    const onCambiarFecha = (event: any, selectedDate?: Date) => {
        setMostrarDatePicker(false);
        if (selectedDate) {
            setFechaEvento(selectedDate);
            // Validar fecha y mostrar error si es necesario
            const errorFechaValidacion = validateFechaEvento(selectedDate);
            setErrorFecha(errorFechaValidacion);
            // Limpiar errores generales
            setErroresValidacion([]);
        }
    };

    const onCambiarHora = (event: any, selectedTime?: Date) => {
        setMostrarTimePicker(false);
        if (selectedTime) {
            setHoraEvento(selectedTime);
            // Validar hora y mostrar error si es necesario
            const errorHoraValidacion = validateHoraEvento(selectedTime);
            setErrorHora(errorHoraValidacion);
            // Limpiar errores generales
            setErroresValidacion([]);
        }
    };

    const obtenerFechaMinima = (): string => {
        const hoy = new Date();
        const mañana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        return mañana.toISOString().split('T')[0];
    };

    const obtenerFechaMaxima = (): string => {
        const unAñoDelante = new Date();
        unAñoDelante.setFullYear(unAñoDelante.getFullYear() + 1);
        return unAñoDelante.toISOString().split('T')[0];
    };

    const formatearFechaParaMostrar = (fecha: Date): string => {
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHoraParaMostrar = (hora: Date): string => {
        return hora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Funciones para convertir Date a string para inputs web
    const fechaParaInputWeb = (fecha: Date): string => {
        return fecha.toISOString().split('T')[0];
    };

    const horaParaInputWeb = (hora: Date): string => {
        return hora.toTimeString().split(' ')[0].substring(0, 5);
    };

    const crearFechaDesdeInputWeb = (fechaString: string): Date => {
        const [year, month, day] = fechaString.split('-').map(Number);
        return new Date(year, month - 1, day); // month - 1 porque Date usa 0-based months
    };

    const handleCancelar = () => {
        // Limpiar todos los campos
        setNombreEvento("");
        setDeporteId("");
        setLugar("");
        setFechaEvento(new Date());
        setHoraEvento(new Date());
        setMaxParticipantes(0);
        setDescripcion("");
        setErroresValidacion([]);
        setErrorFecha(null);
        setErrorHora(null);
        setErrorDeporte(null);
        setErrorTitulo(null);
        setErrorUbicacion(null);
        setErrorParticipantes(null);
        setMensajeExito(null);
        onClose();
    };

    const incrementarParticipantes = () => {
        setMaxParticipantes(prev => prev + 1);
    };

    const decrementarParticipantes = () => {
        setMaxParticipantes(prev => Math.max(0, prev - 1));
    };

    const handleCrearEvento = async () => {
        // Limpiar mensajes anteriores
        setMensajeExito(null);
        setErroresValidacion([]);

        // Validar campos individuales para mostrar errores en tiempo real
        const errorTituloActual = validateTituloEvento(nombreEvento);
        const errorDeporteActual = validateDeporteEvento(deporteId);
        const errorUbicacionActual = validateUbicacionEvento(lugar);
        const errorFechaActual = validateFechaEvento(fechaEvento);
        const errorHoraActual = validateHoraEvento(horaEvento);
        const errorParticipantesActual = validateParticipantesEvento(maxParticipantes);

        // Actualizar errores individuales
        setErrorTitulo(errorTituloActual);
        setErrorDeporte(errorDeporteActual);
        setErrorUbicacion(errorUbicacionActual);
        setErrorFecha(errorFechaActual);
        setErrorHora(errorHoraActual);
        setErrorParticipantes(errorParticipantesActual);

        // Validación completa
        const datosEvento = {
            nombre_evento: nombreEvento,
            deporte_id: deporteId,
            lugar: lugar,
            fecha_evento: prepararFechaHoraCombinada(fechaEvento, horaEvento),
            max_participantes: maxParticipantes,
            descripcion: descripcion,
            createdBy: ""
        };

        const resultado = validateEventoForm(
            nombreEvento,
            deporteId,
            lugar,
            fechaEvento,
            horaEvento,
            maxParticipantes,
            descripcion
        );

        if (!resultado.isValid) {
            setErroresValidacion(resultado.errors);
            return;
        }

        // Si la validación es exitosa, obtener el perfil del usuario
        try {
            const perfilUsuario = await getProfile();
            if (!perfilUsuario || !perfilUsuario.uid) {
                throw new Error("No se pudo obtener el perfil del usuario");
            }

            // Asignar el UID del usuario
            datosEvento.createdBy = perfilUsuario.uid;
        } catch (error) {
            console.error("Error obteniendo perfil:", error);
            setErroresValidacion(["Error: Debes estar autenticado para crear eventos"]);
            return;
        }

        // Prevenir múltiples envíos
        if (creandoEvento) return;
        setCreandoEvento(true);

        // Enviar datos a la API
        try {
            await eventoService.crearEvento(datosEvento);

            // Si llega aquí, fue exitoso
            // Limpiar errores
            setErroresValidacion([]);
            setErrorFecha(null);
            setErrorHora(null);
            setErrorDeporte(null);
            setErrorTitulo(null);
            setErrorUbicacion(null);
            setErrorParticipantes(null);

            // Mostrar confirmación según la plataforma
            if (Platform.OS === 'web') {
                // Mensaje de texto verde en web
                setMensajeExito("¡Evento creado exitosamente!");
                // Cerrar modal después de mostrar el mensaje
                setTimeout(() => {
                    setMensajeExito(null);
                    handleCancelar();
                    onEventCreated(); // Refrescar la lista
                }, 2500); // 2.5 segundos para ver el mensaje
            } else {
                // Cerrar modal inmediatamente en mobile y mostrar alert
                handleCancelar();
                onEventCreated(); // Refrescar la lista
                Alert.alert(
                    "¡Evento creado!",
                    "Tu evento se ha creado exitosamente",
                    [{ text: "OK", style: "default" }]
                );
            }

        } catch (error) {
            console.error("Error creando evento:", error);

            // Mostrar error al usuario
            if (Platform.OS === 'web') {
                alert('Error al crear evento. Inténtalo de nuevo.');
            } else {
                Alert.alert(
                    "Error",
                    "No se pudo crear el evento. Inténtalo de nuevo.",
                    [{ text: "OK", style: "default" }]
                );
            }
        } finally {
            setCreandoEvento(false);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancelar}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <ScrollView className="flex-1">
                        <View className="px-6 py-4">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-900">Crear Nuevo Evento</Text>
                                <Pressable onPress={handleCancelar}>
                                    <Ionicons name="close" size={24} color="#6b7280" />
                                </Pressable>
                            </View>

                            {/* Mensaje de éxito solo en web */}
                            {Platform.OS === 'web' && mensajeExito && (
                                <View className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
                                    <View className="flex-row items-center justify-center">
                                        <Text className="text-green-800 font-semibold text-center">
                                            ✅ {mensajeExito}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View className="mb-4">
                                <Text className="text-sm text-gray-700 mb-2">Título del evento</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                                    placeholder="Ej: Carrera matutina en el parque"
                                    placeholderTextColor="#9ca3af"
                                    value={nombreEvento}
                                    onChangeText={(text) => {
                                        setNombreEvento(text);
                                        if (erroresValidacion.length > 0) {
                                            setErroresValidacion([]);
                                        }
                                        // Limpiar error de título si hay texto válido
                                        if (text.trim() !== "" && errorTitulo) {
                                            const errorTituloValidacion = validateTituloEvento(text);
                                            if (!errorTituloValidacion) {
                                                setErrorTitulo(null);
                                            }
                                        }
                                    }}
                                />
                                {/* Error de título */}
                                {errorTitulo && (
                                    <Text className="text-red-600 text-sm mt-1">
                                        {errorTitulo}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm text-gray-700 mb-2">Deporte</Text>
                                <View className="bg-gray-100 rounded-xl border border-gray-200">
                                    <Picker
                                        selectedValue={deporteId}
                                        onValueChange={(itemValue) => {
                                            setDeporteId(itemValue);
                                            if (erroresValidacion.length > 0) {
                                                setErroresValidacion([]);
                                            }
                                            // Limpiar error de deporte si se selecciona uno válido
                                            if (itemValue && itemValue !== "") {
                                                setErrorDeporte(null);
                                            }
                                        }}
                                    >
                                        <Picker.Item label="Selecciona un deporte" value="" />
                                        {deportes.map((d) => (
                                            <Picker.Item
                                                key={d._id}
                                                label={d.nombre}
                                                value={d._id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                                {/* Error de deporte */}
                                {errorDeporte && (
                                    <Text className="text-red-600 text-sm mt-1">
                                        {errorDeporte}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm text-gray-700 mb-2">Ubicación</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                                    placeholder="Ej: Parque Central, Zona Norte"
                                    placeholderTextColor="#9ca3af"
                                    value={lugar}
                                    onChangeText={(text) => {
                                        setLugar(text);
                                        if (erroresValidacion.length > 0) {
                                            setErroresValidacion([]);
                                        }
                                        // Limpiar error de ubicación si hay texto
                                        if (text.trim() !== "") {
                                            setErrorUbicacion(null);
                                        }
                                    }}
                                />
                                {/* Error de ubicación */}
                                {errorUbicacion && (
                                    <Text className="text-red-600 text-sm mt-1">
                                        {errorUbicacion}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm text-gray-700 mb-2">Fecha del evento</Text>
                                <View className="bg-gray-100 rounded-xl px-4 py-3">
                                    {Platform.OS === 'web' ? (
                                        <input
                                            type="date"
                                            value={fechaParaInputWeb(fechaEvento)}
                                            min={obtenerFechaMinima()}
                                            max={obtenerFechaMaxima()}
                                            onChange={(e) => {
                                                const nuevaFecha = crearFechaDesdeInputWeb(e.target.value);
                                                setFechaEvento(nuevaFecha);
                                                // Validar y mostrar error si es necesario
                                                const errorFechaValidacion = validateFechaEvento(nuevaFecha);
                                                setErrorFecha(errorFechaValidacion);
                                                // Limpiar errores generales
                                                setErroresValidacion([]);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: 'none',
                                                background: 'transparent',
                                                fontSize: '16px',
                                                color: '#374151'
                                            }}
                                        />
                                    ) : (
                                        <Pressable onPress={() => setMostrarDatePicker(true)}>
                                            <Text className="text-gray-900 py-1">
                                                <Ionicons name="calendar-outline" size={20} color="#111827" />
                                                {formatearFechaParaMostrar(fechaEvento)}
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                                {/* Error de fecha */}
                                {errorFecha && (
                                    <Text className="text-red-600 text-sm mt-1">
                                        {errorFecha}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm text-gray-700 mb-2">Hora del evento</Text>
                                <View className="bg-gray-100 rounded-xl px-4 py-3">
                                    {Platform.OS === 'web' ? (
                                        <input
                                            type="time"
                                            value={horaParaInputWeb(horaEvento)}
                                            min="07:00"
                                            max="23:59"
                                            onChange={(e) => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const newTime = new Date(horaEvento);
                                                newTime.setHours(parseInt(hours), parseInt(minutes));

                                                setHoraEvento(newTime);
                                                // Validar y mostrar error si es necesario
                                                const errorHoraValidacion = validateHoraEvento(newTime);
                                                setErrorHora(errorHoraValidacion);
                                                // Limpiar errores generales
                                                setErroresValidacion([]);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: 'none',
                                                background: 'transparent',
                                                fontSize: '16px',
                                                color: '#374151'
                                            }}
                                        />
                                    ) : (
                                        <Pressable onPress={() => setMostrarTimePicker(true)}>
                                            <Text className="text-gray-900 py-1">
                                                <Ionicons name="time-outline" size={20} color="#111827" />
                                                {formatearHoraParaMostrar(horaEvento)}
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                                {/* Error de hora */}
                                {errorHora && (
                                    <Text className="text-red-600 text-sm mt-1">
                                        {errorHora}
                                    </Text>
                                )}
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm text-gray-700 mb-2">Máximo de participantes</Text>
                                <View className="flex-row items-center">
                                    <TextInput
                                        placeholder="Ej: 10"
                                        className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                                        value={maxParticipantes === 0 ? '' : maxParticipantes.toString()}
                                        onChangeText={(text) => {
                                            // Permitir escribir cualquier número
                                            if (text === '') {
                                                setMaxParticipantes(0);
                                            } else {
                                                const num = parseInt(text);
                                                if (!isNaN(num)) {
                                                    setMaxParticipantes(num); // Permitir cualquier número
                                                }
                                            }
                                            // Limpiar errores mientras escribe
                                            if (erroresValidacion.length > 0) {
                                                setErroresValidacion([]);
                                            }
                                            // Limpiar error de participantes si cambia
                                            if (errorParticipantes) {
                                                setErrorParticipantes(null);
                                            }
                                        }}
                                        keyboardType="numeric"
                                        selectTextOnFocus={true}
                                    />
                                    <View className="ml-1">
                                        <Pressable
                                            onPress={incrementarParticipantes}
                                            className="bg-gray-200 px-2 py-0.5 rounded-t-md border border-gray-300"
                                        >
                                            <Ionicons name="chevron-up" size={12} color="#374151" />
                                        </Pressable>
                                        <Pressable
                                            onPress={decrementarParticipantes}
                                            className="bg-gray-200 px-2 py-0.5 rounded-b-md border border-gray-300 border-t-0"
                                        >
                                            <Ionicons name="chevron-down" size={12} color="#374151" />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                            {/* Error de participantes */}
                            {errorParticipantes && (
                                <Text className="text-red-600 text-sm mt-1">
                                    {errorParticipantes}
                                </Text>
                            )}

                            <View className="mb-6">
                                <Text className="text-sm text-gray-700 mb-2">Descripción</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                                    placeholder="Describe tu evento (opcional)"
                                    placeholderTextColor="#9ca3af"
                                    value={descripcion}
                                    onChangeText={setDescripcion}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={handleCancelar}
                                    className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                                >
                                    <Text className="text-white font-semibold">Cancelar</Text>
                                </Pressable>
                                <Pressable
                                    onPress={creandoEvento ? undefined : handleCrearEvento}
                                    className={`flex-1 rounded-xl py-3 items-center ${creandoEvento ? 'bg-gray-400' : 'bg-primary'
                                        }`}
                                    disabled={creandoEvento}
                                >
                                    <Text className="text-white font-semibold">
                                        {creandoEvento ? 'Creando...' : 'Crear Evento'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* DateTimePickers nativos para móvil */}
            {mostrarDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={fechaEvento}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={onCambiarFecha}
                />
            )}

            {mostrarTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={horaEvento}
                    mode="time"
                    display="default"
                    onChange={onCambiarHora}
                />
            )}
        </>
    );
}