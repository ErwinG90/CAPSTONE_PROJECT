const API_BASE = "https://capstone-project-3-13xo.onrender.com/ms-rutafit-neg";

export interface UsuarioDTO {
    uid: string;
    nombre?: string;
    apellido?: string;
    email?: string;
}

// GET /users/:uid
export async function fetchUserByUid(uid: string): Promise<UsuarioDTO> {
    const res = await fetch(`${API_BASE}/users/${uid}`);

    if (!res.ok) {
        throw new Error(`No se pudo obtener el usuario ${uid}`);
    }

    return res.json();
}