import { Application, DailyStatistics } from "./app/types";

/* =========================
   Helpers para Server Components
   ========================= */
async function getBaseURL() {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) throw new Error("No host header");
  const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

async function serverFetch(path: string, init: RequestInit = {}) {
  const { cookies } = await import("next/headers");
  const cookieHeader = (await cookies()).toString();
  const base = await getBaseURL();
  return fetch(`${base}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });
}

/* =========================
   Universal fetch para APIs internas
   Usa serverFetch en server y window.fetch en client
   ========================= */
function isServer() {
  return typeof window === "undefined";
}

async function apiFetch(path: string, init: RequestInit = {}) {
  if (isServer()) {
    // Server side, reusa cookies y host mediante serverFetch
    return serverFetch(path, init);
  }
  // Client side
  return fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...init,
  });
}

/* =========================
   Client-side utilities
   ========================= */

type StickerOrderData = {
  id: number;
  name: string | null;
  available_count: number | null;
};

export async function fetchAvailableStickers({
  workshopId,
  currentCarId,
  currentLicensePlate,
}: {
  workshopId: number;
  currentCarId?: number;
  currentLicensePlate?: string;
}) {
  const params = new URLSearchParams({ workshop_id: String(workshopId) });
  if (currentCarId != null) params.set("current_car_id", String(currentCarId));
  if (currentLicensePlate) params.set("current_license_plate", currentLicensePlate.trim());

  const res = await apiFetch(`/api/stickers/available?${params}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "No se pudieron cargar las obleas");
  }
  return res.json(); // [{id, sticker_number, expiration_date, issued_at, status}]
}

export async function fetchAdminPendingWorkshops() {
  const res = await apiFetch(`/api/workshops/pending`);
  if (!res.ok) throw new Error("No se pudieron obtener los talleres pendientes");
  const workshops = await res.json();
  return { workshops };
}

export async function fetchAdminWorkshopDetail(workshopId: number | string) {
  const res = await apiFetch(`/api/workshops/${workshopId}`);
  if (!res.ok) throw new Error("No se pudo obtener el taller");
  return res.json();
}

export async function fetchAdminWorkshopMembers(workshopId: number | string) {
  const res = await apiFetch(`/api/admin/workshops/${workshopId}/members`);
  if (!res.ok) throw new Error("No se pudo obtener el personal del taller");
  return res.json(); // array de miembros
}

export async function assignStickerToCar(license_plate: string, sticker_id: number, workshop_id?: number) {
  const res = await apiFetch(`/api/stickers/assign-to-car`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_plate, sticker_id, workshop_id, mark_used: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function unassignStickerFromCar(license_plate: string) {
  const res = await apiFetch(`/api/stickers/unassign-from-car`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_plate, set_available: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminPendingUserData({
  limit = 100,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  const res = await apiFetch(`/api/users/get_users/pending?limit=${limit}&offset=${offset}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer usuarios pendientes:", text);
    return;
  }

  return res.json();
}

export async function fetchUserData({ workshopId }: { workshopId: number }) {
  const res = await apiFetch(`/api/users/get_users/workshop/${workshopId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer la aplicación:", text);
    return;
  }
  return res.json();
}

export async function fetchAdminUserData({
  limit = 100,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  const res = await apiFetch(`/api/users/get_users/all?limit=${limit}&offset=${offset}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer los usuarios:", text);
    return;
  }

  return res.json();
}

export function getMissingPersonFields(person: any): string[] {
  const requiredFields = ["dni", "first_name", "last_name", "street", "province", "city"];

  const fieldTranslations: Record<string, string> = {
    dni: "DNI",
    first_name: "Nombre",
    last_name: "Apellido",
    street: "Domicilio",
    province: "Provincia",
    city: "Localidad",
  };

  return requiredFields
    .filter((field) => {
      const value = person[field];
      return typeof value !== "string" || value.trim() === "";
    })
    .map((field) => fieldTranslations[field] || field);
}

export function getMissingCarFields(car: any): string[] {
  const requiredFields = [
    "license_plate",
    "brand",
    "vehicle_type",
    "usage_type",
    "model",
    "engine_number",
    "engine_brand",
    "chassis_number",
    "chassis_brand",
    "total_weight",
    "front_weight",
    "back_weight",
    "fuel_type",
    "green_card_number",
    "green_card_expiration",
    "license_number",
    "license_expiration",
    "manufacture_year",
  ];
  const fieldTranslations = {
    license_plate: "Dominio",
    brand: "Marca",
    model: "Modelo",
    manufacture_year: "Año",
    weight: "Peso",
    fuel_type: "Tipo de combustible",
    vehicle_type: "Tipo de vehículo",
    usage_type: "Tipo de uso",
    engine_brand: "Marca de motor",
    engine_number: "Número de motor",
    chassis_number: "Número de chasis",
    chassis_brand: "Marca de chasis",
    green_card_number: "N° de la cédula verde",
    green_card_expiration: "Exp. de la cédula",
    license_number: "N° de licencia",
    license_expiration: "Exp. de licencia",
  };
  return requiredFields
    .filter((field: string) => {
      const value = car[field];
      return typeof value !== "string" || value.trim() === "";
    })
    .map((field) => fieldTranslations[field as keyof typeof fieldTranslations] || field);
}

export function isDataEmpty(obj: any): boolean {
  if (!obj) return true;

  return Object.entries(obj)
    .filter(([key]) => key !== "id")
    .filter(([key]) => key !== "is_owner")
    .filter(([key]) => key !== "owner_id")
    .filter(([key]) => key !== "driver_id")
    .every(([, value]) => {
      if (typeof value === "string") return value.trim() === "";
      if (typeof value === "number") return false;
      if (value === null || value === undefined) return true;
      if (typeof value === "object") return isDataEmpty(value);
      return false;
    });
}

export function filterApplications({ applications, searchText }: { applications: Application[]; searchText: string }) {
  return applications.filter((item) => {
    if (!searchText.trim()) return true;

    const query = searchText.toLowerCase();

    const licensePlate = item.car?.license_plate?.toLowerCase() || "";
    const brand = item.car?.brand?.toLowerCase() || "";
    const model = item.car?.model?.toLowerCase() || "";

    const firstName = item.owner?.first_name?.toLowerCase() || "";
    const lastName = item.owner?.last_name?.toLowerCase() || "";
    const dni = item.owner?.dni?.toLowerCase() || "";

    return (
      licensePlate.includes(query) ||
      brand.includes(query) ||
      model.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      dni.includes(query)
    );
  });
}

export function genPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  const syms = "!@#$%^&*()-_=+";
  const all = upper + lower + nums + syms;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  let p = pick(upper) + pick(lower) + pick(nums) + pick(syms);
  for (let i = 4; i < 12; i++) p += pick(all);
  p = p.split("").sort(() => Math.random() - 0.5).join("");
  return p;
}

export async function markStickerAsUsed(stickerId: number) {
  try {
    const res = await apiFetch(`/api/stickers/${stickerId}/mark-used`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "No se pudo marcar la oblea como 'En Uso'");
    }
    console.log("Oblea marcada como 'En Uso'");
  } catch (e) {
    console.error("Error al marcar la oblea:", e);
  }
}

export async function fetchStickerOrders(workshopId: number) {
  const res = await apiFetch(`/api/stickers/orders?workshop_id=${workshopId}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "No se pudieron cargar las órdenes de obleas");
  }
  const data = await res.json();
  console.log(data);
  return data; // [{id, name, status, amount, created_at}]
}

export async function fetchStickersByWorkshop(workshopId: number, page = 1, perPage = 10) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  const res = await apiFetch(`/api/stickers/workshop/${workshopId}?${params}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "No se pudieron cargar las obleas");
  }

  const data = await res.json();
  console.log(data);
  return data; // {stickers: [...], pagination: {...}}
}

/* =========================
   Terceros
   Nota, estas llamadas son externas, no van por serverFetch
   ========================= */

const BASE = "https://apis.datos.gob.ar/georef/api";

// Lista fija de provincias de Argentina, incluye CABA
export type Option = { value: string; label: string };

export const AR_PROVINCES: Option[] = [
  { value: "CABA", label: "CABA" },
  { value: "Buenos Aires", label: "Buenos Aires" },
  { value: "Catamarca", label: "Catamarca" },
  { value: "Chaco", label: "Chaco" },
  { value: "Chubut", label: "Chubut" },
  { value: "Córdoba", label: "Córdoba" },
  { value: "Corrientes", label: "Corrientes" },
  { value: "Entre Ríos", label: "Entre Ríos" },
  { value: "Formosa", label: "Formosa" },
  { value: "Jujuy", label: "Jujuy" },
  { value: "La Pampa", label: "La Pampa" },
  { value: "La Rioja", label: "La Rioja" },
  { value: "Mendoza", label: "Mendoza" },
  { value: "Misiones", label: "Misiones" },
  { value: "Neuquén", label: "Neuquén" },
  { value: "Río Negro", label: "Río Negro" },
  { value: "Salta", label: "Salta" },
  { value: "San Juan", label: "San Juan" },
  { value: "San Luis", label: "San Luis" },
  { value: "Santa Cruz", label: "Santa Cruz" },
  { value: "Santa Fe", label: "Santa Fe" },
  { value: "Santiago del Estero", label: "Santiago del Estero" },
  { value: "Tierra del Fuego", label: "Tierra del Fuego" },
  { value: "Tucumán", label: "Tucumán" },
];

export async function getProvinces(): Promise<Option[]> {
  return AR_PROVINCES;
}

export async function getLocalidadesByProvincia(provinceName: string): Promise<Option[]> {
  if (!provinceName) return [];
  const url = `${BASE}/localidades?provincia=${encodeURIComponent(provinceName)}&campos=id,nombre&orden=nombre&max=5000`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const seen = new Set<string>();
  const items = (data?.localidades ?? [])
    .filter((l: any) => {
      const k = String(l.id);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((l: any) => ({
      value: l.nombre,
      label: l.nombre,
      key: String(l.id),
    }));

  return items;
}

/* =========================
   Server Components utilities
   ========================= */

export async function fetchDailyStatistics(workshopId: number, date?: string): Promise<DailyStatistics> {
  const baseUrl = `/api/applications/workshop/${workshopId}/daily-statistics`;
  const url = date ? `${baseUrl}?date=${encodeURIComponent(date)}` : baseUrl;

  try {
    const response = await apiFetch(url, { method: "GET" });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to fetch daily statistics: ${response.status} - ${errorText}`);
    }
    return response.json();
  } catch {
    return {
      date: new Date().toISOString().split("T")[0],
      workshop_id: workshopId,
      applications: { total: 0, in_queue: 0, completed: 0, approved: 0, approval_rate: 0 },
      sticker_stock: { total: 0, available: 0, used: 0, unavailable: 0 },
    };
  }
}

export async function fetchLatestApplications(workshopId: number, perPage = 5) {
  const params = new URLSearchParams({ page: "1", per_page: String(perPage) });

  const res = await apiFetch(`/api/applications/workshop/${workshopId}/full?${params.toString()}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to fetch latest applications: ${res.status} - ${errorText}`);
  }

  return res.json();
}

export async function fetchQueueApplications(workshopId: number, perPage = 10) {
  const params = new URLSearchParams({
    page: "1",
    per_page: String(perPage),
    status_in: "En Cola,En curso",
  });

  const res = await apiFetch(`/api/applications/workshop/${workshopId}/full?${params.toString()}`, {
    method: "GET",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to fetch queue applications: ${res.status} - ${errorText}`);
  }

  return res.json();
}

/* =========================
   Utils
   ========================= */
export const onlyDigits = (s: string) => s.replace(/\D+/g, "");
export const NAME_ALLOWED = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]/g;
export const sanitizeName = (s: string) => (s.match(NAME_ALLOWED)?.join("") ?? "");
export const sanitizeEmail = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
export const clamp = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);
export const toUpper = (s: string) => s.toUpperCase();
export const onlyAlnumUpper = (s: string) => toUpper(s).replace(/[^A-Z0-9]/g, "");
export const alnumSpaceUpper = (s: string) => toUpper(s).replace(/[^A-Z0-9\s]/g, "");
export const lettersSpaceUpper = (s: string) => toUpper(s).replace(/[^A-ZÁÉÍÓÚÑÜ\s-]/g, "");
