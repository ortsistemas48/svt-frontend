"use client";

import FormField from "@/components/PersonFormField";
import { useApplication } from "@/context/ApplicationContext";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { alnumSpaceUpper, clamp, lettersSpaceUpper, onlyAlnumUpper, onlyDigits, toUpper } from "../../utils";
import { useParams } from "next/navigation";

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
  {
    label: "Peso total (KG)",
    placeholder: "Ej: 2000 KG",
    name: "total_weight",
  },
  {
    label: "Peso eje delantero (KG)",
    placeholder: "Ej: 1000 KG",
    name: "front_weight",
  },
  {
    label: "Peso eje trasero (KG)",
    placeholder: "Ej: 1000 KG",
    name: "back_weight",
  },
  {
    label: "Tipo de combustible",
    options: [
      { value: "nafta", label: "Nafta" },
      { value: "diesel", label: "Diésel" },
      { value: "electrico", label: "Eléctrico" },
      { value: "gnc", label: "GNC" },
      { value: "hibrido", label: "Híbrido" },
    ],
    name: "fuel_type",
  },
  {
    label: "Tipo de vehículo",
    options: [
      { value: "L", label: "L - Vehículo automotor con menos de CUATRO (4) ruedas" },
      { value: "L1", label: "L1 - 2 Ruedas - Menos de 50 CM3 - Menos de 40 KM/H" },
      { value: "L2", label: "L2 - 3 Ruedas - Menos de 50 CM3 - Menos de 40 KM/H" },
      { value: "L3", label: "L3 - 2 Ruedas - Más de 50 CM3 - Más de 40 KM/H" },
      { value: "L4", label: "L4 - 3 Ruedas - Más de 50 CM3 - Más de 40 KM/H" },
      { value: "L5", label: "L5 - 3 Ruedas - Más de 50 CM3 - Más de 40 KM/H" },

      { value: "M", label: "M - Vehículo automotor con por lo menos 4 ruedas (o 3 de más de 1.000 KG)" },
      { value: "M1", label: "M1 - Hasta 8 plazas más conductor y menos de 3.500 KG" },
      { value: "M2", label: "M2 - Más de 8 plazas excluido conductor y hasta 5.000 KG" },
      { value: "M3", label: "M3 - Más de 8 plazas excluido conductor y más de 5.000 KG" },

      { value: "N", label: "N - Vehículo automotor con por lo menos 4 ruedas (o 3 de más de 1.000 KG)" },
      { value: "N1", label: "N1 - Hasta 3.500 KG" },
      { value: "N2", label: "N2 - Desde 3.500 KG hasta 12.000 KG" },
      { value: "N3", label: "N3 - Más de 12.000 KG" },

      { value: "O", label: "O - Acoplados y semirremolques" },
      { value: "O1", label: "O1 - Acoplados/semirremolques hasta 750 KG" },
      { value: "O2", label: "O2 - Acoplados/semirremolques desde 750 KG hasta 3.500 KG" },
      { value: "O3", label: "O3 - Acoplados/semirremolques de más de 3.500 KG y hasta 10.000 KG" },
      { value: "O4", label: "O4 - Acoplados/semirremolques de más de 10.000 KG" },
    ],
    name: "vehicle_type",
  },
  {
    label: "Tipo de uso",
    options: [

      { value: "A", label: "A - Oficial" },
      { value: "B", label: "B - Diplomático, Consular u Org. Internacional" },
      { value: "C", label: "C - Particular" },
      { value: "D", label: "D - De alquiler / alquiler con chofer (Taxi - Remis)" },
      { value: "E", label: "E - Transporte público de pasajeros" },
      { value: "E1", label: "E1 - Servicio internacional (regular y turismo); larga distancia y urbanos cat. M1, M2, M3" },
      { value: "E2", label: "E2 - Interjurisdiccional y jurisdiccional; regulares/turismo cat. M1, M2, M3" },
      { value: "F", label: "F - Transporte escolar" },
      { value: "G", label: "G - Cargas (generales/peligrosas), recolección, carretones, servicios industriales y trabajos sobre la vía pública" },
      { value: "H", label: "H - Emergencia, seguridad, fúnebres, remolque, maquinaria especial o agrícola y trabajos sobre la vía pública" },
    ],
    name: "usage_type",
  },
];

const formData2: FormFieldData[] = [
  { label: "Marca de motor", placeholder: "Ej: Toyota", name: "engine_brand" },
  { label: "Número de motor", placeholder: "Ej: B91099432213123", name: "engine_number" },
  { label: "Marca de chasis", placeholder: "Ej: MARCA", name: "chassis_brand" },
  { label: "Número de chasis", placeholder: "Ej: 1231415251251451", name: "chassis_number" },
  { label: "Nº de cédula verde", placeholder: "Ej: ABF45658", name: "green_card_number" },
  { label: "Exp. de la cédula", type: "date", placeholder: "dd/mm/aa", name: "green_card_expiration" },
  { label: "Nº de licencia", placeholder: "Ej: A123456789", name: "license_number" },
  {
    label: "Clase de licencia",
    name: "license_class",
    type: "select",
    options: [
      { value: "A", label: "A - Motocicletas" },
      { value: "A1", label: "A1 - Motocicletas pequeñas" },
      { value: "A2", label: "A2 - Motocicletas medianas" },
      { value: "B1", label: "B1 - Automóviles particulares" },
      { value: "B2", label: "B2 - Automóviles con remolque" },
      { value: "C", label: "C - Camiones sin acoplado" },
      { value: "D1", label: "D1 - Transporte de pasajeros hasta 8" },
      { value: "D2", label: "D2 - Transporte de pasajeros más de 8" },
      { value: "E1", label: "E1 - Camiones con acoplado" },
      { value: "E2", label: "E2 - Maquinaria especial no agrícola" },
      { value: "F", label: "F - Vehículos para personas con discapacidad" },
    ],
  },
  { label: "Exp. de la licencia", type: "date", placeholder: "dd/mm/aa", name: "license_expiration" },
  { label: "Póliza del seguro", type: "text", placeholder: "Ej: 1234567890", name: "insurance" },
];

type Mode = "idle" | "view" | "edit";

// Mensajes por campo
const MSG = {
  brand: "Letras y números (máx. 15).",
  model: "Campo requerido.",
  manufacture_year: "Debe tener 4 dígitos (ej: 2025).",
  registration_year: "Debe tener 4 dígitos (ej: 2025).",
  engine_brand: "Letras y números (máx. 15).",
  engine_number: "Letras y números (máx. 17).",
  chassis_number: "Letras y números (máx. 17).",
  chassis_brand: "Solo letras (máx. 15).",
  green_card_number: "Campo requerido.",
  license_number: "Letras y números (máx. 15).",
  insurance: "Solo números (hasta 10).",
  total_weight: "Solo números (hasta 10).",
  front_weight: "Solo números (hasta 10).",
  back_weight: "Solo números (hasta 10).",
};

// Patrones por campo
const PATTERN: Record<string, RegExp> = {
  brand: /^[A-Z0-9 ]{1,15}$/,
  model: /^.+$/,
  manufacture_year: /^\d{4}$/,
  registration_year: /^\d{4}$/,
  engine_brand: /^[A-Z0-9 ]{1,15}$/,
  engine_number: /^[A-Z0-9]{1,17}$/,
  chassis_number: /^[A-Z0-9]{1,17}$/,
  chassis_brand: /^[A-ZÁÉÍÓÚÑÜ ]{1,15}$/,
  green_card_number: /^.+$/,
  green_card_expiration: /^\d{4}-\d{2}-\d{2}$/,
  license_number: /^[A-Z0-9]{1,15}$/,
  license_expiration: /^\d{4}-\d{2}-\d{2}$/,
  insurance: /^\d{1,10}$/,
  total_weight: /^\d{1,10}$/,
  front_weight: /^\d{1,10}$/,
  back_weight: /^\d{1,10}$/,
};

// Sanitizado por campo
const SANITIZE: Record<string, (s: string) => string> = {
  license_plate: (s) => clamp(toUpper(s).replace(/[-\s]/g, ""), 10),
  brand: (s) => clamp(alnumSpaceUpper(s), 15),
  model: (s) => s,
  manufacture_year: (s) => clamp(onlyDigits(s), 4),
  registration_year: (s) => clamp(onlyDigits(s), 4),
  engine_brand: (s) => clamp(alnumSpaceUpper(s), 15),
  engine_number: (s) => clamp(onlyAlnumUpper(s), 17),
  chassis_number: (s) => clamp(onlyAlnumUpper(s), 17),
  chassis_brand: (s) => clamp(lettersSpaceUpper(s), 15),
  green_card_number: (s) => s,
  license_number: (s) => clamp(onlyAlnumUpper(s), 15),
  insurance: (s) => clamp(onlyDigits(s), 10),
};

// Etiquetas para el resumen de errores
const FIELD_LABEL: Record<string, string> = {
  license_plate: "Dominio",
  brand: "Marca",
  model: "Modelo",
  manufacture_year: "Fabricación",
  registration_year: "Patentamiento",
  weight: "Peso del auto",
  fuel_type: "Tipo de combustible",
  vehicle_type: "Tipo de vehículo",
  usage_type: "Tipo de uso",
  engine_brand: "Marca de motor",
  engine_number: "Número de motor",
  chassis_number: "Número de chasis",
  chassis_brand: "Marca de chasis",
  green_card_number: "Nº de cédula verde",
  green_card_expiration: "Exp. de la cédula",
  license_number: "Nº de licencia",
  license_class: "Clase de licencia",
  license_expiration: "Exp. de la licencia",
  insurance: "Póliza del seguro",
};

// Formatos de dominio válidos
const PLATE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export default function VehicleForm({ car, setCar }: VehicleFormProps) {
  const { setIsIdle, errors, setErrors } = useApplication() as any;

  const [plateQuery, setPlateQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  const [greenCardNoExpiration, setGreenCardNoExpiration] = useState(() => {
    return !car?.green_card_expiration || car?.green_card_expiration === "" || car?.green_card_no_expiration === true;
  });

  const fetchRef = useRef<{ id: number; ctrl?: AbortController }>({ id: 0 });
  
  const setCarError = (name: string, msg: string) =>
    setErrors((prev: any) => ({ ...(prev || {}), [`car_${name}`]: msg }));

  const getCarError = (name: string) => (errors ? errors[`car_${name}`] : "");

  const validateOne = (name: string, raw: string) => {
    const v = String(raw ?? "");
    const p = PATTERN[name];
    if (!p) return setCarError(name, "");
    if (!v) return setCarError(name, "");
    
    if (name === "green_card_expiration" || name === "license_expiration") {
      if (name === "green_card_expiration" && greenCardNoExpiration) {
        setCarError(name, "");
        return;
      }
      const date = new Date(v);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(date.getTime())) {
        setCarError(name, "Fecha inválida.");
        return;
      }
      if (date < today) {
        setCarError(name, "La fecha no puede ser anterior a hoy.");
        return;
      }
      setCarError(name, "");
      return;
    }

    // Special validation for weight fields
    if (name === "total_weight" || name === "front_weight" || name === "back_weight") {
      const totalWeight = Number(car?.total_weight || 0);
      const frontWeight = Number(car?.front_weight || 0);
      const backWeight = Number(car?.back_weight || 0);
      
        // Only validate if all three weights have values
        if (totalWeight > 0 && frontWeight > 0 && backWeight > 0) {
          const sum = frontWeight + backWeight;
            if (sum !== totalWeight) {
              // Set error for all three weight fields using correct field names
              setCarError("Peso Total", "El peso total debe ser igual a la suma del peso delantero y trasero.");
              
              return;
            }
          }
          
          // Clear weight errors if validation passes
          setCarError("Peso Total", "");
          
    }

    setCarError(name, p.test(v) ? "" : MSG[name as keyof typeof MSG]);
  };

  const sanitizeAndMaybeError = (name: string, raw: string) => {
    const san = SANITIZE[name] ? SANITIZE[name](raw) : raw;
    setCar((prev: any) => ({
      ...prev,
      [name]: san,
    }));
    validateOne(name, san);
  };

  useEffect(() => {
    if (car?.license_plate && mode === "idle") setMode("edit");
  }, [car?.license_plate, mode]);

  const handleChange = (key: string, value: string) => {
    sanitizeAndMaybeError(key, value);
  };

  const handleBlur = (key: string) => {
    const val = car?.[key] ?? "";
    validateOne(key, String(val));
  };

  const handleGreenCardNoExpirationChange = (checked: boolean) => {
    setGreenCardNoExpiration(checked);
    if (checked) {
      setCar((prev: any) => ({ ...prev, green_card_expiration: "", green_card_no_expiration: true }));
      setCarError("green_card_expiration", "");
    }
    if (!checked) {
      setCar((prev: any) => ({ ...prev, green_card_no_expiration: false }));
    }
  };

  useEffect(() => {
    setIsIdle(mode === "idle");
  }, [mode, setIsIdle]);

  useEffect(() => {
    if (!car?.green_card_expiration || car?.green_card_expiration === "" || car?.green_card_no_expiration === true) {
      setGreenCardNoExpiration(true);
    } else {
      setGreenCardNoExpiration(false);
    }
  }, [car?.green_card_expiration, car?.green_card_no_expiration]);

  // Buscar por dominio
  const fetchVehicleByPlate = async () => {
    const plate = plateQuery.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!plate) {
      setSearchError("Ingresá un dominio válido.");
      return;
    }
    if (!PLATE_REGEX.test(plate)) {
      const msg = "Formato de dominio inválido. Usá ABC123 o AB123CD.";
      setCarError("license_plate", msg); setSearchError(msg); return;
    }

    if (fetchRef.current.ctrl) fetchRef.current.ctrl.abort();

    const id = ++fetchRef.current.id;
    const ctrl = new AbortController();
    fetchRef.current.ctrl = ctrl;

    try {
      setIsSearching(true);
      setSearchError(null);

      const res = await fetch(
        `/api/vehicles/get-vehicle-data/${encodeURIComponent(plate)}`,
        { credentials: "include", signal: ctrl.signal }
      );

      if (id !== fetchRef.current.id) return;

      if (res.status === 404) {
        setCar((prev: any) => ({ ...prev, license_plate: plate }));
        setMode("edit");
        setErrors((prev: any) => {
          if (!prev) return prev;
          const next: any = {};
          for (const k of Object.keys(prev)) if (!k.startsWith("car_")) next[k] = prev[k];
          return next;
        });
        return;
      }

      if (!res.ok) {
        setSearchError("Ocurrió un error al buscar el vehículo.");
        return;
      }

      const data = await res.json();
      setCar((prev: any) => ({ ...prev, ...data }));
      setMode("edit");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        setSearchError("Ocurrió un error de red.");
      }
    } finally {
      if (id === fetchRef.current.id) setIsSearching(false);
    }
  };

  // Validación en vivo de dominio
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toUpperCase().replace(/[-\s]/g, "");
    setPlateQuery(sanitized);

    if (!sanitized) {
      setCarError("license_plate", "");
      setSearchError(null);
      return;
    }

    if (!PLATE_REGEX.test(sanitized)) {
      setCarError("license_plate", "Formato de dominio inválido, usá ABC123 o AB123CD.");
    } else {
      setCarError("license_plate", "");
    }
  };

  const carErrorsList = useMemo(() => {
    const entries = Object.entries(errors ?? {}).filter(
      ([k, v]) => k.startsWith("car_") && Boolean(v)
    ) as [string, string][];
    return entries.map(([k, msg]) => {
      const field = k.replace(/^car_/, "");
      return { field, label: FIELD_LABEL[field] ?? field, msg };
    });
  }, [errors]);

  if (mode === "idle") {
    const plateErr = errors?.car_license_plate;
    const disableSearch = isSearching || Boolean(plateErr);

    return (
      <div className="min-h-full flex items-center justify-center px-6">
        <div className="space-y-6 mb-10 px-8 py-6 mt-12 w-full max-w-2xl bg-white rounded-lg">
          <div>
            <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
            <p className="text-md font-regular text-[#00000080]">
              Ingresá el dominio para traer los datos del vehículo
            </p>
          </div>

          <div className="w-full">
            <label htmlFor="plate" className="block text-sm text-gray-700 mb-1">
              Dominio
            </label>
            <div className="flex gap-3">
              <input
                id="plate"
                type="text"
                placeholder="Ej: ABC123 o AB123CD"
                className={`flex-1 border rounded-[10px] px-4 py-3 text-base focus:outline-none focus:ring-2 uppercase ${
                  plateErr ? "border-red-400 focus:ring-red-500" : "border-[#DEDEDE] focus:ring-[#0040B8]"
                }`}
                value={plateQuery}
                onChange={handlePlateChange}
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
                disabled={disableSearch}
                className={`px-6 rounded-[6px] text-white bg-[#0040B8] hover:bg-[#0038a6] transition ${
                  disableSearch ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {plateErr && <p className="text-sm text-red-600 mt-3">{plateErr}</p>}
            {!plateErr && searchError && <p className="text-sm text-red-600 mt-3">{searchError}</p>}

            <p className="text-xs text-gray-500 mt-2">
              Si no se encuentra, vas a poder cargar los datos manualmente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-10 px-4 mt-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
          <p className="text-sm text-[#00000080]">Completá los datos del vehículo.</p>
        </div>

        <button
          type="button"
          className="text-[#0040B8] border border-[#0040B8] rounded-[4px] px-3 py-2 text-sm hover:bg-[#0040B8] hover:text-white transition shrink-0"
          onClick={() => {
            setSearchError(null);
            setMode("idle");
            setIsIdle(true);
            setPlateQuery("");
            setCar({});
          }}
        >
          Buscar otro dominio
        </button>
      </div>

      {carErrorsList.length > 0 && (
        <div className="border border-red-300 bg-red-50 text-red-700 text-sm rounded-md px-4 py-3">
          <p className="font-medium mb-1">Revisá estos campos:</p>
          <ul className="list-disc pl-5 space-y-1">
            {carErrorsList.map(({ field, label, msg }) => (
              <li key={field}>
                <span className="font-medium">{label}:</span> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <div className="grid grid-cols-[1fr_1px_1fr] max-xl:grid-cols-1 gap-10 items-start">
          {/* Columna izquierda */}
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8 self-start">
            {formData1.map((field, index) => {
              // Render especial: una fila con 3 campos, Modelo + Fabricación + Patentamiento
              if (field.name === "model") {
                return (
                  <div key={index} className="col-span-2">
                    <div className="grid grid-cols-4 max-md:grid-cols-1 gap-x-6 gap-y-8">
                      {/* Modelo: 50% (2 de 4 columnas) */}
                      <div className="col-span-2 max-md:col-span-1">
                        <FormField
                          label={field.label}
                          placeholder={field.placeholder ?? ""}
                          type={field.type ?? "text"}
                          name={field.name}
                          isOwner={true}
                          value={car?.[field.name] ?? ""}
                          onChange={(val) => handleChange(field.name, val)}
                          onBlur={() => handleBlur(field.name)}
                          error={getCarError(field.name)}
                        />
                      </div>

                      {/* Año de fabricación: 25% */}
                      <div className="col-span-1 max-md:col-span-1">
                        <FormField
                          label="Fabricación"
                          placeholder="Ej: 2025"
                          type="text"
                          name="manufacture_year"
                          isOwner={true}
                          value={car?.manufacture_year ?? ""}
                          onChange={(val) => handleChange("manufacture_year", val)}
                          onBlur={() => handleBlur("manufacture_year")}
                          error={getCarError("manufacture_year")}
                        />
                      </div>

                      {/* Año de patentamiento: 25% */}
                      <div className="col-span-1 max-md:col-span-1">
                        <FormField
                          label="Patentamiento"
                          placeholder="Ej: 2025"
                          type="text"
                          name="registration_year"
                          isOwner={true}
                          value={car?.registration_year ?? ""}
                          onChange={(val) => handleChange("registration_year", val)}
                          onBlur={() => handleBlur("registration_year")}
                          error={getCarError("registration_year")}
                        />
                      </div>
                    </div>
                  </div>
                );
              }


              // Render normal para el resto
              return field.options ? (
                <FormField
                  key={index}
                  label={field.label}
                  type="select"
                  options={field.options}
                  name={field.name}
                  isOwner={true}
                  value={car?.[field.name] ?? ""}
                  onChange={(val) => handleChange(field.name, val)}
                  onBlur={() => handleBlur(field.name)}
                  error={getCarError(field.name)}
                  disabled={false}
                  className={field.className}
                />
              ) : (
                <FormField
                  key={index}
                  label={field.label}
                  placeholder={field.placeholder ?? ""}
                  type={field.type ?? "text"}
                  name={field.name}
                  isOwner={true}
                  value={car?.[field.name] ?? ""}
                  onChange={(val) => handleChange(field.name, val)}
                  onBlur={() => handleBlur(field.name)}
                  error={getCarError(field.name)}
                  disabled={false}
                  className={field.className}
                />
              );
            })}
          </div>


          {/* Separador */}
          <div className="bg-[#dedede] w-px h-full max-xl:hidden" />

          {/* Columna derecha */}
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8">
            {formData2.map((field, index) => {
              const commonProps = {
                label: field.label,
                name: field.name,
                isOwner: true,
                value:
                  field.type === "date" && car?.[field.name]
                    ? new Date(car[field.name]).toISOString().slice(0, 10)
                    : car?.[field.name] ?? "",
                onChange: (val: string) => handleChange(field.name, val),
                onBlur: () => handleBlur(field.name),
                error: getCarError(field.name),
                disabled: field.name === "green_card_expiration" ? greenCardNoExpiration : false,
                className: field.className,
              } as const;

              if (field.name === "green_card_expiration") {
                return (
                  <FormField
                    key={index}
                    {...commonProps}
                    placeholder={field.placeholder ?? ""}
                    type={field.type ?? "text"}
                    innerCheckboxLabel="Sin limite"
                    innerCheckboxChecked={greenCardNoExpiration}
                    onInnerCheckboxChange={handleGreenCardNoExpirationChange}
                  />
                );
              }

              if (field.options) {
                return (
                  <FormField key={index} {...commonProps} type="select" options={field.options} />
                );
              }

              return (
                <FormField
                  key={index}
                  {...commonProps}
                  placeholder={field.placeholder ?? ""}
                  type={field.type ?? "text"}
                />
              );
            })}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
