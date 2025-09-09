'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
const PersonForm = dynamic(() => import("@/components/PersonForm"));
const VehicleForm = dynamic(() => import("@/components/VehicleForm"));
const ConfirmationForm = dynamic(() => import("@/components/ConfirmationForm"));
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams } from 'next/navigation'
import { getMissingCarFields, getMissingPersonFields, markStickerAsUsed } from "@/utils";
import MissingDataModal from "../MissingDataModal";
import { useApplication } from "@/context/ApplicationContext";
import { ApplicationSkeleton } from "../ApplicationSkeleton";

type Props = {
  applicationId: string;
  initialData?: {
    owner?: any;
    driver?: any;
    car?: any;
  };
};

type Doc = { id: number; file_name: string; file_url: string; size_bytes?: number; mime_type?: string; role: 'owner' | 'driver' | 'car' | 'generic'; created_at?: string };

export default function ApplicationForm({ applicationId, initialData }: Props) {
  const { isIdle, setIsIdle, errors, setErrors } = useApplication();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const hasBlockingErrors = useMemo(() => (step === 1 || step === 2) && Object.values(errors ?? {}).some(Boolean), [errors, step]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMissingDataModal, setShowMissingDataModal] = useState(false);
  const [pendingOwnerDocs, setPendingOwnerDocs] = useState<File[]>([]);
  const [pendingDriverDocs, setPendingDriverDocs] = useState<File[]>([]);
  const [existingDocsByRole, setExistingDocsByRole] = useState<{
    owner: Doc[]; driver: Doc[]; car: Doc[]; generic: Doc[];
  }>({ owner: [], driver: [], car: [], generic: [] });
  const [confirmAction, setConfirmAction] = useState<"inspect" | "queue" | "confirm_car" | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [owner, setOwner] = useState<any>({ ...(initialData?.owner || {}) });
  const [driver, setDriver] = useState<any>({ ...(initialData?.driver || {}) });
  const [isSamePerson, setIsSamePerson] = useState(true);
  const [car, setCar] = useState<any>({ ...(initialData?.car || {}) });

  const deleteDocument = useCallback(async (docId: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/applications/${applicationId}/documents/${docId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "No se pudo borrar el documento");
    }
  }, [applicationId]);

  const onDeleteOwnerDoc = useCallback(async (docId: number) => {
    await deleteDocument(docId);
    setExistingDocsByRole(prev => ({ ...prev, owner: prev.owner.filter(d => d.id !== docId) }));
  }, [deleteDocument]);

  const onDeleteDriverDoc = useCallback(async (docId: number) => {
    await deleteDocument(docId);
    setExistingDocsByRole(prev => ({ ...prev, driver: prev.driver.filter(d => d.id !== docId) }));
  }, [deleteDocument]);

  const uploadPendingDocuments = useCallback(async (files: File[], role: 'owner' | 'driver' | 'car' | 'generic') => {
    if (!files || files.length === 0) return [] as any[];
    const form = new FormData();
    files.forEach(f => form.append("files", f, f.name));
    form.append("role", role);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/applications/${applicationId}/documents`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Error subiendo documentos");
    }
    return res.json();
  }, [applicationId]);

  useEffect(() => {
    // Si recibimos datos iniciales desde la página, inicializamos estados y evitamos refetch
    if (initialData && (initialData.owner || initialData.driver || initialData.car)) {
      setOwner({ ...(initialData.owner || {}) });
      if (initialData.driver?.is_owner || (initialData.owner?.id && initialData.driver?.id && initialData.driver.id === initialData.owner.id)) {
        setIsSamePerson(true);
        setDriver({ ...(initialData.owner || {}), is_owner: true });
      } else {
        setIsSamePerson(false);
        setDriver({ ...(initialData.driver || {}) });
      }
      setCar({ ...(initialData.car || {}) });
      setMissingFields([]);
      setIsInitializing(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/data`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Error al obtener los datos");

        const json = await res.json();

        // Normalizamos objetos (pueden venir vacíos en apps nuevas)
        const ownerData = json.owner ?? {};
        const driverData = json.driver ?? {};
        const carData = json.car ?? {};

        const hasOwner = Object.keys(ownerData).length > 0;
        const hasDriver = Object.keys(driverData).length > 0;

        // ¿Titular y conductor son la misma persona?
        // - explícito: driver.is_owner === true
        // - mismo id (cuando existen ambos)
        // - por defecto: si NO hay driver => true
        const same =
          driverData?.is_owner === true ||
          (hasOwner && hasDriver && ownerData?.id && driverData?.id && ownerData.id === driverData.id) ||
          !hasDriver;

        // Seteamos estados
        setOwner({ ...ownerData });
        setIsSamePerson(same);
        setDriver(same ? { ...ownerData, is_owner: true } : { ...driverData, is_owner: false });
        setCar({ ...carData });

        // Documentos por rol (acepta documents_by_role o construye desde documents)
        const byRole = json.documents_by_role ?? {
          owner: (json.documents || []).filter((d: Doc) => d.role === "owner"),
          driver: (json.documents || []).filter((d: Doc) => d.role === "driver"),
          car: (json.documents || []).filter((d: Doc) => d.role === "car"),
          generic: (json.documents || []).filter(
            (d: Doc) => !["owner", "driver", "car"].includes(d.role)
          ),
        };

        setExistingDocsByRole({
          owner: byRole.owner || [],
          driver: byRole.driver || [],
          car: byRole.car || [],
          generic: byRole.generic || [],
        });
      } catch (err) {
        console.error("Error al cargar los datos:", err);
        } finally {
          // limpiamos listado de faltantes para este ciclo
          setMissingFields([]);
          setIsInitializing(false);
        }
      };
      fetchData();
    }, [applicationId, initialData]);

  useEffect(() => {
    setErrors({});
  }, [step, setErrors]);

  const sendToQueue = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/queue`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Error al enviar a la cola");

      router.push(`/dashboard/${id}/applications`);
    } catch (err) {
      console.error("Error al enviar a la cola:", err);
    }
  }, [applicationId, id, router]);

  // 🔸 Extraído: guardar vehículo (paso 2)
  const saveVehicle = useCallback(async () => {
    // Validación de campos requeridos
    const missing = getMissingCarFields(car);
    if (missing.length > 0) {
      setMissingFields(prev => [...prev, ...missing.map(f => `Vehículo: ${f}`)]);
      setShowMissingDataModal(true);
      return false;
    }

    // Marcar oblea "en uso" si existe
    const stickerId = car?.sticker?.id ?? car?.sticker_id;
    if (stickerId) {
      try {
        await markStickerAsUsed(stickerId);
      } catch (e) {
        console.error("No se pudo marcar la oblea como 'En Uso':", e);
      }
    }

    // Guardar vehículo
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/car`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_plate: car.license_plate,
        brand: car.brand,
        model: car.model,
        manufacture_year: car.manufacture_year,
        weight: car.weight,
        fuel_type: car.fuel_type,
        vehicle_type: car.vehicle_type,
        usage_type: car.usage_type,
        engine_brand: car.engine_brand,
        engine_number: car.engine_number,
        chassis_number: car.chassis_number,
        chassis_brand: car.chassis_brand,
        green_card_number: car.green_card_number,
        green_card_expiration: car.green_card_expiration,
        license_number: car.license_number,
        license_expiration: car.license_expiration,
        insurance: car.insurance,
        sticker_id: car.sticker_id,
      }),
    });
    if (!res.ok) throw new Error("Error al guardar el vehículo");
    return true;
  }, [applicationId, car]);

  const handleNext = useCallback(async () => {
    setLoading(true);
    setMissingFields([]);

    try {
      let res;
      if (step === 1) {
        const missingAll: string[] = [];
        const ownerMissing = getMissingPersonFields(owner);
        const driverMissing = isSamePerson ? [] : getMissingPersonFields(driver);
        if (ownerMissing.length) missingAll.push(...ownerMissing.map(f => `Titular: ${f}`));
        if (driverMissing.length) missingAll.push(...driverMissing.map(f => `Conductor: ${f}`));
        if (missingAll.length) {
          setMissingFields(missingAll);
          setShowMissingDataModal(true);
          setLoading(false);
          return;
        }

        // Guardar titular
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/owner`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: owner.first_name,
            last_name: owner.last_name,
            dni: owner.dni,
            phone: owner.phone_number,
            email: owner.email,
            province: owner.province,
            city: owner.city,
            address: owner.street,
            is_same_person: driver?.is_owner || false,
          }),
        });
        if (!res.ok) throw new Error("Error al guardar el titular");

        // Guardar conductor
        if (driver?.is_owner === true) {
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/driver`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_same_person: true }),
          });
        } else {
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/driver`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: driver.first_name,
              last_name: driver.last_name,
              dni: driver.dni,
              phone: driver.phone_number,
              email: driver.email,
              province: driver.province,
              city: driver.city,
              address: driver.street,
              is_same_person: false,
            }),
          });
        }

        // Subir docs pendientes
        const uploadedDocs: any[] = [];
        if (isSamePerson) {
          if (pendingOwnerDocs.length > 0 || pendingDriverDocs.length > 0) {
            const merged = [...pendingOwnerDocs, ...pendingDriverDocs];
            const up = await uploadPendingDocuments(merged, 'owner');
            uploadedDocs.push(...up);
          }
        } else {
          const promises: Promise<any[]>[] = [];
          if (pendingOwnerDocs.length > 0) promises.push(uploadPendingDocuments(pendingOwnerDocs, 'owner'));
          if (pendingDriverDocs.length > 0) promises.push(uploadPendingDocuments(pendingDriverDocs, 'driver'));
          if (promises.length) {
            const results = await Promise.all(promises);
            results.forEach(r => uploadedDocs.push(...r));
          }
        }

        if (uploadedDocs.length > 0) {
          setExistingDocsByRole(prev => ({
            ...prev,
            owner: [...uploadedDocs.filter(d => d.role === 'owner'), ...prev.owner],
            driver: [...uploadedDocs.filter(d => d.role === 'driver'), ...prev.driver],
            car: [...uploadedDocs.filter(d => d.role === 'car'), ...prev.car],
            generic: [...uploadedDocs.filter(d => d.role === 'generic' || !d.role), ...prev.generic],
          }));
          setPendingOwnerDocs([]);
          setPendingDriverDocs([]);
        }

        if (!res.ok) throw new Error("Error al guardar el conductor");
      }

      // 🔸 Paso 2: en lugar de guardar directo, pedimos confirmación
      if (step === 2) {
        const missing = getMissingCarFields(car);
        if (missing.length > 0) {
          setMissingFields(prev => [...prev, ...missing.map(f => `Vehículo: ${f}`)]);
          setShowMissingDataModal(true);
          setLoading(false);
          return;
        }
        // Mostrar modal de confirmación de vehículo
        setConfirmAction("confirm_car");
        setShowConfirmModal(true);
        setLoading(false);
        return; // no seguimos ahora; esperamos confirmación del modal
      }

      // Paso 3: Confirmar trámite
      if (step === 3) {
        const resConfirm = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/confirm`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: new Date().toISOString() }),
        });
        if (!resConfirm.ok) throw new Error("Error al confirmar el trámite");
      }

      if (step < 3) setStep(step + 1);
    } catch (error: any) {
      console.error(error);
      alert("Hubo un error al guardar los datos. Revisá los campos o intentá más tarde.");
    } finally {
      setLoading(false);
    }
  }, [step, isSamePerson, owner, driver, applicationId, pendingOwnerDocs, pendingDriverDocs, uploadPendingDocuments, car, router, id]);

  const handlePrev = useCallback(() => {
    setIsIdle(false)
    if (step > 1) setStep(step - 1);
  }, [setIsIdle, step]);

  const renderStepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <PersonForm
            owner={owner}
            setOwner={setOwner}
            driver={driver}
            setDriver={setDriver}
            applicationId={applicationId}
            isSamePerson={isSamePerson}
            setIsSamePerson={setIsSamePerson}
            onPendingOwnerDocsChange={setPendingOwnerDocs}
            onPendingDriverDocsChange={setPendingDriverDocs}
            existingOwnerDocs={existingDocsByRole.owner}
            existingDriverDocs={existingDocsByRole.driver}
            onDeleteOwnerDoc={onDeleteOwnerDoc}
            onDeleteDriverDoc={onDeleteDriverDoc}
          />
        );
      case 2:
        return <VehicleForm car={car} setCar={setCar} />;
      case 3:
        return <ConfirmationForm applicationId={applicationId} />;
      default:
        return null;
    }
  }, [step, owner, driver, applicationId, isSamePerson, existingDocsByRole.owner, existingDocsByRole.driver, onDeleteOwnerDoc, onDeleteDriverDoc, car]);

  if (isInitializing) {
    return (
      <div className="p-6">
        <ApplicationSkeleton />
      </div>
    );
  }

  return (
    <>
      <article className="flex max-md:flex-col gap-y-2 items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Revisiones</span>
        </div>
        <span className="text-md mr-4  text-black">Paso {step}/3</span>
      </article>

      <div>{renderStepContent}</div>

      <div className="flex gap-x-3 justify-center px-4 pt-8 pb-10">
        {step !== 1 && (
          <button
            onClick={handlePrev}
            disabled={loading}
            className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-5"
          >
            <ChevronLeft size={18} />
            Volver
          </button>
        )}
        {step !== 3 && !isIdle && (
          <button
            onClick={handleNext}
            disabled={loading || hasBlockingErrors}
            className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-5 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Continuar"}
          </button>
        )}
        {step === 3 && (
          <>
            <button
              disabled={loading}
              onClick={() => {
                setConfirmAction("inspect");
                setShowConfirmModal(true);
              }}
              className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-5"
            >
              {loading ? "Guardando..." : "Inspeccionar"}
            </button>
            <button
              disabled={loading}
              onClick={() => {
                setConfirmAction("queue");
                setShowConfirmModal(true);
              }}
              className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-5"
            >
              Enviar a cola <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {/* Título y cuerpo del modal según acción */}
            <h2 className="text-lg font-semibold mb-3">
              {confirmAction === "confirm_car" ? "¿Estás seguro?" : "¿Estás seguro?"}
            </h2>

            <p className="mb-4">
              {confirmAction === "confirm_car"
                ? "Estás por confirmar los datos de tu vehículo. ¿Deseás continuar?"
                : "Vas a confirmar el trámite. ¿Deseás continuar?"}
            </p>

            <div className="flex justify-center gap-5 mt-5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-white border border-[#d91e1e] text-[#d91e1e] duration-150 px-4 py-2 rounded-[4px] hover:text-white hover:bg-[#d91e1e]"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  // Cerrar modal para evitar dobles clics
                  setShowConfirmModal(false);

                  if (confirmAction === "confirm_car") {
                    try {
                      setLoading(true);
                      const ok = await saveVehicle();
                      if (ok) setStep(3);
                    } catch (e) {
                      console.error(e);
                      alert("Hubo un error al guardar los datos del vehículo.");
                    } finally {
                      setLoading(false);
                    }
                    return;
                  }

                  if (confirmAction === "inspect") {
                    router.push(`/dashboard/${id}/inspections/${applicationId}`);
                    return;
                  }

                  if (confirmAction === "queue") {
                    await sendToQueue();
                    return;
                  }
                }}
                className="bg-[#0040B8] text-white px-4 py-2 rounded-[4px] hover:bg-[#0032a0]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showMissingDataModal && (
        <MissingDataModal missingFields={missingFields} onClose={setShowMissingDataModal} />
      )}
    </>
  );
}
