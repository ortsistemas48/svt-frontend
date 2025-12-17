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
import { Car, Settings, FileText, Clipboard } from "lucide-react";

interface VehicleFormProps {
  car: any;
  setCar: (car: any) => void;
  onPendingCarDocsChange?: (files: File[]) => void;
  existingCarDocs?: CarExistingDoc[];
  onDeleteCarDoc?: (docId: number) => Promise<void> | void;
  onVehicleDocsCountChange?: (count: number) => void;
  ownerDni?: string;
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


const MSG = {
  brand: "Letras y números, máx. 15.",
  model: "Campo requerido.",
  manufacture_year: "Debe tener 4 dígitos, ej: 2025.",
  manufacture_year_future: "El año no puede ser mayor al año actual.",
  registration_year: "Debe tener 4 dígitos, ej: 2025.",
  registration_year_future: "El año no puede ser mayor al año actual.",
  engine_brand: "Letras y números, máx. 15.",
  engine_number: "Cualquier símbolo, máx. 17.",
  chassis_number: "Cualquier símbolo, máx. 17.",
  chassis_brand: "Solo letras, máx. 15.",
  green_card_number: "Campo requerido.",
  license_number: "Letras y números, máx. 15.",
  insurance: "Letras y números, hasta 30.",
  license_plate: "Formato inválido. Debe ser AAA111 o AB123AB.",
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
  insurance: /^[A-Z0-9]{1,30}$/,
  license_plate: /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/,
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
  insurance: (s) => clamp(onlyAlnumUpper(s), 30),
};

const FIELD_LABEL: Record<string, string> = {
  license_plate: "Dominio",
  brand: "Marca",
  model: "Modelo",
  manufacture_year: "Año de fabricación",
  registration_year: "Año de patentamiento",
  type_ced: "Tipo",

  weight: "Peso del auto",
  total_weight: "Peso total",
  front_weight: "Peso eje delantero",
  back_weight: "Peso eje trasero",
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
  ownerDni,
}: VehicleFormProps) {
  const { setIsIdle, errors, setErrors } = useApplication() as any;

  const greenCardNoExpiration =
    car?.green_card_no_expiration === true ||
    (
      car?.green_card_no_expiration === undefined &&
      (!car?.green_card_expiration || car?.green_card_expiration === "")
    );

  // Si green_card_no_expiration es explícitamente false, no usar la lógica automática
  // Si es explícitamente true, siempre está marcado
  // Si es undefined, usar la lógica automática basada en si el campo está vacío
  const isGreenCardNoExpirationChecked = 
    car?.green_card_no_expiration === false 
      ? false 
      : car?.green_card_no_expiration === true
        ? true
        : greenCardNoExpiration;

  const setCarError = (name: string, msg: string) =>
    setErrors((prev: any) => ({ ...(prev || {}), [`car_${name}`]: msg }));

  const getCarError = (name: string) => (errors ? errors[`car_${name}`] : "");

  const engineAuto = useRef<boolean>(!car?.engine_brand || String(car?.engine_brand).trim() === "");
  const chassisAuto = useRef<boolean>(!car?.chassis_brand || String(car?.chassis_brand).trim() === "");
  const didAutofill = useRef(false);
  
  const [_, setIsTypingInBrand] = useState(false);
  
  const [engineBrandManuallyEdited, setEngineBrandManuallyEdited] = useState(false);
  const [chassisBrandManuallyEdited, setChassisBrandManuallyEdited] = useState(false);
  const [useSameAsDni, setUseSameAsDni] = useState(false);


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
      if (name === "green_card_expiration" && isGreenCardNoExpirationChecked) {
        setCarError(name, "");
        return;
      }
      const formatted = /^\d{4}-\d{2}-\d{2}$/.test(v);
      setCarError(name, formatted ? "" : "Fecha inválida, usa AAAA-MM-DD.");
      return;
    }

    if (name === "manufacture_year" || name === "registration_year") {
      if (!p.test(v)) {
        setCarError(name, MSG[name as keyof typeof MSG]);
        return;
      }
      const currentYear = new Date().getFullYear();
      const yearValue = Number(v);
      if (yearValue > currentYear) {
        const errorKey = name === "manufacture_year" ? "manufacture_year_future" : "registration_year_future";
        setCarError(name, MSG[errorKey as keyof typeof MSG]);
        return;
      }
      setCarError(name, "");
      return;
    }

    if (name === "license_plate") {
      if (!v) {
        setCarError(name, "");
        return;
      }
      const isValid = PATTERN.license_plate.test(v);
      setCarError(name, isValid ? "" : MSG.license_plate);
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
    if (key === "license_number") {
      // Si el usuario edita manualmente, desmarcar el checkbox
      if (useSameAsDni) {
        setUseSameAsDni(false);
      }
      sanitizeAndMaybeError(key, value);
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

  const handleSameAsDniChange = (checked: boolean) => {
    if (!ownerDni) return; // No permitir cambios si no hay DNI
    setUseSameAsDni(checked);
    if (checked && ownerDni) {
      const sanitized = SANITIZE.license_number ? SANITIZE.license_number(ownerDni) : ownerDni;
      setCar((prev: any) => ({
        ...prev,
        license_number: sanitized,
      }));
      validateOne("license_number", sanitized);
    }
  };

  useEffect(() => {
    setIsIdle(false);
  }, [setIsIdle]);

  // Sincronizar license_number cuando ownerDni cambia y el checkbox está marcado
  useEffect(() => {
    if (useSameAsDni && ownerDni) {
      const sanitized = SANITIZE.license_number ? SANITIZE.license_number(ownerDni) : ownerDni;
      setCar((prev: any) => {
        if (prev?.license_number !== sanitized) {
          return { ...prev, license_number: sanitized };
        }
        return prev;
      });
      validateOne("license_number", sanitized);
    } else if (useSameAsDni && !ownerDni) {
      // Si el checkbox está marcado pero no hay DNI, desmarcarlo
      setUseSameAsDni(false);
    }
  }, [ownerDni, useSameAsDni, setCar]);

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
    <div className="min-h-screen py-3 sm:py-6">
      <div className="max-w-8xl mx-auto px-1 sm:px-2 md:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Datos del Vehículo</h1>
          <p className="text-xs sm:text-sm text-gray-600">Completá los datos del vehículo para continuar</p>
        </div>

        {/* Errores */}
        {carErrorsList.length > 0 && (
          <div className="mb-4 sm:mb-6 border border-red-300 bg-red-50 text-red-700 text-xs sm:text-sm rounded-lg px-3 sm:px-4 py-2 sm:py-3">
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

        <div className="grid gap-4 sm:gap-6">
          {/* Sección 1: Información Básica */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-[14px] flex items-center justify-center">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Información Básica</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Dominio, marca, modelo y años</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
                {/* Primera fila: Dominio y Marca en una mitad, Modelo en otra mitad */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                  <FormField
                    label="Dominio"
                    placeholder="Ej: AB123AB"
                    type="text"
                    name="license_plate"
                    isOwner={true}
                    value={car?.license_plate ?? ""}
                    onChange={(val) => handleChange("license_plate", val)}
                    onFocus={() => handleFocus("license_plate")}
                    onBlur={() => handleBlur("license_plate")}
                    error={getCarError("license_plate")}
                    isRequired={true}
                  />
                  <FormField
                    label="Marca"
                    placeholder="Ej: Fiat"
                    type="text"
                    name="brand"
                    isOwner={true}
                    value={car?.brand ?? ""}
                    onChange={(val) => handleChange("brand", val)}
                    onFocus={() => handleFocus("brand")}
                    onBlur={() => handleBlur("brand")}
                    error={getCarError("brand")}
                    isRequired={true}
                  />
                  <FormField
                    label="Modelo"
                    placeholder="Ej: Cronos"
                    type="text"
                    name="model"
                    isOwner={true}
                    value={car?.model ?? ""}
                    onChange={(val) => handleChange("model", val)}
                    onFocus={() => handleFocus("model")}
                    onBlur={() => handleBlur("model")}
                    error={getCarError("model")}
                    isRequired={true}
                    className="md:col-span-2"
                  />
                </div>
                {/* Segunda fila: Años en una mitad y Tipo al lado */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                  <FormField
                    label="Año de fabricación"
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
                  <FormField
                    label="Año de patentamiento"
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
                  <FormField
                    label="Tipo"
                    placeholder="Ej: Sedán 3 Puertas"
                    type="text"
                    name="type_ced"
                    isOwner={true}
                    value={car?.type_ced ?? ""}
                    onChange={(val) => handleChange("type_ced", val)}
                    onFocus={() => handleFocus("type_ced")}
                    onBlur={() => handleBlur("type_ced")}
                    error={getCarError("type_ced")}
                    className="md:col-span-2"
                    isRequired={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Especificaciones Técnicas */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-[14px] flex items-center justify-center">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Especificaciones Técnicas</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Pesos, combustible, tipo y uso del vehículo</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
                {/* Pesos */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      label="Peso eje delantero (KG)"
                      placeholder="Ej: 1000"
                      type="text"
                      name="front_weight"
                      isOwner={true}
                      value={car?.front_weight ?? ""}
                      onChange={(val) => handleChange("front_weight", val)}
                      onFocus={() => handleFocus("front_weight")}
                      onBlur={() => handleBlur("front_weight")}
                      error={getCarError("front_weight")}
                      isRequired={true}
                    />
                    <FormField
                      label="Peso eje trasero (KG)"
                      placeholder="Ej: 1000"
                      type="text"
                      name="back_weight"
                      isOwner={true}
                      value={car?.back_weight ?? ""}
                      onChange={(val) => handleChange("back_weight", val)}
                      onFocus={() => handleFocus("back_weight")}
                      onBlur={() => handleBlur("back_weight")}
                      error={getCarError("back_weight")}
                      isRequired={true}
                    />
                    <FormField
                      label="Peso total (KG)"
                      placeholder="Ej: 2000"
                      type="text"
                      name="total_weight"
                      isOwner={true}
                      value={car?.total_weight ?? ""}
                      onChange={(val) => handleChange("total_weight", val)}
                      onFocus={() => handleFocus("total_weight")}
                      onBlur={() => handleBlur("total_weight")}
                      error={getCarError("total_weight")}
                      isRequired={true}
                    />
                  </div>
                </div>
                {/* Clasificación */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      label="Tipo de combustible"
                      type="select"
                      options={[
                        { value: "nafta", label: "Nafta" },
                        { value: "diesel", label: "Diésel" },
                        { value: "electrico", label: "Eléctrico" },
                        { value: "gnc", label: "GNC" },
                        { value: "hibrido", label: "Híbrido" },
                      ]}
                      name="fuel_type"
                      isOwner={true}
                      value={car?.["fuel_type"] ?? ""}
                      onChange={(val) => handleChange("fuel_type", val)}
                      onBlur={() => handleBlur("fuel_type")}
                      error={getCarError("fuel_type")}
                      isRequired={true}
                    />
                    <FormField
                      label="Tipo de vehículo"
                      type="select"
                      options={[
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
                      ]}
                      name="vehicle_type"
                      isOwner={true}
                      value={car?.["vehicle_type"] ?? ""}
                      onChange={(val) => handleChange("vehicle_type", val)}
                      onBlur={() => handleBlur("vehicle_type")}
                      error={getCarError("vehicle_type")}
                      isRequired={true}
                    />
                    <FormField
                      label="Tipo de uso"
                      type="select"
                      options={[
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
                      ]}
                      name="usage_type"
                      isOwner={true}
                      value={car?.["usage_type"] ?? ""}
                      onChange={(val) => handleChange("usage_type", val)}
                      onBlur={() => handleBlur("usage_type")}
                      error={getCarError("usage_type")}
                      isRequired={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Motor y Chasis */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-[14px] flex items-center justify-center">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Motor y Chasis</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Información del motor y chasis del vehículo</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  label="Marca de motor"
                  placeholder="Ej: Toyota"
                  type="text"
                  name="engine_brand"
                  isOwner={true}
                  value={car?.engine_brand ?? ""}
                  onChange={(val) => handleChange("engine_brand", val)}
                  onFocus={() => handleFocus("engine_brand")}
                  onBlur={() => handleBlur("engine_brand")}
                  error={getCarError("engine_brand")}
                  isRequired={true}
                />
                <FormField
                  label="Número de motor"
                  placeholder="Ej: B91099432213123"
                  type="text"
                  name="engine_number"
                  isOwner={true}
                  value={car?.engine_number ?? ""}
                  onChange={(val) => handleChange("engine_number", val)}
                  onFocus={() => handleFocus("engine_number")}
                  onBlur={() => handleBlur("engine_number")}
                  error={getCarError("engine_number")}
                  isRequired={true}
                />
                <FormField
                  label="Marca de chasis"
                  placeholder="Ej: MARCA"
                  type="text"
                  name="chassis_brand"
                  isOwner={true}
                  value={car?.chassis_brand ?? ""}
                  onChange={(val) => handleChange("chassis_brand", val)}
                  onFocus={() => handleFocus("chassis_brand")}
                  onBlur={() => handleBlur("chassis_brand")}
                  error={getCarError("chassis_brand")}
                  isRequired={true}
                />
                <FormField
                  label="Número de chasis"
                  placeholder="Ej: 1231415251251451"
                  type="text"
                  name="chassis_number"
                  isOwner={true}
                  value={car?.chassis_number ?? ""}
                  onChange={(val) => handleChange("chassis_number", val)}
                  onFocus={() => handleFocus("chassis_number")}
                  onBlur={() => handleBlur("chassis_number")}
                  error={getCarError("chassis_number")}
                  isRequired={true}
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Documentación */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-[14px] flex items-center justify-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Documentación</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Cédula verde, licencia y seguro</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <div className="space-y-6">
                {/* Primera fila: Cédula Verde y Nº de licencia */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                  <FormField
                    label="Nº de cédula verde"
                    placeholder="Ej: ABF45658"
                    type="text"
                    name="green_card_number"
                    isOwner={true}
                    value={car?.green_card_number ?? ""}
                    onChange={(val) => handleChange("green_card_number", val)}
                    onFocus={() => handleFocus("green_card_number")}
                    onBlur={() => handleBlur("green_card_number")}
                    error={getCarError("green_card_number")}
                    isRequired={true}
                  />
                  <FormField
                    label="Exp. de la cédula"
                    placeholder="dd/mm/aa"
                    type="date"
                    name="green_card_expiration"
                    isOwner={true}
                    value={toDateInputValue(car?.["green_card_expiration"])}
                    onChange={(val) => handleChange("green_card_expiration", val)}
                    onFocus={() => handleFocus("green_card_expiration")}
                    onBlur={() => handleBlur("green_card_expiration")}
                    error={getCarError("green_card_expiration")}
                    disabled={isGreenCardNoExpirationChecked}
                    innerCheckboxLabel="Sin vencimiento"
                    innerCheckboxChecked={isGreenCardNoExpirationChecked}
                    onInnerCheckboxChange={handleGreenCardNoExpirationChange}
                    isRequired={true}
                  />
                  <FormField
                    label="Nº de licencia"
                    placeholder="Ej: A123456789"
                    type="text"
                    name="license_number"
                    isOwner={true}
                    value={car?.license_number ?? ""}
                    onChange={(val) => handleChange("license_number", val)}
                    onFocus={() => handleFocus("license_number")}
                    onBlur={() => handleBlur("license_number")}
                    error={getCarError("license_number")}
                    isRequired={true}
                    className="md:col-span-2"
                    innerCheckboxLabel="Mismo que DNI"
                    innerCheckboxChecked={useSameAsDni}
                    onInnerCheckboxChange={handleSameAsDniChange}
                    innerCheckboxDisabled={!ownerDni}
                  />
                </div>
                {/* Primera fila: Clase y Exp. de licencia en una mitad, Póliza en otra mitad */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                  <FormField
                    label="Clase de licencia"
                    type="select"
                    name="license_class"
                    isOwner={true}
                    value={car?.license_class ?? ""}
                    onChange={(val) => handleChange("license_class", val)}
                    onBlur={() => handleBlur("license_class")}
                    error={getCarError("license_class")}
                    options={[
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
                    ]}
                  />
                  <FormField
                    label="Exp. de la licencia"
                    placeholder="dd/mm/aa"
                    type="date"
                    name="license_expiration"
                    isOwner={true}
                    value={toDateInputValue(car?.["license_expiration"])}
                    onChange={(val) => handleChange("license_expiration", val)}
                    onFocus={() => handleFocus("license_expiration")}
                    onBlur={() => handleBlur("license_expiration")}
                    error={getCarError("license_expiration")}
                    isRequired={true}
                  />
                  <FormField
                    label="Póliza del seguro"
                    placeholder="Ej: ABC1234567"
                    type="text"
                    name="insurance"
                    isOwner={true}
                    value={car?.insurance ?? ""}
                    onChange={(val) => handleChange("insurance", val)}
                    onFocus={() => handleFocus("insurance")}
                    onBlur={() => handleBlur("insurance")}
                    error={getCarError("insurance")}
                    className="md:col-span-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 5: Documentos Adjuntos */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg sm:rounded-[14px] flex items-center justify-center">
                  <Clipboard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Documentos Adjuntos</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Subí los documentos requeridos.</p>
                </div>
              </div>
            </div>
            <div className="px-3 sm:px-4 md:px-6">
              <VehicleDocsDropzone
                existing={existingCarDocs as CarExistingDoc[]}
                onDeleteExisting={onDeleteCarDoc}
                onPendingChange={(files: File[]) => onPendingCarDocsChange?.(files)}
                onDoneCountChange={onVehicleDocsCountChange}
                resetToken={car?.license_plate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
