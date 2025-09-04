// components/DriverForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import FormTemplate from "../FormTemplate";
import type { ExistingDoc } from "../Dropzone";
import { getProvinces, getLocalidadesByProvincia } from "@/utils";
import { useApplication } from "@/context/ApplicationContext";

type Props = {
  data: any;
  applicationId: number;
  setData: (value: any) => void;
  onPendingDocsChange?: (files: File[]) => void;
  existingDocuments?: ExistingDoc[];
  onDeleteExisting?: (docId: number) => Promise<void> | void;
};

// ---------- Helpers de sanitizado ----------
const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const NAME_ALLOWED = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]/g;
const sanitizeName = (s: string) => (s.match(NAME_ALLOWED)?.join("") ?? "");
const sanitizeEmail = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
const clamp = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function DriverForm({
  data,
  applicationId,
  setData,
  onPendingDocsChange,
  existingDocuments = [],
  onDeleteExisting
}: Props) {
  const { errors, setErrors } = useApplication();

  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

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
    return () => { cancelled = true; };
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

    return () => { cancelled = true; };
  }, [data?.province]);

  // 3) Form schema base
  const baseFormData = useMemo(
    () => ([
      { label: "DNI",        placeholder: "Ej: 39959950",             name: "dni",          type: "text" },
      { label: "Email",      placeholder: "Ej: ejemplo@gmail.com",    name: "email",        type: "email" },
      { label: "Nombre",     placeholder: "Ej: Ángel Isaías",         name: "first_name" },
      { label: "Apellido",   placeholder: "Ej: Vaquero",              name: "last_name" },
      { label: "Teléfono",   placeholder: "Ej: 3516909988",           name: "phone_number", type: "text" },
      { label: "Domicilio",  placeholder: "Ej: Avenida Colón 3131",   name: "street" },
      { label: "Provincia",  options: [],                              name: "province" },
      { label: "Localidad",  options: [],                              name: "city" },
    ]),
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
          disabled: loadingCities || !(data?.province),
        };
      }
      return f;
    });
  }, [baseFormData, provinceOptions, cityOptions, loadingCities, data?.province]);

  // 5) Sanitizado + validaciones al escribir
  const handleChangeField = (name: string, raw: string) => {
    let value = raw;

    switch (name) {
      case "dni":
        value = clamp(onlyDigits(value), 9);     // sólo dígitos, máx 9
        break;
      case "street":
        value = clamp(value, 40);
        break;

      case "phone_number":
        value = clamp(onlyDigits(value), 15);    // sólo dígitos, máx 15
        break;

      case "first_name":
      case "last_name":
        value = clamp(sanitizeName(value), 40);  // letras (tildes), espacios, ' y -, máx 40
        break;

      case "email": {
        value = clamp(sanitizeEmail(value), 60); // trim+lower, máx 60
        // email opcional: si hay texto y no cumple regex -> error
        const err = value && !EMAIL_REGEX.test(value) ? "Formato de email inválido." : "";
        setErrors(prev => ({ ...prev, driver_email: err }));
        break;
      }

      case "province":
        // al cambiar provincia, limpiar localidad
        setData((prev: any) => ({ ...prev, city: "" }));
        break;

      default:
        // street: sin regla
        break;
    }

    // Guardar el valor saneado
    setData((prev: any) => ({ ...prev, [name]: value }));
  };

  // 6) Validación en onBlur (email opcional)
  const handleBlurField = (name: string) => {
    if (name !== "email") return;
    const v = String(data?.email ?? "").trim().toLowerCase();
    const err = v && !EMAIL_REGEX.test(v) ? "Formato de email inválido." : "";
    setErrors(prev => ({ ...prev, driver_email: err }));
  };

  return (
    <FormTemplate
      formData={dynamicFormData as any}
      applicationId={applicationId}
      title="Datos del Conductor"
      onDeleteExisting={onDeleteExisting}
      description="Ingrese los datos del conductor del auto"
      data={data}
      setData={setData}
      showDropzone={true}
      onPendingDocsChange={onPendingDocsChange}
      existingDocuments={existingDocuments}
      onChangeField={handleChangeField}
      onBlurField={handleBlurField}
      fieldErrors={{ email: errors.driver_email }} // sólo pinta error en Email (Conductor)
    />
  );
}
