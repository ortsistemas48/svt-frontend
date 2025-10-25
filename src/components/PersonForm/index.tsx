// components/PersonForm.tsx
'use client';

import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm";
import CheckBox from "../CheckBox";
import type { ExistingDoc } from "../Dropzone";
import { useApplication } from "@/context/ApplicationContext";
import { useEffect, useMemo } from "react";

type Props = {
  owner: any; setOwner: (v: any) => void;
  driver: any; setDriver: (v: any) => void;
  applicationId: number | string;
  isSamePerson: boolean; setIsSamePerson: (v: boolean) => void;

  onPendingOwnerDocsChange?: (files: File[]) => void;
  onPendingDriverDocsChange?: (files: File[]) => void;

  existingOwnerDocs?: ExistingDoc[];
  existingDriverDocs?: ExistingDoc[];
  onDeleteOwnerDoc?: (docId: number) => Promise<void> | void;
  onDeleteDriverDoc?: (docId: number) => Promise<void> | void;
};

// Etiquetas legibles para el resumen de errores
const FIELD_LABEL: Record<string, string> = {
  dni: "DNI",
  email: "Email",
  first_name: "Nombre",
  last_name: "Apellido",
  phone_number: "Teléfono",
  street: "Domicilio",
  province: "Provincia",
  city: "Localidad",
};

export default function PersonForm({
  owner,
  setOwner,
  driver,
  setDriver,
  applicationId,
  isSamePerson,
  setIsSamePerson,
  onPendingOwnerDocsChange, onPendingDriverDocsChange,
  existingOwnerDocs = [], existingDriverDocs = [],
  onDeleteOwnerDoc,
  onDeleteDriverDoc,
}: Props) {

  const { errors, setErrors } = useApplication();

  // 🔹 helper: limpia todos los errores del conductor (driver_*)
  const clearDriverErrors = () => {
    setErrors(prev => {
      const next = { ...(prev || {}) };
      Object.keys(next).forEach(k => {
        if (k.startsWith("driver_")) delete next[k]; // también podrías: next[k] = ""
      });
      return next;
    });
  };
  
  const handleCheckboxChange = (value: boolean) => {
    setIsSamePerson(value);

    if (value) {
      // misma persona -> el conductor hereda del titular (solo flag) y limpiamos errores del conductor
      setDriver({ is_owner: true });
      clearDriverErrors();
    } else {
      // personas distintas -> reseteamos campos del conductor
      setDriver({
        is_owner: false,
        first_name: "",
        last_name: "",
        dni: "",
        phone_number: "",
        email: "",
        province: "",
        city: "",
        street: "",
      });
      // si quisieras, también podrías limpiar errores acá:
      // clearDriverErrors();
    }
  };

  // Por si isSamePerson cambia desde afuera, garantizamos la limpieza
  useEffect(() => {
    if (isSamePerson) clearDriverErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSamePerson]);

  // ---- Resumen de errores
  const ownerErrorsList = useMemo(() => {
    const entries = Object.entries(errors ?? {}).filter(
      ([k, v]) => k.startsWith("owner_") && Boolean(v)
    ) as [string, string][];
    return entries.map(([k, msg]) => {
      const field = k.replace(/^owner_/, "");
      return { field, label: FIELD_LABEL[field] ?? field, msg };
    });
  }, [errors]);

  const driverErrorsList = useMemo(() => {
    const entries = Object.entries(errors ?? {}).filter(
      ([k, v]) => k.startsWith("driver_") && Boolean(v)
    ) as [string, string][];
    return entries.map(([k, msg]) => {
      const field = k.replace(/^driver_/, "");
      return { field, label: FIELD_LABEL[field] ?? field, msg };
    });
  }, [errors]);

  const showAnyErrors =
    ownerErrorsList.length > 0 || (!isSamePerson && driverErrorsList.length > 0);

  const { isIdle } = useApplication() as any;
  return (
    <div className="">
      {
        !isIdle && (

          <div className="flex justify-center items-center gap-x-4 mb-14">
            <h1 className="text-xl font-regular">
              ¿El titular y el conductor son la misma persona?
            </h1>
            <CheckBox label="" checked={isSamePerson} onChange={handleCheckboxChange} />
          </div>
        )
      }

      {/* Resumen de errores */}
      {showAnyErrors && (
        <div className="mx-4 mb-6 border border-red-300 bg-red-50 text-red-700 text-sm rounded-[4px] px-4 py-3">
          <p className="font-medium mb-1 text-lg">Revisá estos campos:</p>

          {ownerErrorsList.length > 0 && (
            <>
              <p className="font-semibold mb-1">Titular</p>
              <ul className="list-disc pl-5 space-y-1 mb-2">
                {ownerErrorsList.map(({ field, label, msg }) => (
                  <li key={`owner-${field}`}>
                    <span className="font-medium">{label}:</span> {msg}
                  </li>
                ))}
              </ul>
            </>
          )}

          {!isSamePerson && driverErrorsList.length > 0 && (
            <>
              <p className="font-semibold mb-1">Conductor</p>
              <ul className="list-disc pl-5 space-y-1">
                {driverErrorsList.map(({ field, label, msg }) => (
                  <li key={`driver-${field}`}>
                    <span className="font-medium">{label}:</span> {msg}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div
        className={`grid ${!isSamePerson ? "grid-cols-[1fr_1px_1fr]" : "px-4 grid-cols-1"
          } max-xl:grid-cols-1 max-xl:px-7 gap-8 mb-4 items-start`}
      >
        <OwnerForm
          data={owner}
          applicationId={applicationId as number}
          setData={setOwner}
          onPendingDocsChange={onPendingOwnerDocsChange}
          existingDocuments={existingOwnerDocs}
          onDeleteExisting={onDeleteOwnerDoc}
        />

        {!isSamePerson && <div className="bg-[#dedede] h-full w-px max-xl:w-full max-xl:h-px" />}

        {!isSamePerson && (
          <DriverForm
            data={driver}
            applicationId={applicationId as number}
            onDeleteExisting={onDeleteDriverDoc}
            setData={setDriver}
            onPendingDocsChange={onPendingDriverDocsChange}
            existingDocuments={existingDriverDocs}
          />
        )}
      </div>
    </div>
  );
}
