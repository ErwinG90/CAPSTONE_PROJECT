import { getJSON } from "../lib/https";


export type UserBasic = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  genero?: string;
  deporteFavorito?: string;   
  nivelExperiencia?: string;  
  fechaRegistro?: string;  
  fechaNacimiento?: string;  
};

export type UsersResponse = { rows: UserBasic[]; total: number };

export async function fetchUsers(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<UsersResponse> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  q.set("page", String(params?.page ?? 1));
  q.set("pageSize", String(params?.pageSize ?? 20));

  
  const candidates = [
    `/admin/users?${q.toString()}`,
    `/usuarios?${q.toString()}`,
    `/users?${q.toString()}`,
  ];

  let lastErr: unknown = null;
  for (const path of candidates) {
    try {
      const raw = await getJSON<any>(path);

      // { rows, total }
      if (raw && Array.isArray(raw.rows)) {
        const rows = (raw.rows as any[]).map(mapUserBasic);
        const total = typeof raw.total === "number" ? raw.total : rows.length;
        return { rows, total };
      }
      // [ ... ]
      if (Array.isArray(raw)) {
        const rows = (raw as any[]).map(mapUserBasic);
        return { rows, total: rows.length };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No se pudo obtener usuarios");
}

function mapUserBasic(u: any): UserBasic {
  return {
    _id: String(u._id ?? u.id ?? crypto.randomUUID()),
    nombre: String(u.nombre ?? ""),
    apellido: String(u.apellido ?? ""),
    email: String(u.email ?? ""),
    genero: u.genero ?? undefined,
    deporteFavorito: u.deporteFavorito ?? undefined,
    nivelExperiencia: u.nivelExperiencia ?? undefined,
    fechaRegistro: u.fechaRegistro ?? undefined,
    fechaNacimiento:
      u.fechaNacimiento ??
  
      undefined,
  };
}


  

