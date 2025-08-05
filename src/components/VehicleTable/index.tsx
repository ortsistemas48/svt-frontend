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
  { label: "Número de cédula verde", key: "green_card_number" },
  { label: "Vencimiento de la cédula", key: "green_card_expiration" },
  { label: "Número de licencia de conducir", key: "license_number" },
  { label: "Vencimiento de la licencia", key: "license_expiration" },
  {
    label: "Seleccione la oblea a vincular",
    key: "oblea_vincular",
  },
];

const renderVehicle = (car: CarType) => {
  return <div className="space-y-2">
    <div className="grid grid-cols-2 gap-x-10 gap-y-8 max-md:gap-y-10 mt-5 ">
      {tableData.map((item) => (
        <div key={item.key}>
          <strong className="font-medium opacity-50">{item.label}:</strong>
          <p className="capitalize">
            {car[item.key as keyof CarType] || "No disponible"}
          </p>
        </div>
      ))}
    </div>
  </div>
}

export default renderVehicle;