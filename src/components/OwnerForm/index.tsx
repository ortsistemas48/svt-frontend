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

type DocType = "dni" | "cuit" | "passport";
type IdType = "dni" | "cuit" | "passport";

type Props = {
  data: any;
  applicationId: number;
  setData: (value: any) => void;
  onPendingDocsChange?: (files: File[]) => void;
  existingDocuments?: ExistingDoc[];
  onDeleteExisting?: (docId: number) => Promise<void> | void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MSG: Record<string, string> = {
  dni: "Solo números (hasta 9).",
  cuit: "Solo números (11 dígitos).",
  razon_social: "Razón social requerida.",
  phone_number: "Solo números (hasta 15).",
  first_name: "Solo letras (con acentos), espacios, ' y - (máx. 40).",
  last_name: "Solo letras (con acentos), espacios, ' y - (máx. 40).",
  email: "Formato de email inválido.",
  passport_number: "Alfanumérico (máx. 20 caracteres).",
};

const PATTERN: Record<string, RegExp> = {
  dni: /^\d{1,9}$/,
  cuit: /^\d{11}$/,
  razon_social: /^.{1,100}$/,
  phone_number: /^\d{1,15}$/,
  first_name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,40}$/,
  last_name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,40}$/,
  email: EMAIL_REGEX,
  passport_number: /^[A-Za-z0-9]{1,20}$/,
};

const uniqueByValue = (arr: { value: any; label: any }[] = []) => {
  const m = new Map<string, { value: any; label: any }>();
  for (const o of arr) m.set(String(o.value).trim().toLowerCase(), { value: String(o.value), label: String(o.label) });
  return Array.from(m.values());
};

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "dni", label: "DNI" },
  { value: "cuit", label: "CUIT" },
  { value: "passport", label: "Pasaporte" },
];

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
  const [initialIdType, setInitialIdType] = useState<IdType | null>(null);
  const [docType, setDocType] = useState<DocType>("dni");

  // Sincronizar docType cuando llegan datos pre-cargados (aplicación existente)
  useEffect(() => {
    if (initialIdType !== null) return; // ya fue seteado por una búsqueda manual
    if (data?.passport_number) {
      setDocType("passport");
    } else if (data?.cuit && data.cuit.replace(/\D/g, "").length === 11) {
      setDocType("cuit");
    } else if (data?.dni) {
      setDocType("dni");
    }
  }, [data?.passport_number, data?.cuit, data?.dni, initialIdType]);

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
        if (!cancelled) setCityApiFailed(true);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();
    return () => { cancelled = true; };
  }, [data?.province]);

  const idType = useMemo((): IdType => {
    if (initialIdType) return initialIdType;
    if (data?.passport_number) return "passport";
    const cuit = data?.cuit || "";
    const dni = data?.dni || "";
    if (cuit && onlyDigits(cuit).length === 11) return "cuit";
    if (dni && onlyDigits(dni).length <= 9) return "dni";
    return "dni";
  }, [initialIdType, data?.dni, data?.cuit, data?.passport_number]);

  const baseFormData = useMemo(() => {
    const cityField =
      cityApiFailed || (cityOptions.length === 0 && !loadingCities && data?.province)
        ? { label: "Localidad", placeholder: "Ej: Córdoba Capital", name: "city", type: "text", isRequired: true, disabled: !data?.province }
        : { label: "Localidad", options: cityOptions, name: "city", isRequired: true, disabled: loadingCities || !data?.province || cityOptions.length === 0 };

    if (idType === "cuit") {
      return [
        { label: "CUIT", placeholder: "Ej: 20123456789", name: "cuit", type: "text", isRequired: true },
        { label: "Razón Social", placeholder: "Ej: Empresa S.A.", name: "razon_social", type: "text", isRequired: true },
        { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street", isRequired: true },
        { label: "Provincia", options: provinceOptions, name: "province", isRequired: true },
        cityField,
        { label: "Email", placeholder: "Ej: ejemplo@gmail.com", name: "email", type: "email" },
        { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number", type: "text" },
        { label: "Nombre/s", placeholder: "Ej: Ángel Isaías", name: "first_name", type: "text", isRequired: false },
        { label: "Apellido/s", placeholder: "Ej: Vaquero", name: "last_name", type: "text", isRequired: false },
        { label: "DNI", placeholder: "Ej: 39959950", name: "dni", type: "text", isRequired: false },
      ];
    }

    if (idType === "passport") {
      return [
        { label: "Pasaporte", placeholder: "Ej: AB123456", name: "passport_number", type: "text", isRequired: true },
        { label: "Nombre/s", placeholder: "Ej: Ángel Isaías", name: "first_name", isRequired: true },
        { label: "Apellido/s", placeholder: "Ej: Vaquero", name: "last_name", isRequired: true },
        { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street", isRequired: true },
        { label: "Provincia", options: provinceOptions, name: "province", isRequired: true },
        cityField,
        { label: "Email", placeholder: "Ej: ejemplo@gmail.com", name: "email", type: "email" },
        { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number", type: "text" },
      ];
    }

    // DNI layout (default)
    return [
      { label: "DNI", placeholder: "Ej: 39959950", name: "dni", type: "text", isRequired: true },
      { label: "Nombre/s", placeholder: "Ej: Ángel Isaías", name: "first_name", isRequired: true },
      { label: "Apellido/s", placeholder: "Ej: Vaquero", name: "last_name", isRequired: true },
      { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street", isRequired: true },
      { label: "Provincia", options: provinceOptions, name: "province", isRequired: true },
      cityField,
      { label: "Email", placeholder: "Ej: ejemplo@gmail.com", name: "email", type: "email" },
      { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number", type: "text" },
      { label: "CUIT", placeholder: "Ej: 20123456789", name: "cuit", type: "text", isRequired: false },
      { label: "Razón Social", placeholder: "Ej: Empresa S.A.", name: "razon_social", type: "text", isRequired: false },
    ];
  }, [idType, provinceOptions, cityOptions, loadingCities, cityApiFailed, data?.province]);

  const handleChangeField = (name: string, raw: string) => {
    let value = raw;
    switch (name) {
      case "dni":
        value = clamp(onlyDigits(value), 9);
        break;
      case "cuit":
        value = clamp(onlyDigits(value), 11);
        break;
      case "passport_number":
        value = clamp(value.replace(/[^A-Za-z0-9]/g, ""), 20);
        break;
      case "razon_social":
        value = clamp(value, 100);
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
    if (name in PATTERN) validateOne(name, value);
  };

  const handleBlurField = (name: string) => {
    if (!(name in PATTERN)) return;
    validateOne(name, String(data?.[name] ?? ""));
  };

  const clearOwnerErrors = () => {
    setErrors((prev: any) => {
      if (!prev) return prev;
      const next: any = {};
      for (const k of Object.keys(prev)) if (!k.startsWith("owner_")) next[k] = prev[k];
      return next;
    });
  };

  const searchFieldLabel = docType === "cuit" ? "CUIT" : docType === "passport" ? "Número de Pasaporte" : "DNI";
  const searchPlaceholder = docType === "cuit" ? "Ej: 20123456789" : docType === "passport" ? "Ej: AB123456" : "Ej: 39959950";
  const searchDataKey = docType === "passport" ? "passport_number" : docType;
  const apiDocType = docType === "passport" ? "PAS" : docType.toUpperCase();

  const docTypeSelector = (
    <div className="w-full max-w-2xl mb-2">
      <label className="block text-xs sm:text-sm text-gray-700 mb-1 sm:mb-1.5">
        T. de Documento
      </label>
      <select
        value={docType}
        onChange={(e) => {
          setDocType(e.target.value as DocType);
          setInitialIdType(null);
        }}
        className="w-full border border-[#DEDEDE] rounded-[4px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
      >
        {DOC_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

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
      searchConfig={{
        enabled: true,
        dataKey: searchDataKey,
        fieldLabel: searchFieldLabel,
        placeholder: searchPlaceholder,
        inputType: "text",
        idleExtraContent: docTypeSelector,
        sanitize: (s) => {
          if (docType === "passport") return clamp(s.replace(/[^A-Za-z0-9]/g, ""), 20);
          return clamp(s, 50);
        },
        validate: (q) => {
          if (docType === "passport") {
            if (!q) return "Ingresá un número de pasaporte válido.";
            if (!/^[A-Za-z0-9]{1,20}$/.test(q)) return "El pasaporte debe ser alfanumérico (máx. 20 caracteres).";
            return null;
          }
          const digits = onlyDigits(q);
          if (!digits) return `Ingresá un ${searchFieldLabel} válido.`;
          if (docType === "dni") {
            if (digits.length > 9) return "El DNI debe tener hasta 9 dígitos.";
            return null;
          }
          if (docType === "cuit") {
            if (digits.length !== 11) return "El CUIT debe tener exactamente 11 dígitos.";
            return null;
          }
          return null;
        },
        buildUrl: (value) => {
          return `/api/persons/get-persons-by-dni-or-cuit/${encodeURIComponent(value)}?doc_type=${apiDocType}`;
        },
        mapFound: (payload, value) => {
          const p = Array.isArray(payload) ? payload[0] : payload;
          setInitialIdType(docType === "passport" ? "passport" : docType === "cuit" ? "cuit" : "dni");
          if (docType === "passport") {
            return {
              passport_number: value,
              first_name: p?.first_name ?? "",
              last_name: p?.last_name ?? "",
              phone_number: p?.phone_number ?? "",
              email: p?.email ?? "",
              province: p?.province ?? p?.Province ?? "",
              city: p?.city ?? "",
              street: p?.street ?? "",
            };
          }
          if (docType === "cuit") {
            return {
              cuit: value,
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
          }
          return {
            dni: value,
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
        },
        mapNotFound: (value) => {
          setInitialIdType(docType === "passport" ? "passport" : docType === "cuit" ? "cuit" : "dni");
          if (docType === "passport") return { passport_number: value };
          if (docType === "cuit") return { cuit: value };
          return { dni: value };
        },
        notFoundStatus: 404,
        titleIdle: "Datos del Titular",
        descIdle: "Ingresá el identificador para traer los datos de la persona",
        searchButtonLabel: "Buscar",
        resetButtonLabel: `Buscar otro ${searchFieldLabel}`,
        onReset: () => {
          clearOwnerErrors();
          setData({});
          setInitialIdType(null);
          setDocType("dni");
        },
        onModeChange: (_m) => {},
      }}
      defaultMode="edit"
    />
  );
}
