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

  return requiredFields.filter((field: string) => {
    const value = person[field];
    return typeof value !== "string" || value.trim() === "";
  });
}

// export type CarType = {
//   id: number;
//   license_plate: string;
//   brand: string;
//   vehicle_type: string;
//   usage_type: string;
//   model: string;
//   engine_number: string;
//   engine_brand: string;
//   chassis_number: string;
//   chassis_brand: string;
//   weight: number;
//   fuel_type: string;
//   green_card_number: string;
//   green_card_start: string;
//   license_number: string;
//   license_expiration: string;
//   manufacture_year: number;
//   owner_id: number;
//   driver_id: number;
// };
export function isCarDataComplete(car: CarType): boolean  {

  const requiredFields: (keyof CarType)[] = [
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
    "green_card_start",
    "license_number",
    "license_expiration",
    "manufacture_year",
  ];

  return requiredFields.every((field) => {
    const value = car[field];
    return typeof value === "string" && value.trim() !== "";
  });
}
    