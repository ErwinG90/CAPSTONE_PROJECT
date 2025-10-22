// services/UserService.ts  (agrega esto junto al updateUserAvatar)
import axios from "axios";
const API_BASE = "https://capstone-project-3-13xo.onrender.com/ms-rutafit-neg";

export type UpdateUserPayload = {
    nombre?: string;
    apellido?: string;
    fechaNacimiento?: string; // "YYYY-MM-DD"
    genero?: "hombre" | "mujer";
    deporteFavorito?: string | null;
    nivelExperiencia?: string | null;
};

export async function updateUserProfile(uid: string, payload: UpdateUserPayload) {
    const url = `${API_BASE}/users/${encodeURIComponent(uid)}`;
    // IMPORTANTE: solo envía campos permitidos
    const { data } = await axios.put(url, payload);
    return data;
}

export async function updateUserAvatar(uid: string, avatarKey: string) {
    const url = `${API_BASE}/users/${encodeURIComponent(uid)}`;
    const { data } = await axios.put(url, { avatar: avatarKey });
    return data;
}

export async function getUserById(uid: string) {
    const url = `${API_BASE}/users/${encodeURIComponent(uid)}`;
    const { data } = await axios.get(url);
    return data;
}

