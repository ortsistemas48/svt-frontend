'use client';

import FormField from "@/components/PersonFormField";
import React, { useMemo, useState } from "react";

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

type Mode = 'idle' | 'view' | 'edit';

export default function VehicleForm({ car, setCar }: VehicleFormProps) {
  const [plateQuery, setPlateQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('idle'); // 👈 control del flujo

  // Si ya vino un car con patente pre-cargada, mostramos formulario (view por defecto)
  useMemo(() => {
    if (car?.license_plate && mode === 'idle') {
      setMode('view');
    }
  }, [car?.license_plate, mode]);

  const isReadOnly = mode === 'view';

  const handleChange = (key: string, value: string) => {
    setCar((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fetchVehicleByPlate = async () => {
    const plate = plateQuery.trim().toUpperCase();
    if (!plate) {
      setSearchError("Ingresá una patente válida.");
      return;
    }
    try {
      setIsSearching(true);
      setSearchError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/get-vehicle-data/${encodeURIComponent(plate)}`,
        { credentials: "include" }
      );

      if (res.status === 404) {
        // No existe → pasamos a modo edición y prellenamos solo la patente
        setCar((prev: any) => ({ ...prev, license_plate: plate }));
        setMode('edit');
        return;
      }
      if (!res.ok) {
        setSearchError("Ocurrió un error al buscar el vehículo.");
        return;
      }

      const data = await res.json();
      setCar((prev: any) => ({ ...prev, ...data }));
      setMode('view'); // encontrado → solo lectura
    } catch (e) {
      console.error(e);
      setSearchError("Ocurrió un error de red.");
    } finally {
      setIsSearching(false);
    }
  };

  // 🔹 Paso previo: búsqueda por patente
  if (mode === 'idle') {
    return (
      <div className="space-y-6 mb-10 px-4 mt-12">
        <div>
          <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
          <p className="text-md font-regular text-[#00000080] mb-6">
            Ingresá la patente para traer los datos del vehículo
          </p>
        </div>

        <div className="max-w-md">
          <label htmlFor="plate" className="block text-sm text-gray-700 mb-1">
            Patente
          </label>
          <div className="flex gap-2">
            <input
              id="plate"
              type="text"
              placeholder="Ej: AB123CD"
              className="flex-1 border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8] uppercase"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchVehicleByPlate();
                }
              }}
              disabled={isSearching}
            />
            <button
              type="button"
              onClick={fetchVehicleByPlate}
              disabled={isSearching}
              className={`px-5 rounded-[4px] text-white bg-[#0040B8] hover:bg-[#0038a6] transition ${
                isSearching ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {searchError && <p className="text-sm text-red-600 mt-3">{searchError}</p>}
          <p className="text-xs text-gray-500 mt-2">
            Si no se encuentra, podrás cargar los datos manualmente.
          </p>
        </div>
      </div>
    );
  }

  // 🔹 Formulario (modo view = solo lectura, modo edit = editable)
  return (
    <div className="space-y-6 mb-10 px-4 mt-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
          {isReadOnly ? (
            <p className="text-sm text-[#00000080]">
              Vehículo encontrado. Los campos están bloqueados (solo lectura).
            </p>
          ) : (
            <p className="text-sm text-[#00000080]">
              Vehículo no registrado. Completá los datos para guardarlo.
            </p>
          )}
        </div>

        <button
          type="button"
          className="text-[#0040B8] border border-[#0040B8] rounded-[4px] px-3 py-2 text-sm hover:bg-[#0040B8] hover:text-white transition shrink-0"
          onClick={() => {
            // Volver al buscador, conservando lo tipeado por si quiere reusar
             setSearchError(null);
              setMode('idle');
              setPlateQuery('');        // ← limpia el input
              setCar({}); 
          }}
        >
          Buscar otra patente
        </button>
      </div>

      {/* fieldset deshabilita inputs si está en modo lectura */}
      <fieldset disabled={isReadOnly} className={isReadOnly ? "opacity-95" : ""}>
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
      </fieldset>
    </div>
  );
}
