import { CarType } from "@/app/types";

const tableData = [
  { label: "Dominio", key: "license_plate" },
  { label: "Marca", key: "brand" },
  { label: "Modelo", key: "model" },
  { label: "Año", key: "manufacture_year" },
  { label: "Peso del auto (KG)", key: "total_weight" },
  { label: "Peso eje trasero (KG)", key: "back_weight" },
  { label: "Peso eje delantero (KG)", key: "front_weight" },
  { label: "Tipo de combustible", key: "fuel_type" },
  { label: "Tipo de vehículo", key: "vehicle_type" },
  { label: "Tipo de uso", key: "usage_type" },
  { label: "Marca de motor", key: "engine_brand" },
  { label: "Número de motor", key: "engine_number" },
  { label: "Número de chasis", key: "chassis_number" },
  { label: "Marca de chasis", key: "chassis_brand" },
  { label: "Nº de cédula verde", key: "green_card_number" },
  { label: "Exp. de la cédula", key: "green_card_expiration" },
  { label: "Nº de licencia", key: "license_number" },
  { label: "Exp. de la licencia", key: "license_expiration" },
  { label: "Póliza del seguro", key: "insurance" },
  // 👇 campos del sticker (anidados)

  // (opcional) mostrarlos si querés
  // { label: "Estado de oblea", key: "sticker.status" },
  // { label: "Vencimiento oblea", key: "sticker.expiration_date" },
];

// Helper para acceder a rutas "a.b.c"
function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

const renderVehicle = (car: CarType) => {
  const formatDate = (value: string) => {
    const d = new Date(value);
    // Si no es fecha válida, devolvés el valor crudo
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  };

  const isDateKey = (key: string) =>
    key === "green_card_expiration" ||
    key === "license_expiration" ||
    key === "sticker.expiration_date";

  return (
    <div className="space-y-2 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-x-10 gap-y-8 mt-5">
        {tableData.map((item) => {
          const rawValue = getByPath(car, item.key);
          let value: any = rawValue;

          if (value == null || value === "") {
            value = "No disponible";
          } else if (typeof value === "string" && isDateKey(item.key)) {
            value = formatDate(value);
          }

          return (
            <div key={item.key}>
              <strong className="font-medium opacity-50">{item.label}:</strong>
              {/* Evitá "capitalize" para no alterar patentes/oblea */}
              <p className="break-all">{String(value)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default renderVehicle;
