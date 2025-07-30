// app/Form.tsx

import FormField from "@/components/FormField";
import React from "react";


export default function VehicleForm() {
  return (
    <div className="space-y-6 mb-10">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Datos del vehículo</h2>
      </div>

      <div className="">
        {/* Columna izquierda */}
        <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-y-8 gap-x-10  ">
          <FormField label="Dominio" placeholder="Ej: AB123AB" />
          <FormField label= "Marca" placeholder="Ej: Fiat" />

          <FormField label="Modelo" placeholder="Ej: Cronos" />
          <FormField label="Año" placeholder="Ej: 2025" />

          <FormField
            label="Peso del auto"
            options={[
              { value: "liviano", label: "Liviano" },
              { value: "pesado", label: "Pesado" },
            ]}
          />
          <FormField
            label="Tipo de combustible"
            options={[
              { value: "nafta", label: "Nafta" },
              { value: "diesel", label: "Diésel" },
              { value: "electrico", label: "Eléctrico" },
            ]}
          />

          <FormField
            label="Tipo de vehículo"
            options={[
              { value: "auto", label: "Auto" },
              { value: "camioneta", label: "Camioneta" },
              { value: "moto", label: "Moto" },
            ]}
          />
          <FormField
            label="Tipo de uso"
            options={[
              { value: "particular", label: "Particular" },
              { value: "comercial", label: "Comercial" },
            ]}
          />

          <FormField label="Número de motor" placeholder="Ej: B91099432213123" />
          <FormField label="Marca de motor" placeholder="Ej: Toyota" />
          <FormField label="Número de chasis" placeholder="Ej: 1231415251251451" />
          <FormField label="Marca de chasis" placeholder="Ej: MARCA" />

          <FormField label="Número de cédula verde" placeholder="Ej: 122144351" />
          <FormField label="Vencimiento de la cédula" type="date" placeholder="dd/mm/aa" />

          <FormField label="Número de licencia de conducir" placeholder="Ej: 14214545" />
          <FormField label="Vencimiento de la licencia" type="date" placeholder="dd/mm/aa" />

          <FormField
            label="Seleccione la oblea a vincular"
            options={[
              { value: "oblea-1", label: "Oblea 1" },
              { value: "oblea-2", label: "Oblea 2" },
            ]}
          />
          <div /> 
        </div>
      </div>
    </div>
  );
}
