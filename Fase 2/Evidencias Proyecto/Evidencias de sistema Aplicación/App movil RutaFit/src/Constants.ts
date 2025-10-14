// Tipos de género disponibles
export type Genero = "mujer" | "hombre";

// Expresión regular para validar solo letras y espacios
export const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

// ===== URLs DE API =====
export const API_BASE_URL = "https://ms-rutafit-neg.vercel.app/ms-rutafit-neg";

export const API_ENDPOINTS = {
  TIPOS_DEPORTE: `${API_BASE_URL}/tipos-deporte`,
  NIVEL_EXPERIENCIA: `${API_BASE_URL}/nivel-experiencia`,
  USERS: `${API_BASE_URL}/users`,
};

// ===== CONFIGURACIÓN DE VALIDACIÓN =====
export const VALIDATION_CONFIG = {
  MIN_NAME_LENGTH: 2,
  MIN_PASSWORD_LENGTH: 6,
  MIN_AGE: 16,
  CURRENT_YEAR: new Date().getFullYear(),
  MIN_YEAR: 1950,
};

// ===== MENSAJES DE ERROR =====
export const ERROR_MESSAGES = {
  AUTH: {
    EMAIL_IN_USE: "Ese correo ya está registrado.",
    INVALID_EMAIL: "El correo no es válido.",
    WEAK_PASSWORD: "Contraseña muy débil (mín. 6).",
    NETWORK_ERROR: "Sin conexión. Revisa tu internet.",
    DEFAULT: "No se pudo crear la cuenta.",
  },
  VALIDATION: {
    NAME_INVALID: "Solo letras y mínimo 2 caracteres.",
    EMAIL_INVALID: "Formato: palabra@dominio.com",
    PASSWORD_INVALID: "Mínimo 6 caracteres, con minúscula y MAYÚSCULA.",
    PASSWORD_MISMATCH: "Las contraseñas no coinciden.",
    DATE_REQUIRED: "La fecha es obligatoria.",
    DATE_FUTURE: "La fecha no puede ser futura.",
    DATE_UNDERAGE: "Debes tener al menos 16 años.",
    DATE_TOO_OLD: "Fecha demasiado antigua.",
  },
};

// ===== MENSAJES DE ÉXITO =====
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: "Cuenta creada exitosamente. Serás redirigido al login…",
};

// ===== PLACEHOLDERS Y TEXTOS DE UI =====
export const PLACEHOLDERS = {
  NAME: "Escribe tu nombre",
  LAST_NAME: "Escribe tu apellido",
  EMAIL: "example@gmail.com",
  PASSWORD: "Mínimo 6 caracteres",
  REPEAT_PASSWORD: "Vuelve a escribir la contraseña",
  SELECT_SPORT: "Selecciona un deporte",
  SELECT_LEVEL: "Selecciona un nivel",
};

// ===== LABELS DE FORMULARIO =====
export const LABELS = {
  NAME: "Nombre",
  LAST_NAME: "Apellido",
  EMAIL: "Email",
  PASSWORD: "Contraseña",
  REPEAT_PASSWORD: "Repetir contraseña",
  BIRTH_DATE: "Fecha de nacimiento",
  GENDER: "Género",
  SPORT: "Deporte",
  EXPERIENCE_LEVEL: "Nivel de experiencia",
  WOMAN: "Mujer",
  MAN: "Hombre",
};

// ===== BOTONES =====
export const BUTTONS = {
  CREATE_ACCOUNT: "Crear cuenta",
  CREATING: "Creando...",
  LOGIN_LINK: "¿Ya tienes cuenta? Inicia sesión",
};

// Exportar todo como un objeto principal para compatibilidad
export const constants = {
  SOLO_LETRAS,
  API_BASE_URL,
  API_ENDPOINTS,
  VALIDATION_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PLACEHOLDERS,
  LABELS,
  BUTTONS,
};

export const AVATAR_KEYS = [
  "ciclista_hombre",
  "ciclista_mujer",
  "senderismo_hombre",
  "senderismo_mujer",
  "running_hombre",
  "running_mujer",
  "trekking_hombre",
  "trekking_mujer",
  "zorro",
  "aguila",
  "buho",
  "huella",
  "brujula",
  "sol_naciente",
  "Pluma"
] as const;
export type AvatarKey = typeof AVATAR_KEYS[number];

// Import estático: RN necesita `require` con ruta fija
export const AVATAR_IMAGES: Record<AvatarKey, any> = {
  ciclista_hombre: require("../assets/ImgPerfil/Ciclismo1.png"),
  ciclista_mujer: require("../assets/ImgPerfil/Ciclismo2.png"),
  senderismo_hombre: require("../assets/ImgPerfil/Senderismo1.png"),
  senderismo_mujer: require("../assets/ImgPerfil/Senderismo2.png"), // <- ojo aquí
  running_hombre: require("../assets/ImgPerfil/Running1.png"),
  running_mujer: require("../assets/ImgPerfil/Running2.png"),
  trekking_hombre: require("../assets/ImgPerfil/Trekking1.png"),
  trekking_mujer: require("../assets/ImgPerfil/Trekking2.png"),
  zorro: require("../assets/ImgPerfil/Zorro.png"),
  aguila: require("../assets/ImgPerfil/Aguila.png"),
  buho: require("../assets/ImgPerfil/Buho.png"),
  huella: require("../assets/ImgPerfil/Huella.png"),
  brujula: require("../assets/ImgPerfil/Brujula.png"),
  sol_naciente: require("../assets/ImgPerfil/Sol.png"),
  Pluma: require("../assets/ImgPerfil/Pluma.png"),
};

