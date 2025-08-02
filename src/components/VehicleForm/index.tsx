// app/Form.tsx

import FormField from "@/components/FormField";
import React from "react";

const formData1 = [
  { label: "Dominio", placeholder: "Ej: AB123AB", name: "license_plate" },
  { label: "Marca", placeholder: "Ej: Fiat", name: "brand" },
  { label: "Modelo", placeholder: "Ej: Cronos", name: "model" },
  { label: "Año", placeholder: "Ej: 2025", name: "manufacture_year" },
  {
    label: "Peso del auto",
    options: [
      { value: "liviano", label: "Liviano" },
      { value: "pesado", label: "Pesado" },
    ],
    name: "weight",
  },
  {
    label: "Tipo de combustible",
    options: [
      { value: "nafta", label: "Nafta" },
      { value: "diesel", label: "Diésel" },
      { value: "electrico", label: "Eléctrico" },
    ],
    name: "fuel_type",
  },
  {
    label: "Tipo de vehículo",
    options: [
      { value: "auto", label: "Auto" },
      { value: "camioneta", label: "Camioneta" },
      { value: "moto", label: "Moto" },
    ],
    name: "vehicle_type",
  },
  {
    label: "Tipo de uso",
    options: [
      { value: "particular", label: "Particular" },
      { value: "comercial", label: "Comercial" },
    ],
    name: "usage_type",
  },
  { label: "Marca de motor", placeholder: "Ej: Toyota", name: "engine_brand" },
  { label: "Número de motor", placeholder: "Ej: B91099432213123", name: "engine_number" },


]
const formData2 = [
  { label: "Número de chasis", placeholder: "Ej: 1231415251251451", name: "chassis_number" },
  { label: "Marca de chasis", placeholder: "Ej: MARCA", name: "chassis_brand" },
  { label: "Número de cédula verde", placeholder: "Ej: 122144351", name: "green_card_number: string;" },
  { label: "Vencimiento de la cédula", type: "date", placeholder: "dd/mm/aa", name: "green_card_start" },
  { label: "Número de licencia de conducir", placeholder: "Ej: 14214545", name: "license_number" },
  { label: "Vencimiento de la licencia", type: "date", placeholder: "dd/mm/aa", name: "license_expiration" },
  {
    label: "Seleccione la oblea a vincular",
    options: [
      { value: "oblea-1", label: "Oblea 1" },
      { value: "oblea-2", label: "Oblea 2" },
    ],
    className: "col-span-2",
    name: "oblea_vincular",
  }
]

export default function VehicleForm() {
  return (
    <div className="space-y-6 mb-10 px-4 mt-12">
      <div>
        <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
        <p className="text-md font-regular text-[#00000080] mb-10">Ingrese los datos del vehículo</p>
      </div>

      <div className="grid grid-cols-[1fr_1px_1fr] max-xl:grid-cols-1 gap-10     ">
        {/* Columna izquierda */}
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8 grid-rows-[repeat(5,minmax(0,1fr))]">
          {formData1.map((field, index) =>
            field.options ? (
              <FormField
                key={index}
                label={field.label}
                type="select"
                options={field.options}
                name={field.name} // Use the name for form submission
              />
            ) : (
              <FormField
                key={index}
                label={field.label}
                placeholder={field.placeholder ?? ""}
                type={"text"}
                name={field.name} // Use the name for form submission
              />
            )
          )}

        </div>

        {/* Separador */}
        <div className="bg-[#dedede] w-px h-full max-xl:hidden" />

        {/* Columna derecha */}
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8 grid-rows-[repeat(5,minmax(0,1fr))]">
          {formData2.map((field, index) =>
            field.options ? (
              <FormField
                key={index}
                label={field.label}
                type="select"
                options={field.options}
                name={field.name} // Use the name for form submission
              />
            ) : (
              <FormField
                key={index}
                label={field.label}
                placeholder={field.placeholder ?? ""}
                type={"text"}
                name={field.name} // Use the name for form submission
              />
            )
          )}
          
          <div />
        </div>
      </div>
    </div>
  );
}
