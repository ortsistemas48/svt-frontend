'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
const PersonForm = dynamic(() => import("@/components/PersonForm"));
const VehicleForm = dynamic(() => import("@/components/VehicleForm"));
const ConfirmationForm = dynamic(() => import("@/components/ConfirmationForm"));
const StickerStep = dynamic(() => import("@/components/StickerStep"));
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams } from 'next/navigation'
import { getMissingCarFields, getMissingPersonFields, markStickerAsUsed } from "@/utils";
import MissingDataModal from "../MissingDataModal";
import { useApplication } from "@/context/ApplicationContext";
import { ApplicationSkeleton } from "../ApplicationSkeleton";
import type { PendingCarDoc } from "@/components/VehicleDocsDropzone";

type Props = {
  applicationId: string;
  initialData?: {
    owner?: any;
    driver?: any;
    car?: any;
  };
};

type Doc = { id: number; file_name: string; file_url: string; size_bytes?: number; mime_type?: string; role: 'owner' | 'driver' | 'car' | 'generic'; created_at?: string; type? : string;};

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
    const res = await fetch(`/api/docs/applications/${applicationId}/documents/${docId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "No se pudo borrar el documento");
    }
  }, [applicationId]);

  const [pendingCarDocs, setPendingCarDocs] = useState<PendingCarDoc[]>([]);

  const onDeleteCarDoc = useCallback(async (docId: number) => {
    await deleteDocument(docId);
    setExistingDocsByRole(prev => ({ ...prev, car: prev.car.filter(d => d.id !== docId) }));
  }, [deleteDocument]);

  const consumeSlot = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/consume-slot`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // opcional
      });

      if (res.status === 409) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "No hay inspecciones disponibles para este taller");
        return false;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error("consume-slot error", j);
        // no detengo el flujo por errores no 409, pero podés decidir distinto
        return true;
      }

      // 200 OK, incluye already_consumed para info, no hace falta usarlo
      return true;
    } catch (e) {
      console.error("Error consumiendo cupo:", e);
      // no detengo el flujo
      return true;
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

    const res = await fetch(`/api/docs/applications/${applicationId}/documents`, {
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

  const uploadPendingVehicleDocuments = useCallback(async (items: PendingCarDoc[]) => {
    if (!items || items.length === 0) return [] as any[];
    const form = new FormData();
    for (const it of items) {
      form.append("files", it.file, it.file.name);
      form.append("types", it.type); // arreglo paralelo al de files
    }
    form.append("role", "car");

    const res = await fetch(`/api/docs/applications/${applicationId}/documents`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Error subiendo documentos del vehículo");
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
          `/api/applications/${applicationId}/data`,
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

  const saveStickerStep = useCallback(async () => {
    // Guarda la mínima info para no perderla al pasar a Step 3
    if (!car?.license_plate) return true; // nada que guardar, seguimos

    const payload = {
      license_plate: car.license_plate,
      // si ya hay oblea seleccionada, guardamos su id
      sticker_id: car?.sticker?.id ?? car?.sticker_id ?? null,
    };

    try {
      const res = await fetch(`/api/applications/${applicationId}/car`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error("saveStickerStep error", j);
        // no frenamos el flujo por un 4xx/5xx ocasional, pero lo logueamos
      }
    } catch (e) {
      console.error("saveStickerStep network error", e);
    }
    return true;
  }, [applicationId, car]);

  const sendToQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/queue`, {
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

  const saveVehicle = useCallback(async () => {
    const missing = getMissingCarFields(car);
    if (missing.length > 0) {
      setMissingFields(prev => [...prev, ...missing.map(f => `Vehículo: ${f}`)]);
      setShowMissingDataModal(true);
      return false;
    }

    const stickerId = car?.sticker?.id ?? car?.sticker_id;
    if (stickerId) {
      try { await markStickerAsUsed(stickerId); } catch (e) { console.error(e); }
    }

    const res = await fetch(`/api/applications/${applicationId}/car`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_plate: car.license_plate,
        brand: car.brand,
        model: car.model,
        manufacture_year: car.manufacture_year,
        registration_year: car.registration_year,
        weight: car.weight,
        fuel_type: car.fuel_type,
        vehicle_type: car.vehicle_type,
        usage_type: car.usage_type,
        engine_brand: car.engine_brand,
        engine_number: car.engine_number,
        chassis_number: car.chassis_number,
        chassis_brand: car.chassis_brand,
        green_card_number: car.green_card_number,
        green_card_no_expiration: car.green_card_no_expiration,
        green_card_expiration: car.green_card_expiration,
        license_number: car.license_number,
        license_expiration: car.license_expiration,
        license_class: car.license_class,
        insurance: car.insurance,
        sticker_id: car.sticker_id,
        total_weight: car.total_weight,
        front_weight: car.front_weight,
        back_weight: car.back_weight,
        registration_month: car.registration_month,
      }),
    });

    if (!res.ok) throw new Error("Error al guardar el vehículo");

     if (pendingCarDocs.length > 0) {
       try {
         const up = await uploadPendingVehicleDocuments(pendingCarDocs);
         setExistingDocsByRole(prev => ({
           ...prev,
           car: [...up, ...prev.car],
         }));
         setPendingCarDocs([]);
       } catch (e) {
         console.error("Error subiendo docs del vehículo:", e);
       }
     }

    return true;
  }, [
    applicationId,
    car,
    pendingCarDocs,          
    uploadPendingDocuments,   
  ]);

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
        res = await fetch(`/api/applications/${applicationId}/owner`, {
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
          res = await fetch(`/api/applications/${applicationId}/driver`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_same_person: true }),
          });
        } else {
          res = await fetch(`/api/applications/${applicationId}/driver`, {
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
        const okConsume = await consumeSlot();
        if (!okConsume) {
          return;
        }

      }
      if (step === 2) {
        await saveStickerStep();

        setStep(3);
        setLoading(false);
        return;
      }

      if (step === 3) {
        const missing = getMissingCarFields(car);
        if (missing.length > 0) {
          setMissingFields(prev => [...prev, ...missing.map(f => `Vehículo, ${f}`)]);
          setShowMissingDataModal(true);
          setLoading(false);
          return;
        }
        setConfirmAction("confirm_car");
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      if (step === 4) {
        const resConfirm = await fetch(`/api/applications/${applicationId}/confirm`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: new Date().toISOString() }),
        });
        if (!resConfirm.ok) throw new Error("Error al confirmar el trámite");
      }

      if (step < 4) setStep(step + 1);
    } catch (error: any) {
      console.error(error);
      alert("Hubo un error al guardar, revisá los campos o intentá más tarde.");
    } finally {
      setLoading(false);
    }
  }, [step, isSamePerson, owner, driver, applicationId, pendingOwnerDocs, pendingDriverDocs, uploadPendingDocuments, car, router, id, consumeSlot]);

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
        return (
          <StickerStep
            workshopId={Number(id)}
            car={car}
            setCar={setCar}
          />
        );
      case 3:
        return (
          <VehicleForm
            car={car}
            setCar={setCar}
            onPendingCarDocsChange={setPendingCarDocs}
            existingCarDocs={existingDocsByRole.car as any}
            onDeleteCarDoc={onDeleteCarDoc}
          />
        );
      case 4:
        return <ConfirmationForm applicationId={applicationId} />;
      default:
        return null;
    }
  }, [
    step,
    owner,
    driver,
    car,
    applicationId,
    isSamePerson,
    existingDocsByRole.owner,
    existingDocsByRole.driver,
    existingDocsByRole.car,
    onDeleteOwnerDoc,
    onDeleteDriverDoc,
    onDeleteCarDoc,
    id,
  ]);


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
          <ChevronRight size={20} />
          <span className="font-bold">{applicationId}</span>
        </div>
        <span className="text-md mr-4  text-black">Paso {step}/4</span>
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
        {step !== 4 && !isIdle && (
          <button
            onClick={handleNext}
            disabled={loading || hasBlockingErrors}
            className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-5 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Continuar"}
          </button>
        )}
        {step === 4 && (
          <>
            <button
              disabled={loading}
              onClick={() => {
                setConfirmAction("queue");
                setShowConfirmModal(true);
              }}
              className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-5"
            >
              Enviar a cola
            </button>
            <button
              disabled={loading}
              onClick={() => {
                setConfirmAction("inspect");
                setShowConfirmModal(true);
              }}
              className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-5"
            >
              {loading ? "Guardando..." : "Inspeccionar"}
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
            {
              (confirmAction === "queue") &&
              (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-amber-700 text-sm font-medium">Una vez enviado a la cola, no se podrán realizar cambios.</p>
                  </div>
                </div>
              )
              
            }
            {
              (confirmAction === "inspect") &&
              (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-amber-700 text-sm font-medium">Una vez iniciada la revisión, no se podrán realizar cambios.</p>
                  </div>
                </div>
              )
            }

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
                      if (ok) setStep(4);
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
