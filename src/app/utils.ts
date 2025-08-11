import { CarType, PersonType } from "./types";


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