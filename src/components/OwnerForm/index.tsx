// components/OwnerForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import FormTemplate from "../FormTemplate";
import type { ExistingDoc } from "../Dropzone";
import {
  getProvinces,
  getLocalidadesByProvincia,
  clamp,
  onlyDigits,
  sanitizeEmail,
  sanitizeName,
} from "@/utils";
import { useApplication } from "@/context/ApplicationContext";

type Props = {
  data: any;
  applicationId: number;
  setData: (value: any) => void;
  onPendingDocsChange?: (files: File[]) => void;
  existingDocuments?: ExistingDoc[];
  onDeleteExisting?: (docId: number) => Promise<void> | void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Helper para detectar si es DNI o CUIT
const detectIdType = (value: string): "dni" | "cuit" | null => {
  const digits = onlyDigits(value);
  if (digits.length <= 9) return "dni";
  if (digits.length === 11) return "cuit";
  return null;
};

// ---- mensajes & patrones (vacío = sin error) ----
const MSG: Record<string, string> = {
  dni: "Solo números (hasta 9).",
  cuit: "Solo números (11 dígitos).",
  razon_social: "Razón social requerida.",
  phone_number: "Solo números (hasta 15).",
  first_name: "Solo letras (con acentos), espacios, ' y - (máx. 40).",
  last_name: "Solo letras (con acentos), espacios, ' y - (máx. 40).",
  email: "Formato de email inválido.",
};

const PATTERN: Record<string, RegExp> = {
  dni: /^\d{1,9}$/,
  cuit: /^\d{11}$/,
  razon_social: /^.{1,100}$/,
  phone_number: /^\d{1,15}$/,
  first_name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,40}$/,
  last_name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,40}$/,
  email: EMAIL_REGEX,
};

// Dedup por value (para evitar keys duplicadas en selects)
const uniqueByValue = (arr: { value: any; label: any }[] = []) => {
  const m = new Map<string, { value: any; label: any }>();
  for (const o of arr) m.set(String(o.value).trim().toLowerCase(), { value: String(o.value), label: String(o.label) });
  return Array.from(m.values());
};

export default function OwnerForm({
  data,
  applicationId,
  setData,
  onPendingDocsChange,
  existingDocuments = [],
  onDeleteExisting,
}: Props) {
  const { errors, setErrors } = useApplication() as any;

  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityApiFailed, setCityApiFailed] = useState(false);
  // Guardar el tipo inicial basado en la búsqueda para mantener el layout fijo
  const [initialIdType, setInitialIdType] = useState<"dni" | "cuit" | null>(null);

  // helpers de error (prefijo owner_)
  const setOwnerError = (name: string, msg: string) =>
    setErrors((prev: any) => ({ ...(prev || {}), [`owner_${name}`]: msg }));

  const validateOne = (name: string, raw: string) => {
    const val = String(raw ?? "");
    const p = PATTERN[name];
    if (!p) return;
    if (!val) {
      setOwnerError(name, "");
      return;
    }
    setOwnerError(name, p.test(val) ? "" : MSG[name]);
  };

  // Provincias
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const provs = await getProvinces();
        if (!cancelled) setProvinceOptions(uniqueByValue(provs));
      } catch (e) {
        console.error("Error cargando provincias:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Localidades
  useEffect(() => {
    let cancelled = false;

    const province = data?.province ?? "";
    if (!province) {
      setCityOptions([]);
      setCityApiFailed(false);
      return;
    }

    setLoadingCities(true);
    setCityOptions([]);
    setCityApiFailed(false);

    (async () => {
      try {
        const locs = await getLocalidadesByProvincia(province);
        if (!cancelled) {
          setCityOptions(uniqueByValue(locs));
          setCityApiFailed(false);
        }
      } catch (e) {
        console.error("Error cargando localidades:", e);
        if (!cancelled) {
          setCityApiFailed(true);
        }
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();

    return () => { cancelled = true; };
  }, [data?.province]);

  // Detectar tipo de ID (DNI o CUIT) basado en el tipo inicial de la búsqueda
  // Si no hay tipo inicial, detectarlo de los datos pero solo una vez
  const idType = useMemo(() => {
    // Si ya hay un tipo inicial guardado, usarlo (mantiene el layout fijo)
    if (initialIdType) {
      return initialIdType;
    }
    
    // Si no hay tipo inicial, detectarlo de los datos
    const cuit = data?.cuit || "";
    const dni = data?.dni || "";
    
    // Si hay CUIT válido, usar layout CUIT
    if (cuit && detectIdType(cuit) === "cuit") {
      return "cuit";
    }
    // Si hay DNI válido, usar layout DNI
    if (dni && detectIdType(dni) === "dni") {
      return "dni";
    }
    // Por defecto, usar layout DNI
    return "dni";
  }, [initialIdType, data?.dni, data?.cuit]);

  // Schema base - Layout dinámico según tipo
  const baseFormData = useMemo(() => {
    const isCuit = idType === "cuit";
    
    if (isCuit) {
      // Layout CUIT: cuit y razon_social obligatorios, nombre/apellido/dni opcionales al final
      return [
        { label: "CUIT", placeholder: "Ej: 20123456789", name: "cuit", type: "text", isRequired: true },
        { label: "Razón Social", placeholder: "Ej: Empresa S.A.", name: "razon_social", type: "text", isRequired: true },
        { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street", isRequired: true },
        { label: "Provincia", options: provinceOptions, name: "province", isRequired: true },
        cityApiFailed || (cityOptions.length === 0 && !loadingCities && data?.province)
        ? { label: "Localidad", placeholder: "Ej: Córdoba Capital", name: "city", type: "text", isRequired: true, disabled: !data?.province }
        : { label: "Localidad", options: cityOptions, name: "city", isRequired: true, disabled: loadingCities || !data?.province || cityOptions.length === 0 },
        { label: "Email", placeholder: "Ej: ejemplo@gmail.com", name: "email", type: "email" },
        { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number", type: "text" },
        { label: "Nombre/s", placeholder: "Ej: Ángel Isaías", name: "first_name", type: "text", isRequired: false },
        { label: "Apellido/s", placeholder: "Ej: Vaquero", name: "last_name", type: "text", isRequired: false },
        { label: "DNI", placeholder: "Ej: 39959950", name: "dni", type: "text", isRequired: false },
      ];
    } else {
      // Layout DNI: dni, nombre, apellido obligatorios; cuit y razon_social opcionales
      return [
        { label: "DNI", placeholder: "Ej: 39959950", name: "dni", type: "text", isRequired: true },
        { label: "Nombre/s", placeholder: "Ej: Ángel Isaías", name: "first_name", isRequired: true },
        { label: "Apellido/s", placeholder: "Ej: Vaquero", name: "last_name", isRequired: true },
        { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street", isRequired: true },
        { label: "Provincia", options: provinceOptions, name: "province", isRequired: true },
        cityApiFailed || (cityOptions.length === 0 && !loadingCities && data?.province)
        ? { label: "Localidad", placeholder: "Ej: Córdoba Capital", name: "city", type: "text", isRequired: true, disabled: !data?.province }
        : { label: "Localidad", options: cityOptions, name: "city", isRequired: true, disabled: loadingCities || !data?.province || cityOptions.length === 0 },
        { label: "Email", placeholder: "Ej: ejemplo@gmail.com", name: "email", type: "email" },
        { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number", type: "text" },
        { label: "CUIT", placeholder: "Ej: 20123456789", name: "cuit", type: "text", isRequired: false },
        { label: "Razón Social", placeholder: "Ej: Empresa S.A.", name: "razon_social", type: "text", isRequired: false },
      ];
    }
  }, [idType, provinceOptions, cityOptions, loadingCities, cityApiFailed, data?.province]);

  // Sanitizado + validaciones
  const handleChangeField = (name: string, raw: string) => {
    let value = raw;

    switch (name) {
      case "dni":
        value = clamp(onlyDigits(value), 9);
        break;
      case "cuit":
        value = clamp(onlyDigits(value), 11);
        break;
      case "razon_social":
        value = clamp(value, 100);
        break;
      case "street":
        value = clamp(value, 40);
        break;
      case "phone_number":
        value = clamp(onlyDigits(value), 15);
        break;
      case "first_name":
      case "last_name":
        value = clamp(sanitizeName(value), 40);
        break;
      case "email":
        value = clamp(sanitizeEmail(value), 60);
        break;
      case "province":
        setData((prev: any) => ({ ...prev, city: "" }));
        break;
      default:
        break;
    }

    setData((prev: any) => ({ ...prev, [name]: value }));

    if (name in PATTERN) {
      validateOne(name, value);
    }
  };

  const handleBlurField = (name: string) => {
    if (!(name in PATTERN)) return;
    validateOne(name, String(data?.[name] ?? ""));
  };

  // limpiar errores owner_ cuando se resetea la búsqueda
  const clearOwnerErrors = () => {
    setErrors((prev: any) => {
      if (!prev) return prev;
      const next: any = {};
      for (const k of Object.keys(prev)) if (!k.startsWith("owner_")) next[k] = prev[k];
      return next;
    });
  };

  return (
    <FormTemplate
      formData={baseFormData as any}
      applicationId={applicationId}
      title="Datos del Titular"
      description="Ingrese los datos del titular del auto"
      data={data}
      setData={setData}
      showDropzone={false}
      onPendingDocsChange={onPendingDocsChange}
      existingDocuments={existingDocuments}
      onDeleteExisting={onDeleteExisting}
      onChangeField={handleChangeField}
      onBlurField={handleBlurField}
      fieldErrors={{
        email: errors?.owner_email,
      }}
      // 🆕: búsqueda reutilizable dentro del template
      searchConfig={{
        enabled: true,
        dataKey: "dni",
        fieldLabel: "DNI o CUIT",
        placeholder: "Ej: 39959950 o 20123456789",
        inputType: "text",
        sanitize: (s) => clamp(onlyDigits(s), 11),
        validate: (q) => {
          const digits = onlyDigits(q);
          if (!digits) return "Ingresá un DNI o CUIT válido.";
          if (digits.length <= 9) return null; // DNI válido
          if (digits.length === 11) return null; // CUIT válido
          return "El DNI debe tener hasta 9 dígitos y el CUIT debe tener 11 dígitos.";
        },
        buildUrl: (value) => {
          const digits = onlyDigits(value);
          return `/api/persons/get-persons-by-dni-or-cuit/${encodeURIComponent(digits)}`;
        },
        mapFound: (payload, value) => {
          const p = Array.isArray(payload) ? payload[0] : payload;
          const digits = onlyDigits(value);
          const isCuit = digits.length === 11;
          
          // Guardar el tipo inicial basado en la búsqueda
          setInitialIdType(isCuit ? "cuit" : "dni");
          
          if (isCuit) {
            return {
              cuit: digits,
              razon_social: p?.razon_social ?? "",
              first_name: p?.first_name ?? "",
              last_name: p?.last_name ?? "",
              dni: p?.dni ?? "",
              phone_number: p?.phone_number ?? "",
              email: p?.email ?? "",
              province: p?.province ?? p?.Province ?? "",
              city: p?.city ?? "",
              street: p?.street ?? "",
            };
          } else {
            return {
              dni: digits,
              first_name: p?.first_name ?? "",
              last_name: p?.last_name ?? "",
              cuit: p?.cuit ?? "",
              razon_social: p?.razon_social ?? "",
              phone_number: p?.phone_number ?? "",
              email: p?.email ?? "",
              province: p?.province ?? p?.Province ?? "",
              city: p?.city ?? "",
              street: p?.street ?? "",
            };
          }
        },
        mapNotFound: (value) => {
          const digits = onlyDigits(value);
          const isCuit = digits.length === 11;
          
          // Guardar el tipo inicial basado en la búsqueda
          setInitialIdType(isCuit ? "cuit" : "dni");
          
          return isCuit ? { cuit: digits } : { dni: digits };
        },
        notFoundStatus: 404,
        titleIdle: "Datos del Titular",
        descIdle: "Ingresá el DNI o CUIT para traer los datos de la persona",
        searchButtonLabel: "Buscar",
        resetButtonLabel: "Buscar otro DNI/CUIT",
        onReset: () => {
          clearOwnerErrors();
          setData({}); // volver a un estado limpio
          setInitialIdType(null); // resetear el tipo inicial
        },
        onModeChange: (m) => {
          // opcional: podrías setear descripciones dinámicas aquí si lo necesitás
        },
      }}
      // Si quisieras que, sin búsqueda, arranque en edit:
      defaultMode="edit"
    />
  );
}
