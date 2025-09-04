import { Application } from "./app/types";

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
  if (currentCarId) params.set("current_car_id", String(currentCarId));
  if (currentLicensePlate) params.set("current_license_plate", currentLicensePlate);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers/available?${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "No se pudieron cargar las obleas");
  }
  return res.json(); // [{id, sticker_number, expiration_date, issued_at, status}]
}

export async function fetchAvailableStickerOrders({
  workshopId,
  currentCarId,
  currentLicensePlate,
}: {
  workshopId: number;
  currentCarId?: number;
  currentLicensePlate?: string;
}) {
  const params = new URLSearchParams({ workshop_id: String(workshopId) });
  if (currentCarId) params.set("current_car_id", String(currentCarId));
  if (currentLicensePlate) params.set("current_license_plate", currentLicensePlate);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers/available-orders?${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "No se pudieron cargar las obleas");
  }
  const json = await res.json();
  if (!Array.isArray(json)) {
    console.error("La API no devolvió un array:", json);
    return [];
  }
  return json as StickerOrderData[];
}


export async function assignStickerToCar(license_plate: string, sticker_id: number, workshop_id?: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers/assign-to-car`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_plate, sticker_id, workshop_id, mark_used: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function unassignStickerFromCar(license_plate: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers/unassign-from-car`, {
    method: "POST",
    credentials: "include",
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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/get_users/pending?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer usuarios pendientes:", text);
    return;
  }

  return res.json();
}


export async function fetchUserData({ workshopId }: { workshopId: number }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/get_users/workshop/${workshopId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer la aplicación:", text);
    return;
  }
  const data = await res.json();
  return data;
}

export async function fetchAdminUserData({
  limit = 100,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/get_users/all?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer los usuarios:", text);
    return;
  }

  const data = await res.json();
  return data;
}


export function getMissingPersonFields(person: any): string[] {
  const requiredFields = [
    "dni",
    "first_name",
    "last_name",
    "street",
    "province",
    "city",
  ];

  const fieldTranslations: Record<string, string> = {
    dni: "DNI",
    first_name: "Nombre",
    last_name: "Apellido",
    street: "Domicilio",
    province: "Provincia",
    city: "Localidad",
  };

  return requiredFields
    .filter((field: string) => {
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
    "weight",
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
      if (typeof value === "number") return false; // DNI, años, etc. cuentan como datos
      if (value === null || value === undefined) return true;
      if (typeof value === "object") return isDataEmpty(value); // Evalúa objetos anidados
      return false;
    });
}

export function filterApplications({ applications, searchText }: { applications: Application[], searchText: string }) {
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

export function genPassword(){
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const nums  = "23456789";
    const syms  = "!@#$%^&*()-_=+";
    const all = upper + lower + nums + syms;
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
    let p = pick(upper) + pick(lower) + pick(nums) + pick(syms);
    for (let i = 4; i < 12; i++) p += pick(all);
    p = p.split("").sort(() => Math.random() - 0.5).join("");
    
    return p;
  };

  
export async function markStickerAsUsed(stickerId: number) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/stickers/${stickerId}/mark-used`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "No se pudo marcar la oblea como 'En Uso'");
    }
    console.log("Oblea marcada como 'En Uso'");
  } catch (e) {
    console.error("Error al marcar la oblea:", e);
  }
}

const BASE = "https://apis.datos.gob.ar/georef/api";

export type Option = { value: string; label: string; key?: string };

export async function getProvinces(): Promise<Option[]> {
  const res = await fetch(`${BASE}/provincias?orden=nombre&campos=nombre&max=1000`, { cache: "no-store" });
  const data = await res.json();
  return (data?.provincias ?? []).map((p: any) => ({ value: p.nombre, label: p.nombre }));
}


export async function getLocalidadesByProvincia(provinceName: string): Promise<Option[]> {
  if (!provinceName) return [];
  const url = `${BASE}/localidades?provincia=${encodeURIComponent(
    provinceName
  )}&campos=id,nombre&orden=nombre&max=5000`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  // Deduplicar por id (más confiable)
  const seen = new Set<string>();
  const items = (data?.localidades ?? [])
    .filter((l: any) => {
      const k = String(l.id);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((l: any) => ({
      // Podés guardar id como value si te sirve para backend;
      // si no, dejá el nombre como value y agregá key aparte:
      value: l.nombre,
      label: l.nombre,
      key: String(l.id), // <- único
    }));

  return items;
}

export const onlyDigits = (s: string) => s.replace(/\D+/g, "");
export const NAME_ALLOWED = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]/g;
export const sanitizeName = (s: string) => (s.match(NAME_ALLOWED)?.join("") ?? "");
export const sanitizeEmail = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
export const clamp = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);
export const toUpper = (s: string) => s.toUpperCase();
export const onlyAlnumUpper = (s: string) => toUpper(s).replace(/[^A-Z0-9]/g, "");
export const alnumSpaceUpper = (s: string) => toUpper(s).replace(/[^A-Z0-9\s]/g, "");
export const lettersSpaceUpper = (s: string) => toUpper(s).replace(/[^A-ZÁÉÍÓÚÑÜ\s-]/g, "");
