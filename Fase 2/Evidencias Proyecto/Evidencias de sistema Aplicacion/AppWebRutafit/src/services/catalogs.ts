import { getJSON } from "../lib/https";

export type CatalogItem = { _id: string; nombre: string };

export async function fetchDeportes(): Promise<Record<string, string>> {
  const list = await getJSON<CatalogItem[]>("/tipos-deporte");
  return Object.fromEntries(list.map(i => [String(i._id), i.nombre]));
}

export async function fetchNiveles(): Promise<Record<string, string>> {
  const list = await getJSON<CatalogItem[]>("/nivel-experiencia");
  return Object.fromEntries(list.map(i => [String(i._id), i.nombre]));
}
