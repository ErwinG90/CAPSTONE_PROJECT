import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Switch, Pressable, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Deporte } from '../../interface/Deporte';
import type { Ruta } from '../../interface/Ruta';
import { deporteService } from '../../services/DeporteService';
import { getProfile } from '../../src/storage/localCache';
import { Ionicons } from '@expo/vector-icons';
import { rutaService } from '../../services/RutaService';
import { useRouter } from "expo-router";

type GuardarRutaFormProps = {
    puntosGPS: [number, number][];
    distancia: number;
    onGuardar: (ruta: Ruta) => void;
    onDescartar: () => void;
};

export default function GuardarRutaForm({
    puntosGPS,
    distancia,
    onGuardar,
    onDescartar,
}: GuardarRutaFormProps) {
    console.log('Props recibidos en GuardarRutaForm:', { puntosGPS, distancia });
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipoDeporte, setTipoDeporte] = useState('');
    const [dificultad, setDificultad] = useState('Fácil');
    const [rutaPublica, setRutaPublica] = useState(false);
    const [deportes, setDeportes] = useState<Deporte[]>([]);
    const [errors, setErrors] = useState<{ nombre?: string; tipoDeporte?: string; dificultad?: string }>({});
    const router = useRouter();
    const [guardandoRuta, setGuardandoRuta] = useState(false);

    // Handlers para limpiar errores al escribir
    const handleNombreChange = (text: string) => {
        setNombre(text);
        setErrors(prev => ({
            ...prev,
            nombre: text.trim() ? undefined : 'El nombre de la ruta es obligatorio.'
        }));
    };
    const handleTipoDeporteChange = (value: string) => {
        setTipoDeporte(value);
        setErrors(prev => ({
            ...prev,
            tipoDeporte: value ? undefined : 'Debes seleccionar un tipo de deporte.'
        }));
    };
    const handleDificultadChange = (value: string) => {
        setDificultad(value);
        setErrors(prev => ({
            ...prev,
            dificultad: value ? undefined : 'Debes seleccionar la dificultad.'
        }));
    };
    // Obtener deportes desde el backend
    useEffect(() => {
        deporteService.getDeportes()
            .then(setDeportes)
            .catch(err => {/* manejar error */ });
    }, []);

    // Función para guardar
    const handleGuardar = async () => {
        setGuardandoRuta(true);
        // Validar campos obligatorios
        const newErrors: { nombre?: string; tipoDeporte?: string; dificultad?: string } = {};
        if (!nombre.trim()) {
            newErrors.nombre = 'El nombre de la ruta es obligatorio.';
        }
        if (!tipoDeporte) {
            newErrors.tipoDeporte = 'Debes seleccionar un tipo de deporte.';
        }
        if (!dificultad) {
            newErrors.dificultad = 'Debes seleccionar la dificultad.';
        }
        setErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) {
            return;
        }
        console.log('Coordenadas:', JSON.stringify(puntosGPS));

        // Obtener perfil del usuario autenticado
        let perfilUsuario;
        try {
            perfilUsuario = await getProfile();
            if (!perfilUsuario || !perfilUsuario.uid) {
                Alert.alert('Error', 'Debes estar autenticado para guardar la ruta');
                return;
            }
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            Alert.alert('Error', 'No se pudo obtener el perfil del usuario');
            return;
        }

        // Buscar el nombre del deporte seleccionado
        const deporteSeleccionado = deportes.find(dep => dep._id === tipoDeporte);
        const nombreDeporte = deporteSeleccionado ? deporteSeleccionado.nombre.toLowerCase() : tipoDeporte;

        const ruta: Ruta = {
            id_creador: perfilUsuario.uid,
            nombre_ruta: nombre,
            descripcion,
            tipo_deporte: nombreDeporte,
            nivel_dificultad: dificultad,
            distancia_km: distancia,
            recorrido: {
                type: 'LineString',
                coordinates: puntosGPS // array de [long, lat]
            },
            ruta_publica: rutaPublica
        };
        // Enviar a backend
        console.log('Datos que se envían al backend:', ruta);
        rutaService.crearRuta(ruta)
            .then((data) => {
                console.log('Respuesta del backend:', data);
                onGuardar(data); // puedes pasar la ruta guardada si lo necesitas
                if (Platform.OS !== 'web') {
                    Alert.alert('¡Ruta guardada!', 'La ruta se ha guardado con éxito.', [{ text: 'OK' }]);
                }
                router.replace("/(tabs)/rutas");
            })
            .catch((error) => {
                console.log('Error al guardar ruta:', error?.response?.data || error);
                Alert.alert('Error', error?.response?.data?.message || error.message || 'No se pudo guardar la ruta');
                setGuardandoRuta(false);
            });
    };
    // Handler para descartar con confirmación
    const handleDescartar = () => {
        Alert.alert(
            '¿Descartar ruta?',
            '¿Estás seguro que deseas descartar la ruta? Los datos se perderán.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Descartar', style: 'destructive', onPress: onDescartar }
            ]
        );
    };

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="border border-gray-200 rounded-2xl mx-4 mt-14 p-4 bg-white">
                {/* Mensaje de éxito */}
                <View className="mb-6 items-center">
                    <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                    <Text className="text-xl font-bold text-green-800 mt-2">¡Ruta Completada!</Text>
                    <Text className="text-green-700 mt-1">Has terminado tu sesión de Entrenamiento</Text>
                </View>

                <View className="mx-0">
                    <Text className="text-xl font-bold text-gray-900 mb-6">Guardar Ruta</Text>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Nombre de la ruta</Text>
                        <TextInput
                            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                            placeholder="Mi ruta increíble..."
                            placeholderTextColor="#9ca3af"
                            value={nombre}
                            onChangeText={handleNombreChange}
                        />
                        {errors.nombre ? (
                            <Text className="text-red-500 text-xs mt-1">{errors.nombre}</Text>
                        ) : null}
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Descripción</Text>
                        <TextInput
                            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
                            placeholder="Describe los detalles..."
                            placeholderTextColor="#9ca3af"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Tipo de deporte</Text>
                        <View className="bg-gray-100 rounded-xl border border-gray-200">
                            <Picker
                                selectedValue={tipoDeporte}
                                onValueChange={handleTipoDeporteChange}
                            >
                                <Picker.Item label="Selecciona el deporte" value="" />
                                {deportes.map(dep => (
                                    <Picker.Item key={dep._id} label={dep.nombre} value={dep._id} />
                                ))}
                            </Picker>
                        </View>
                        {errors.tipoDeporte ? (
                            <Text className="text-red-500 text-xs mt-1">{errors.tipoDeporte}</Text>
                        ) : null}
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Dificultad</Text>
                        <View className="bg-gray-100 rounded-xl border border-gray-200">
                            <Picker
                                selectedValue={dificultad}
                                onValueChange={handleDificultadChange}
                            >
                                <Picker.Item label="Fácil" value="Fácil" />
                                <Picker.Item label="Media" value="Media" />
                                <Picker.Item label="Difícil" value="Difícil" />
                            </Picker>
                        </View>
                        {errors.dificultad ? (
                            <Text className="text-red-500 text-xs mt-1">{errors.dificultad}</Text>
                        ) : null}
                    </View>

                    <View className="mb-6 flex-row items-center">
                        <Text className="text-sm text-gray-700 mr-2">Ruta Pública</Text>
                        <Switch value={rutaPublica} onValueChange={setRutaPublica} />
                    </View>

                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={handleDescartar}
                            className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                        >
                            <Text className="text-white font-semibold">Descartar</Text>
                        </Pressable>
                        <Pressable
                            onPress={guardandoRuta ? undefined : handleGuardar}
                            className={`flex-1 bg-green-500 rounded-xl py-3 items-center ${guardandoRuta ? 'bg-gray-400' : 'bg-green-500'}`}
                            disabled={guardandoRuta}
                        >
                            <Text className="text-white font-semibold">
                                {guardandoRuta ? 'Guardando...' : 'Guardar Ruta'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};