"use client";

import FormField from "@/components/PersonFormField";
import { useApplication } from "@/context/ApplicationContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  alnumSpaceUpper,
  clamp,
  lettersSpaceUpper,
  onlyAlnumUpper,
  onlyDigits,
  toUpper,
} from "../../utils";
import VehicleDocsDropzone, { type ExistingDoc as CarExistingDoc } from "@/components/VehicleDocsDropzone";

interface FormFieldData {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  options?: { value: string; label: string }[];
  className?: string;
  isRequired?: boolean;
}

interface VehicleFormProps {
  car: any;
  setCar: (car: any) => void;
  onPendingCarDocsChange?: (files: File[]) => void;
  existingCarDocs?: CarExistingDoc[];
  onDeleteCarDoc?: (docId: number) => Promise<void> | void;
  onVehicleDocsCountChange?: (count: number) => void;
}

const toDateInputValue = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formData1: FormFieldData[] = [
  { label: "Dominio", placeholder: "Ej: AB123AB", name: "license_plate", isRequired: true },
  { label: "Marca", placeholder: "Ej: Fiat", name: "brand", isRequired: true },
  { label: "Modelo", placeholder: "Ej: Cronos", name: "model", isRequired: true },
  { label: "Peso total (KG)", placeholder: "Ej: 2000", name: "total_weight", isRequired: true },
  { label: "Peso eje delantero (KG)", placeholder: "Ej: 1000", name: "front_weight", isRequired: true },
  { label: "Peso eje trasero (KG)", placeholder: "Ej: 1000", name: "back_weight", isRequired: true },
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
    isRequired: true,
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
    isRequired: true,
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
    isRequired: true,
  },
];

const formData2: FormFieldData[] = [
  { label: "Marca de motor", placeholder: "Ej: Toyota", name: "engine_brand", isRequired: true },
  { label: "Número de motor", placeholder: "Ej: B91099432213123", name: "engine_number", isRequired: true },
  { label: "Marca de chasis", placeholder: "Ej: MARCA", name: "chassis_brand", isRequired: true },
  { label: "Número de chasis", placeholder: "Ej: 1231415251251451", name: "chassis_number", isRequired: true },
  { label: "Nº de cédula verde", placeholder: "Ej: ABF45658", name: "green_card_number", isRequired: true },
  { label: "Exp. de la cédula", type: "date", placeholder: "dd/mm/aa", name: "green_card_expiration", isRequired: true },
  { label: "Nº de licencia", placeholder: "Ej: A123456789", name: "license_number", isRequired: true },
  {
    label: "Clase de licencia",
    name: "license_class",
    type: "select",
    isRequired: false,
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
  { label: "Exp. de la licencia", type: "date", placeholder: "dd/mm/aa", name: "license_expiration", isRequired: true },
  { label: "Póliza del seguro", type: "text", placeholder: "Ej: 1234567890", name: "insurance" },
];

const MSG = {
  brand: "Letras y números, máx. 15.",
  model: "Campo requerido.",
  manufacture_year: "Debe tener 4 dígitos, ej: 2025.",
  registration_year: "Debe tener 4 dígitos, ej: 2025.",
  engine_brand: "Letras y números, máx. 15.",
  engine_number: "Cualquier símbolo, máx. 17.",
  chassis_number: "Cualquier símbolo, máx. 17.",
  chassis_brand: "Solo letras, máx. 15.",
  green_card_number: "Campo requerido.",
  license_number: "Letras y números, máx. 15.",
  insurance: "Solo números, hasta 10.",
  total_weight: "Solo números, hasta 10.",
  front_weight: "Solo números, hasta 10.",
  back_weight: "Solo números, hasta 10.",
};

const PATTERN: Record<string, RegExp> = {
  brand: /^[A-Z0-9 ]{1,15}$/,
  model: /^.+$/,
  manufacture_year: /^\d{4}$/,
  registration_year: /^\d{4}$/,
  engine_brand: /^[A-Z0-9 ]{1,15}$/,
  engine_number: /^.{1,17}$/,
  chassis_number: /^.{1,17}$/,
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

const SANITIZE: Record<string, (s: string) => string> = {
  license_plate: (s) => clamp(toUpper(s).replace(/[-\s]/g, ""), 10),
  brand: (s) => clamp(alnumSpaceUpper(s), 15),
  model: (s) => s,
  manufacture_year: (s) => clamp(onlyDigits(s), 4),
  registration_year: (s) => clamp(onlyDigits(s), 4),
  engine_brand: (s) => clamp(alnumSpaceUpper(s), 15),
  engine_number: (s) => clamp(s, 17),
  chassis_number: (s) => clamp(s, 17),
  chassis_brand: (s) => clamp(lettersSpaceUpper(s), 15),
  green_card_number: (s) => s,
  license_number: (s) => clamp(onlyAlnumUpper(s), 15),
  license_class: (s) => clamp(onlyAlnumUpper(s).trim(), 3), 
  insurance: (s) => clamp(onlyDigits(s), 10),
};

const FIELD_LABEL: Record<string, string> = {
  license_plate: "Dominio",
  brand: "Marca",
  model: "Modelo",
  manufacture_year: "Año de fabricación",
  registration_year: "Año de patentamiento",

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

/* --------- Componente --------- */
export default function VehicleForm({
  car,
  setCar,
  onPendingCarDocsChange,
  existingCarDocs = [],
  onDeleteCarDoc,
  onVehicleDocsCountChange,
}: VehicleFormProps) {
  const { setIsIdle, errors, setErrors } = useApplication() as any;

  const greenCardNoExpiration =
    car?.green_card_no_expiration === true ||
    (
      car?.green_card_no_expiration === undefined &&
      (!car?.green_card_expiration || car?.green_card_expiration === "")
    );

  const setCarError = (name: string, msg: string) =>
    setErrors((prev: any) => ({ ...(prev || {}), [`car_${name}`]: msg }));

  const getCarError = (name: string) => (errors ? errors[`car_${name}`] : "");

  const engineAuto = useRef<boolean>(!car?.engine_brand || String(car?.engine_brand).trim() === "");
  const chassisAuto = useRef<boolean>(!car?.chassis_brand || String(car?.chassis_brand).trim() === "");
  const didAutofill = useRef(false);
  const fetchedByPlateRef = useRef<string | null>(null);
  
  const [isTypingInBrand, setIsTypingInBrand] = useState(false);
  
  const [engineBrandManuallyEdited, setEngineBrandManuallyEdited] = useState(false);
  const [chassisBrandManuallyEdited, setChassisBrandManuallyEdited] = useState(false);

  const monthNameToNumber = (name: string) => {
    const m: Record<string, string> = {
      "enero": "01",
      "febrero": "02",
      "marzo": "03",
      "abril": "04",
      "mayo": "05",
      "junio": "06",
      "julio": "07",
      "agosto": "08",
      "septiembre": "09",
      "octubre": "10",
      "noviembre": "11",
      "diciembre": "12",
    };
    return m[String(name || "").toLowerCase()] ?? "";
  };
  const numberToMonthName = (num: string) => {
    const m: Record<string, string> = {
      "01": "enero",
      "02": "febrero",
      "03": "marzo",
      "04": "abril",
      "05": "mayo",
      "06": "junio",
      "07": "julio",
      "08": "agosto",
      "09": "septiembre",
      "10": "octubre",
      "11": "noviembre",
      "12": "diciembre",
    };
    return m[num] ?? "";
  };

  // helpers para mapear mes nombre <-> número

  useEffect(() => {
    if (didAutofill.current) return;
    const bRaw = String(car?.brand ?? "");
    const b = bRaw.trim();
    if (!b) return;

    setCar((prev: any) => {
      let changed = false;
      const next: any = { ...prev };

      if (!engineBrandManuallyEdited) {
        const v = SANITIZE.engine_brand ? SANITIZE.engine_brand(b) : b;
        if (prev.engine_brand !== v) {
          next.engine_brand = v;
          changed = true;
        }
      }
      if (!chassisBrandManuallyEdited) {
        const v = SANITIZE.chassis_brand ? SANITIZE.chassis_brand(b) : b;
        if (prev.chassis_brand !== v) {
          next.chassis_brand = v;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [car?.brand, engineBrandManuallyEdited, chassisBrandManuallyEdited, setCar]);

  const LICENSE_CLASS_VALUES = new Set(["A","A1","A2","B1","B2","C","D1","D2","E1","E2","F"]);

  useEffect(() => {
    const raw = car?.license_class ?? "";
    const norm = SANITIZE.license_class ? SANITIZE.license_class(String(raw)) : String(raw).trim().toUpperCase();
    if (!norm) return;

    if (LICENSE_CLASS_VALUES.has(norm)) {
      if (norm !== raw) {
        setCar((prev: any) => ({ ...prev, license_class: norm }));
      }
      return;
    }

    const m = norm.match(/^[A-Z]\d?/);
    const guess = m ? m[0] : "";
    const finalVal = LICENSE_CLASS_VALUES.has(guess) ? guess : "";

    if (finalVal !== raw) {
      setCar((prev: any) => ({ ...prev, license_class: finalVal }));
    }
  }, [car?.license_class, setCar]);

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
      const formatted = /^\d{4}-\d{2}-\d{2}$/.test(v);
      setCarError(name, formatted ? "" : "Fecha inválida, usa AAAA-MM-DD.");
      return;
    }

    if (name === "total_weight" || name === "front_weight" || name === "back_weight") {
      const total = Number(car?.total_weight);
      const front = Number(car?.front_weight);
      const back = Number(car?.back_weight);

      if ([total, front, back].every((n) => Number.isFinite(n) && n > 0)) {
        setCarError(
          "total_weight",
          front + back === total ? "" : "El peso total debe ser igual a la suma del peso delantero y trasero."
        );
      } else {
        setCarError("total_weight", "");
      }
      setCarError(name, p.test(v) ? "" : MSG[name as keyof typeof MSG]);
      return;
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

  const handleChange = (key: string, value: string) => {
    if (key === "license_class") {
      const v = SANITIZE.license_class ? SANITIZE.license_class(value) : String(value || "").trim().toUpperCase();
      setCar((prev: any) => ({ ...prev, license_class: v }));
      validateOne("license_class", v);
      return;
    }
    if (key === "brand" || key === "engine_brand" || key === "chassis_brand") {
      const soft = clamp(toUpper(value), 30);
      if (key === "engine_brand") {
        engineAuto.current = soft.trim() === "";
        setEngineBrandManuallyEdited(true);
      }
      if (key === "chassis_brand") {
        chassisAuto.current = soft.trim() === "";
        setChassisBrandManuallyEdited(true);
      }
      
      if (key === "brand") {
        setIsTypingInBrand(true);
        setCar((prev: any) => {
          const newCar = { ...prev, [key]: soft };

          if (engineAuto.current) {
            newCar.engine_brand = SANITIZE.engine_brand ? SANITIZE.engine_brand(soft) : soft;
          }
          if (chassisAuto.current) {
            newCar.chassis_brand = SANITIZE.chassis_brand ? SANITIZE.chassis_brand(soft) : soft;
          }

          return newCar;
        });
        return;
      }
      
      setCar((prev: any) => ({ ...prev, [key]: soft }));
      return;
    }
    if (key === "green_card_expiration" || key === "license_expiration") {
      const v = value ?? "";
      setCar((prev: any) => ({ ...prev, [key]: v }));
      validateOne(key, v);
      return;
    }
    sanitizeAndMaybeError(key, value);
  };

  const handleFocus = (key: string) => {
    if (key === "brand") {
      setIsTypingInBrand(true);
    }
  };

  const handleBlur = (key: string) => {
    const current = String(car?.[key] ?? "");
    const strict = SANITIZE[key] ? SANITIZE[key](current) : current;
    if (strict !== current) {
      setCar((prev: any) => ({ ...prev, [key]: strict }));
    }
    validateOne(key, strict);
    
    if (key === "brand") {
      setIsTypingInBrand(false);
    }
  };

  const handleGreenCardNoExpirationChange = (checked: boolean) => {
    setCar((prev: any) => ({
      ...prev,
      green_card_no_expiration: checked,
      green_card_expiration: checked ? "" : prev?.green_card_expiration ?? "",
    }));
    setCarError("green_card_expiration", "");
  };

  useEffect(() => {
    setIsIdle(false);
  }, [setIsIdle]);

  const carErrorsList = useMemo(() => {
    const entries = Object.entries(errors ?? {}).filter(
      ([k, v]) => k.startsWith("car_") && Boolean(v)
    ) as [string, string][];
    return entries.map(([k, msg]) => {
      const field = k.replace(/^car_/, "");
      return { field, label: FIELD_LABEL[field] ?? field, msg };
    });
  }, [errors]);

  return (
    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-10 px-1 sm:px-2 md:px-4 mt-4 sm:mt-8 md:mt-12">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
          <p className="text-xs sm:text-sm text-[#00000080]">Completá los datos del vehículo.</p>
        </div>
      </div>

      {carErrorsList.length > 0 && (
        <div className="border border-red-300 bg-red-50 text-red-700 text-xs sm:text-sm rounded-[4px] px-3 sm:px-4 py-2 sm:py-3">
          <p className="font-medium mb-1 text-sm sm:text-base">Revisá estos campos:</p>
          <ul className="list-disc pl-4 sm:pl-5 space-y-1">
            {carErrorsList.map(({ field, label, msg }) => (
              <li key={field}>
                <span className="font-medium">{label}:</span> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <div className="grid grid-cols-[1fr_1px_1fr] max-[1420px]:grid-cols-1 gap-6 sm:gap-8 md:gap-10 items-start">
          {/* Columna izquierda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6 md:gap-y-8 self-start">
            {formData1.map((field, index) => {
              if (field.name === "model") {
                return (
                  <div key={index} className="col-span-1 md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6 md:gap-y-8">
                      <div className="col-span-1 md:col-span-2">
                        <FormField
                          label={field.label}
                          placeholder={field.placeholder ?? ""}
                          type={field.type ?? "text"}
                          name={field.name}
                          isOwner={true}
                          value={car?.[field.name] ?? ""}
                          onChange={(val) => handleChange(field.name, val)}
                          onFocus={() => handleFocus(field.name)}
                          onBlur={() => handleBlur(field.name)}
                          error={getCarError(field.name)}
                          isRequired={field.isRequired}
                        />
                      </div>
                      <div className="col-span-1">
                        <FormField
                          label="Fabricación"
                          placeholder="Ej: 2025"
                          type="text"
                          name="manufacture_year"
                          isOwner={true}
                          value={car?.manufacture_year ?? ""}
                          onChange={(val) => handleChange("manufacture_year", val)}
                          onFocus={() => handleFocus("manufacture_year")}
                          onBlur={() => handleBlur("manufacture_year")}
                          error={getCarError("manufacture_year")}
                        />
                      </div>
                      <div className="col-span-1">
                        <FormField
                          label="Patentamiento"
                          placeholder="Ej: 2025"
                          type="text"
                          name="registration_year"
                          isOwner={true}
                          value={car?.registration_year ?? ""}
                          onChange={(val) => handleChange("registration_year", val)}
                          onFocus={() => handleFocus("registration_year")}
                          onBlur={() => handleBlur("registration_year")}
                          error={getCarError("registration_year")}
                          isRequired={true}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

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
                  isRequired={field.isRequired}
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
                  onFocus={() => handleFocus(field.name)}
                  onBlur={() => handleBlur(field.name)}
                  error={getCarError(field.name)}
                  disabled={false}
                  className={field.className}
                  isRequired={field.isRequired}
                />
              );
            })}
          </div>

          <div className="bg-[#dedede] w-full h-px md:w-px md:h-full max-xl:block max-xl:h-px hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6 md:gap-y-8">
            {formData2.map((field, index) => {
              const commonProps = {
                label: field.label,
                name: field.name,
                isOwner: true,
                value:
                  field.type === "date"
                    ? toDateInputValue(car?.[field.name])
                    : car?.[field.name] ?? "",
                onChange: (val: string) => handleChange(field.name, val),
                onFocus: () => handleFocus(field.name),
                onBlur: () => handleBlur(field.name),
                error: getCarError(field.name),
                disabled: field.name === "green_card_expiration" ? greenCardNoExpiration : false,
                className: field.className,
                isRequired: field.isRequired,
              } as const;

              if (field.name === "green_card_expiration") {
                return (
                  <FormField
                    key={index}
                    {...commonProps}
                    placeholder={field.placeholder ?? ""}
                    type={field.type ?? "text"}
                    innerCheckboxLabel="Sin vencimiento"
                    innerCheckboxChecked={greenCardNoExpiration}
                    onInnerCheckboxChange={handleGreenCardNoExpirationChange}
                  />
                );
              }

              if (field.options) {
                return <FormField key={index} {...commonProps} type="select" options={field.options} />;
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

      <div className="mt-6 sm:mt-8 md:mt-10">
          <VehicleDocsDropzone
            existing={existingCarDocs as CarExistingDoc[]}
            onDeleteExisting={onDeleteCarDoc}
            onPendingChange={(files: File[]) => onPendingCarDocsChange?.(files)}
            onDoneCountChange={onVehicleDocsCountChange}
            resetToken={car?.license_plate}
          />
      </div>
    </div>
  );
}
