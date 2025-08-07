import { CarType } from "@/app/types";
const tableData = [
  { label: "Dominio", key: "license_plate" },
  { label: "Marca", key: "brand" },
  { label: "Modelo", key: "model" },
  { label: "Año", key: "manufacture_year" },
  {
    label: "Peso del auto",

    key: "weight",
  },
  {
    label: "Tipo de combustible",
    key: "fuel_type",
  },
  {
    label: "Tipo de vehículo",

    key: "vehicle_type",
  },
  {
    label: "Tipo de uso",
    key: "usage_type",
  },
  { label: "Marca de motor", key: "engine_brand" },
  { label: "Número de motor", key: "engine_number" },
  { label: "Número de chasis", key: "chassis_number" },
  { label: "Marca de chasis", key: "chassis_brand" },
  { label: "Nº de cédula verde", key: "green_card_number" },
  { label: "Exp. de la cédula", key: "green_card_expiration" },
  { label: "Nº de licencia", key: "license_number" },
  { label: "Exp. de la licencia", key: "license_expiration" },
  {
    label: "Oblea",
    key: "oblea_vincular",
  },
];

const renderVehicle = (car: CarType) => {
  const formatDate = (value: string) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-2 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-x-10 gap-y-8 mt-5">
        {tableData.map((item) => {
          const rawValue = car[item.key as keyof CarType];
          const isDateKey = item.key === "green_card_expiration" || item.key === "license_expiration";
          const value =
            isDateKey && typeof rawValue === "string"
              ? formatDate(rawValue)
              : rawValue || "No disponible";

          return (
            <div key={item.key}>
              <strong className="font-medium opacity-50">{item.label}:</strong>
              <p className="capitalize">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default renderVehicle;