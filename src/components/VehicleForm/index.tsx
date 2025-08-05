'use client';

import FormField from "@/components/PersonFormField";
import React from "react";

interface FormFieldData {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  options?: { value: string; label: string }[];
  className?: string;
}

interface VehicleFormProps {
  car: any;
  setCar: (car: any) => void;
}

const formData1: FormFieldData[] = [
  { label: "Dominio", placeholder: "Ej: AB123AB", name: "license_plate" },
  { label: "Marca", placeholder: "Ej: Fiat", name: "brand" },
  { label: "Modelo", placeholder: "Ej: Cronos", name: "model" },
  { label: "Año", placeholder: "Ej: 2025", name: "manufacture_year", type: "text" },
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
];

const formData2: FormFieldData[] = [
  { label: "Número de chasis", placeholder: "Ej: 1231415251251451", name: "chassis_number" },
  { label: "Marca de chasis", placeholder: "Ej: MARCA", name: "chassis_brand" },
  { label: "Nº de cédula verde", placeholder: "Ej: 122144351", name: "green_card_number" },
  { label: "Exp. de la cédula", type: "date", placeholder: "dd/mm/aa", name: "green_card_expiration" },
  { label: "Nº de licencia", placeholder: "Ej: 14214545", name: "license_number" },
  { label: "Exp. de la licencia", type: "date", placeholder: "dd/mm/aa", name: "license_expiration" },
  {
    label: "Vincular oblea",
    options: [
      { value: "oblea-1", label: "Oblea 1" },
      { value: "oblea-2", label: "Oblea 2" },
    ],
    className: "col-span-2",
    name: "oblea_vincular",
  },
];

export default function VehicleForm({ car, setCar }: VehicleFormProps) {
  const handleChange = (key: string, value: string) => {
    setCar((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6 mb-10 px-4 mt-12">
      <div>
        <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
        <p className="text-md font-regular text-[#00000080] mb-10">Ingrese los datos del vehículo</p>
      </div>

      <div className="grid grid-cols-[1fr_1px_1fr] max-xl:grid-cols-1 gap-10 items-start">
        {/* Columna izquierda */}
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8 self-start">
          {formData1.map((field, index) =>
            field.options ? (
              <FormField
                key={index}
                label={field.label}
                type="select"
                options={field.options}
                name={field.name}
                isOwner={true}
                value={
                  field.type === "date" && car?.[field.name]
                    ? new Date(car[field.name]).toISOString().slice(0, 10)
                    : car?.[field.name] ?? ""
                }
                onChange={(val) => handleChange(field.name, val)}
              />
            ) : (
              <FormField
                key={index}
                label={field.label}
                placeholder={field.placeholder ?? ""}
                type={field.type ?? "text"}
                name={field.name}
                isOwner={true}
                value={
                  field.type === "date" && car?.[field.name]
                    ? new Date(car[field.name]).toISOString().slice(0, 10)
                    : car?.[field.name] ?? ""
                }
                onChange={(val) => handleChange(field.name, val)}
              />
            )
          )}
        </div>

        {/* Separador */}
        <div className="bg-[#dedede] w-px h-full max-xl:hidden" />

        {/* Columna derecha */}
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8">
          {formData2.map((field, index) =>
            field.options ? (
              <FormField
                key={index}
                label={field.label}
                type="select"
                options={field.options}
                name={field.name}
                isOwner={true}
                value={
                  field.type === "date" && car?.[field.name]
                    ? new Date(car[field.name]).toISOString().slice(0, 10)
                    : car?.[field.name] ?? ""
                }
                onChange={(val) => handleChange(field.name, val)}
              />
            ) : (
              <FormField
                key={index}
                label={field.label}
                placeholder={field.placeholder ?? ""}
                type={field.type ?? "text"}
                name={field.name}
                isOwner={true}
                value={
                  field.type === "date" && car?.[field.name]
                    ? new Date(car[field.name]).toISOString().slice(0, 10)
                    : car?.[field.name] ?? ""
                }
                onChange={(val) => handleChange(field.name, val)}
              />
            )
          )}
          <div />
        </div>
      </div>
    </div>
  );
}
