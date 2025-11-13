export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    // sin credentials si no usas cookies
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} – ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}
