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

// ---- mensajes & patrones (vacío = sin error) ----
const MSG: Record<string, string> = {
  dni: "Solo números (hasta 9).",
  phone_number: "Solo números (hasta 15).",
  first_name: "Solo letras (con acentos), espacios, ' y - (máx. 40).",
  last_name: "Solo letras (con acentos), espacios, ' y - (máx. 40).",
  email: "Formato de email inválido.",
};

const PATTERN: Record<string, RegExp> = {
  dni: /^\d{1,9}$/,
  phone_number: /^\d{1,15}$/,
  first_name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,40}$/,
  last_name: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,40}$/,
  email: EMAIL_REGEX,
};

export default function OwnerForm({
  data,
  applicationId,
  setData,
  onPendingDocsChange,
  existingDocuments = [],
  onDeleteExisting,
}: Props) {
  const { errors, setErrors } = useApplication();

  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // helpers para setear/limpiar errores del owner
  const setOwnerError = (name: string, msg: string) =>
    setErrors((prev: any) => ({ ...(prev || {}), [`owner_${name}`]: msg }));

  const validateOne = (name: string, raw: string) => {
    const val = String(raw ?? "");
    const p = PATTERN[name];
    if (!p) return;              // sin patrón => no seteamos nada
    if (!val) {
      setOwnerError(name, "");   // vacío (opcional) => sin error
      return;
    }
    setOwnerError(name, p.test(val) ? "" : MSG[name]);
  };

  // 1) Cargar provincias al montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const provs = await getProvinces();
        if (!cancelled) setProvinceOptions(provs);
      } catch (e) {
        console.error("Error cargando provincias:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Cuando cambia la provincia, recargar localidades
  useEffect(() => {
    let cancelled = false;

    const province = data?.province ?? "";
    if (!province) {
      setCityOptions([]);
      return;
    }

    setLoadingCities(true);
    setCityOptions([]);

    (async () => {
      try {
        const locs = await getLocalidadesByProvincia(province);
        if (!cancelled) setCityOptions(locs);
      } catch (e) {
        console.error("Error cargando localidades:", e);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data?.province]);

  // 3) Form schema base
  const baseFormData = useMemo(
    () => [
      { label: "DNI", placeholder: "Ej: 39959950", name: "dni", type: "text" },
      { label: "Email", placeholder: "Ej: ejemplo@gmail.com", name: "email", type: "email" },
      { label: "Nombre", placeholder: "Ej: Ángel Isaías", name: "first_name" },
      { label: "Apellido", placeholder: "Ej: Vaquero", name: "last_name" },
      { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number", type: "text" },
      { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street" },
      { label: "Provincia", options: [], name: "province" },
      { label: "Localidad", options: [], name: "city" },
    ],
    []
  );

  // 4) Inyectar opciones dinámicas y deshabilitar Localidad si corresponde
  const dynamicFormData = useMemo(() => {
    return baseFormData.map((f) => {
      if (f.name === "province") {
        return { ...f, options: provinceOptions };
      }
      if (f.name === "city") {
        return {
          ...f,
          options: cityOptions,
          disabled: loadingCities || !data?.province,
        };
      }
      return f;
    });
  }, [baseFormData, provinceOptions, cityOptions, loadingCities, data?.province]);

  // 5) Sanitizado + validaciones al escribir (y setear errores con setErrors)
  const handleChangeField = (name: string, raw: string) => {
    let value = raw;

    switch (name) {
      case "dni":
        value = clamp(onlyDigits(value), 9);
        break;
      case "street":
        value = clamp(value, 40); // sin regla: no seteamos error
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
        // al cambiar provincia, limpiar localidad
        setData((prev: any) => ({ ...prev, city: "" }));
        break;
      default:
        break;
    }

    // Guardar el valor saneado
    setData((prev: any) => ({ ...prev, [name]: value }));

    // Validar en vivo y setear errores del owner
    if (name in PATTERN) {
      validateOne(name, value);
    }
  };

  // 6) Validación en onBlur (email opcional + resto por si hace falta)
  const handleBlurField = (name: string) => {
    if (!(name in PATTERN)) return;
    validateOne(name, String(data?.[name] ?? ""));
  };

  return (
    <>
      

      <FormTemplate
        formData={dynamicFormData as any}
        applicationId={applicationId}
        title="Datos del Titular"
        onDeleteExisting={onDeleteExisting}
        description="Ingrese los datos del titular del auto"
        data={data}
        setData={setData}
        showDropzone={true}
        onPendingDocsChange={onPendingDocsChange}
        existingDocuments={existingDocuments}
        onChangeField={handleChangeField}
        onBlurField={handleBlurField}
        // si querés pintar más campos en rojo, agregalos acá
        fieldErrors={{
          email: errors.owner_email,
        }}
      />
    </>
  );
}
