db.createCollection("usuarios", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "nombre",
                "email",
                "fechaNacimiento",
                "genero",
                "deporteFavorito",
                "nivelExperiencia",
                "notifications"
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "_id debe ser un string (no ObjectId, por compatibilidad con Firebase UID)"
                },
                nombre: {
                    bsonType: "string",
                    description: "Nombre es requerido y debe ser un string"
                },
                apellido: {
                    bsonType: "string",
                    description: "Apellido debe ser un string si se proporciona"
                },
                email: {
                    bsonType: "string",
                    pattern: "^.+@.+\\..+$",
                    description: "Email es requerido, único y debe tener formato válido"
                },
                fechaNacimiento: {
                    bsonType: "date",
                    description: "Fecha de nacimiento es requerida y debe ser tipo Date"
                },
                genero: {
                    bsonType: "string",
                    enum: ["hombre", "mujer"],
                    description: "Género es requerido y debe ser uno de los valores predefinidos"
                },
                deporteFavorito: {
                    bsonType: "objectId",
                    description: "Debe ser una referencia válida a la colección tipos_deporte"
                },
                nivelExperiencia: {
                    bsonType: "objectId",
                    description: "Debe ser una referencia válida a la colección nivel_experiencia"
                },
                fechaRegistro: {
                    bsonType: "date",
                    description: "Fecha de registro del usuario"
                },
                rutas: {
                    bsonType: ["array"],
                    items: {
                        bsonType: "objectId",
                        description: "Cada elemento debe ser un ObjectId válido de la colección rutas"
                    },
                    description: "Lista de rutas asociadas al usuario"
                },
                eventos: {
                    bsonType: ["array"],
                    items: {
                        bsonType: "objectId",
                        description: "Cada elemento debe ser un ObjectId válido de la colección eventos"
                    },
                    description: "Lista de eventos en los que participa el usuario"
                },
                avatar: {
                    bsonType: "string",
                    description: "URL o base64 del avatar del usuario"
                },
                expoPushToken: {
                    bsonType: "string",
                    description: "Token para notificaciones push (Expo)"
                },
                notifications: {
                    bsonType: "object",
                    required: ["enabled", "onEventJoin", "onEventCancelled"],
                    properties: {
                        enabled: {
                            bsonType: "bool",
                            description: "Habilitar/deshabilitar todas las notificaciones"
                        },
                        onEventJoin: {
                            bsonType: "bool",
                            description: "Notificación al unirse a un evento"
                        },
                        onEventCancelled: {
                            bsonType: "bool",
                            description: "Notificación al cancelarse un evento"
                        }
                    },
                    description: "Configuración de notificaciones del usuario"
                }
            }
        }
    }
});

db.usuarios.createIndex({ email: 1 }, { unique: true });

db.createCollection("nivel_experiencia", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "descripcion"],
            properties: {
                _id: {
                    bsonType: "objectId",
                    description: "Identificador único del nivel de experiencia"
                },
                nombre: {
                    bsonType: "string",
                    description: "Nombre del nivel de experiencia"
                },
                descripcion: {
                    bsonType: "string",
                    description: "Descripción del nivel de experiencia"
                }
            }
        }
    }
});

db.createCollection("tipos_deporte", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "descripcion"],
            properties: {
                _id: {
                    bsonType: "objectId",
                    description: "Identificador único del tipo de deporte"
                },
                nombre: {
                    bsonType: "string",
                    description: "Nombre del deporte"
                },
                descripcion: {
                    bsonType: "string",
                    description: "Descripción del deporte"
                }
            }
        }
    }
});

db.createCollection("eventos", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            title: "Esquema de Documento Evento",
            required: [
                "nombre_evento",
                "fecha_evento",
                "lugar",
                "estado",
                "max_participantes",
                "deporte_id",
                "createdBy"
            ],
            properties: {
                _id: {
                    bsonType: "objectId"
                },
                nombre_evento: {
                    bsonType: "string"
                },
                fecha_evento: {
                    bsonType: "date"
                },
                lugar: {
                    bsonType: "string"
                },
                estado: {
                    enum: ["programado", "cancelado", "finalizado"],
                    description: "Estado actual del evento."
                },
                max_participantes: {
                    bsonType: "number",
                    minimum: 1,
                    maximum: 99
                },

                // --- Referencia a tipos_deporte (Sigue siendo ObjectId) ---
                deporte_id: {
                    bsonType: "objectId",
                    description: "Referencia al _id de la colección tipos_deporte."
                },

                // --- COLECCIÓN EMBEBIDA: Participantes (id_usuario corregido a STRING) ---
                participantes: {
                    bsonType: "array",
                    description: "Lista de usuarios inscritos en el evento.",
                    items: {
                        bsonType: "object",
                        required: ["id_usuario", "fecha_registro"],
                        properties: {
                            id_usuario: {
                                bsonType: "string", // <--- CORREGIDO: Debe ser STRING para UID de usuario
                                description: "Referencia al _id (UID de Firebase) de la colección usuarios."
                            },
                            fecha_registro: {
                                bsonType: "date",
                                description: "Fecha y hora de inscripción."
                            }
                        }
                    }
                },

                // --- Referencia a usuario creador (createdBy corregido a STRING) ---
                createdBy: {
                    bsonType: "string", // <--- Debe ser STRING para UID de usuario
                    description: "Referencia al _id (UID de Firebase) del usuario organizador."
                },

                createdAt: {
                    bsonType: "date",
                    description: "Fecha de creación del documento evento."
                }
            }
        }
    }
});

db.createCollection("rutas", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "id_creador",
                "nombre_ruta",
                "recorrido",
                "nivel_dificultad",
                "distancia_km",
                "fecha_creacion"
            ],
            properties: {
                _id: {
                    bsonType: "objectId",
                    description: "Identificador único de la ruta"
                },
                id_creador: {
                    bsonType: "string",
                    description: "UID Firebase del usuario creador"
                },
                nombre_ruta: {
                    bsonType: "string",
                    minLength: 3,
                    maxLength: 100,
                    description: "Nombre de la ruta (requerido)"
                },
                recorrido: {
                    bsonType: "object",
                    required: ["type", "coordinates"],
                    properties: {
                        type: {
                            bsonType: "string",
                            enum: ["LineString"],
                            description: "Tipo de geometría (solo 'LineString')"
                        },
                        // Nota: aquí usas [lat, lng] como dijiste. (GeoJSON estándar usa [lng, lat])
                        coordinates: {
                            bsonType: "array",
                            minItems: 2,
                            items: {
                                bsonType: "array",
                                minItems: 2,
                                maxItems: 2,
                                items: { bsonType: ["double", "int", "long"] }
                            },
                            description: "Array de pares [lat, lng] que definen la línea"
                        }
                    },
                    additionalProperties: false
                },
                descripcion: {
                    bsonType: "string",
                    description: "Descripción de la ruta"
                },
                nivel_dificultad: {
                    bsonType: "string",
                    enum: ["Fácil", "Media", "Difícil"],
                    description: "Nivel de dificultad"
                },
                distancia_km: {
                    bsonType: ["double", "int", "long"],
                    minimum: 0,
                    description: "Distancia total en kilómetros (>= 0)"
                },
                fecha_creacion: {
                    bsonType: "date",
                    description: "Fecha de creación"
                },
                promedio_valoracion: {
                    bsonType: ["double", "int", "long"],
                    minimum: 0,
                    maximum: 5,
                    description: "Promedio de valoraciones (0..5)"
                },
                valoraciones: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        required: ["id_usuario", "puntuacion", "fecha"],
                        properties: {
                            id_usuario: {
                                bsonType: "string",
                                description: "UID Firebase del usuario que valora"
                            },
                            puntuacion: {
                                bsonType: ["int", "long", "double"],
                                minimum: 1,
                                maximum: 5,
                                description: "Puntuación (1..5)"
                            },
                            fecha: {
                                bsonType: "date",
                                description: "Fecha de la valoración"
                            }
                        },
                        additionalProperties: false
                    },
                    description: "Lista de valoraciones"
                }
            },
            additionalProperties: false
        }
    },
    validationLevel: "strict",
    validationAction: "error"
});

db.rutas.createIndex(
    { id_creador: 1, nombre_ruta: 1 },
    { unique: true, name: "uniq_nombre_por_creador" }
);

db.rutas.createIndex(
    { _id: 1, "valoraciones.id_usuario": 1 },
    { unique: true, name: "uniq_valoracion_usuario_por_ruta" }
);

db.rutas.createIndex({ "recorrido": "2dsphere" });
