// components/DriverForm.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
import FormTemplate from "../FormTemplate";
import type { ExistingDoc } from "../Dropzone";
import { getProvinces, getLocalidadesByProvincia } from "@/utils";

type Props = {
  data: any;
  applicationId: number;
  setData: (value: any) => void;
  onPendingDocsChange?: (files: File[]) => void;
  existingDocuments?: ExistingDoc[];
  onDeleteExisting?: (docId: number) => Promise<void> | void;
};

export default function DriverForm({
  data,
  applicationId,
  setData,
  onPendingDocsChange,
  existingDocuments = [],
  onDeleteExisting
}: Props) {
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
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Cuando cambia la provincia en los datos, recargar localidades
  useEffect(() => {
    let cancelled = false;

    const province = data?.province ?? "";
    if (!province) {
      setCityOptions([]);
      return;
    }

    setLoadingCities(true);
    setCityOptions([]); // limpiamos mientras carga

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

  // 3) formData base (sin opciones de provincia/localidad hardcodeadas)
  const baseFormData = useMemo(
    () => ([
      { label: "DNI", placeholder: "Ej: 39.959.950", name: "dni" },
      { label: "Email", type: "email", placeholder: "Ej: ejemplo@gmail.com", name: "email" },
      { label: "Nombre", placeholder: "Ej: Ángel Isaías Vaquero", name: "first_name" },
      { label: "Apellido", placeholder: "Ej: Ángel Isaías Vaquero", name: "last_name" },
      { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number" },
      { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street" },
      { label: "Provincia", options: [], name: "province" },
      { label: "Localidad", options: [], name: "city" },
    ]),
    []
  );

  // 4) Inyectamos opciones dinámicas en Provincia/Localidad y deshabilitamos Localidad si está cargando
  const dynamicFormData = useMemo(() => {
    return baseFormData.map((f) => {
      if (f.name === "province") {
        return { ...f, options: provinceOptions };
      }
      if (f.name === "city") {
        return {
          ...f,
          options: cityOptions,
          disabled: loadingCities || !(data?.province), // deshabilitar si no hay provincia o está cargando
        };
      }
      return f;
    });
  }, [baseFormData, provinceOptions, cityOptions, loadingCities, data?.province]);

  // 5) Hook para enterarnos si cambió provincia y así limpiar city
  const handleChangeField = (name: string, value: string) => {
    if (name === "province") {
      // Reseteamos la localidad seleccionada cuando cambia provincia
      setData((prev: any) => ({ ...prev, city: "" }));
    }
  };

  return (
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
      onChangeField={handleChangeField} // <-- clave del cascado
    />
  );
}
