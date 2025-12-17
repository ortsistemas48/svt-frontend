'use client';

import { useEffect, useMemo, useState, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams } from 'next/navigation'
import { getMissingCarFields, getMissingPersonFields, markStickerAsUsed } from "@/utils";
import MissingDataModal from "../MissingDataModal";
import { useApplication } from "@/context/ApplicationContext";
import { ApplicationSkeleton } from "../ApplicationSkeleton";

const PersonForm = dynamic(() => import("@/components/PersonForm"), { 
  ssr: false,
  loading: () => <ApplicationSkeleton />
});
const VehicleForm = dynamic(() => import("@/components/VehicleForm"), { 
  ssr: false,
  loading: () => <ApplicationSkeleton />
});
const ConfirmationForm = dynamic(() => import("@/components/ConfirmationForm"), { 
  ssr: false,
  loading: () => <ApplicationSkeleton />
});
const StickerStep = dynamic(() => import("@/components/StickerStep"), { 
  ssr: false,
  loading: () => <ApplicationSkeleton />
});
// tipos de VehicleDocsDropzone ya no requieren items tipados

type Props = {
  applicationId: string;
  initialData?: {
    owner?: any;
    driver?: any;
    car?: any;
    documents?: Doc[];
    documents_by_role?: {
      owner?: Doc[];
      driver?: Doc[];
      car?: Doc[];
      generic?: Doc[];
    };
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
  
  // Usar refs para valores que no necesitan causar re-renders pero se usan en callbacks
  const ownerRef = useRef<any>({});
  const driverRef = useRef<any>({});
  const carRef = useRef<any>({});
  const isSamePersonRef = useRef(true);
  const pendingOwnerDocsRef = useRef<File[]>([]);
  const pendingDriverDocsRef = useRef<File[]>([]);
  const pendingCarDocsRef = useRef<File[]>([]);
  const hasBlockingErrors = useMemo(() => (step === 1 || step === 2) && Object.values(errors ?? {}).some(Boolean), [errors, step]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMissingDataModal, setShowMissingDataModal] = useState(false);
  const [pendingOwnerDocs, setPendingOwnerDocs] = useState<File[]>([]);
  const [pendingDriverDocs, setPendingDriverDocs] = useState<File[]>([]);
  const [existingDocsByRole, setExistingDocsByRole] = useState<{
    owner: Doc[]; driver: Doc[]; car: Doc[]; generic: Doc[];
  }>({ owner: [], driver: [], car: [], generic: [] });
  const [confirmAction, setConfirmAction] = useState<"inspect" | "queue" | "confirm_car" | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
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

  const [pendingCarDocs, setPendingCarDocs] = useState<File[]>([]);
  const [vehicleDocsCount, setVehicleDocsCount] = useState(0);
  
  // Sincronizar refs con estados para uso en callbacks (después de todas las declaraciones)
  useEffect(() => {
    ownerRef.current = owner;
    driverRef.current = driver;
    carRef.current = car;
    isSamePersonRef.current = isSamePerson;
    pendingOwnerDocsRef.current = pendingOwnerDocs;
    pendingDriverDocsRef.current = pendingDriverDocs;
    pendingCarDocsRef.current = pendingCarDocs;
  }, [owner, driver, car, isSamePerson, pendingOwnerDocs, pendingDriverDocs, pendingCarDocs]);

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

  const uploadPendingVehicleDocuments = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return [] as any[];
    // reuso el uploader genérico pero con rol 'car'
    return await uploadPendingDocuments(files, 'car');
  }, [uploadPendingDocuments]);

  useEffect(() => {
    // Si recibimos datos iniciales completos desde la página, inicializamos estados y evitamos refetch
    // Verificamos que tenga al menos owner, driver o car, y documents o documents_by_role
    const hasInitialData = initialData && (initialData.owner || initialData.driver || initialData.car);
    const hasDocuments = initialData && (initialData.documents || initialData.documents_by_role);
    
    if (hasInitialData) {
      setOwner({ ...(initialData.owner || {}) });
      if (initialData.driver?.is_owner || (initialData.owner?.id && initialData.driver?.id && initialData.driver.id === initialData.owner.id)) {
        setIsSamePerson(true);
        setDriver({ ...(initialData.owner || {}), is_owner: true });
      } else {
        setIsSamePerson(false);
        setDriver({ ...(initialData.driver || {}) });
      }
      setCar({ ...(initialData.car || {}) });
      
      // Inicializar documentos si están disponibles
      if (hasDocuments) {
        const byRole = initialData.documents_by_role ?? {
          owner: (initialData.documents || []).filter((d: Doc) => d.role === "owner"),
          driver: (initialData.documents || []).filter((d: Doc) => d.role === "driver"),
          car: (initialData.documents || []).filter((d: Doc) => d.role === "car"),
          generic: (initialData.documents || []).filter(
            (d: Doc) => !["owner", "driver", "car"].includes(d.role)
          ),
        };
        setExistingDocsByRole({
          owner: byRole.owner || [],
          driver: byRole.driver || [],
          car: byRole.car || [],
          generic: byRole.generic || [],
        });
      }
      
      setMissingFields([]);
      setIsInitializing(false);
      return;
    }

    // Solo hacer fetch si no tenemos datos iniciales
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
    const currentCar = carRef.current;
    if (!currentCar?.license_plate) return true; // nada que guardar, seguimos

    const payload = {
      license_plate: currentCar.license_plate,
      // si ya hay oblea seleccionada, guardamos su id
      sticker_id: currentCar?.sticker?.id ?? currentCar?.sticker_id ?? null,
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
  }, [applicationId]);

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
    const currentCar = carRef.current;
    const currentPendingCarDocs = pendingCarDocsRef.current;
    
    const missing = getMissingCarFields(currentCar);
    if (missing.length > 0) {
      setMissingFields(prev => [...prev, ...missing.map(f => `Vehículo: ${f}`)]);
      setShowMissingDataModal(true);
      return false;
    }

    const stickerId = currentCar?.sticker?.id ?? currentCar?.sticker_id;
    if (stickerId) {
      try { await markStickerAsUsed(stickerId); } catch (e) { console.error(e); }
    }

    const res = await fetch(`/api/applications/${applicationId}/car`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_plate: currentCar.license_plate,
        brand: currentCar.brand,
        model: currentCar.model,
        manufacture_year: currentCar.manufacture_year,
        registration_year: currentCar.registration_year,
        type_ced: currentCar.type_ced,
        weight: currentCar.weight,
        fuel_type: currentCar.fuel_type,
        vehicle_type: currentCar.vehicle_type,
        usage_type: currentCar.usage_type,
        engine_brand: currentCar.engine_brand,
        engine_number: currentCar.engine_number,
        chassis_number: currentCar.chassis_number,
        chassis_brand: currentCar.chassis_brand,
        green_card_number: currentCar.green_card_number,
        green_card_no_expiration: currentCar.green_card_no_expiration,
        green_card_expiration: currentCar.green_card_expiration,
        license_number: currentCar.license_number,
        license_expiration: currentCar.license_expiration,
        license_class: currentCar.license_class,
        insurance: currentCar.insurance,
        sticker_id: currentCar.sticker_id,
        total_weight: currentCar.total_weight,
        front_weight: currentCar.front_weight,
        back_weight: currentCar.back_weight,
      }),
    });

    if (!res.ok) throw new Error("Error al guardar el vehículo");

     if (currentPendingCarDocs.length > 0) {
       try {
         const up = await uploadPendingVehicleDocuments(currentPendingCarDocs);
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
    uploadPendingVehicleDocuments,   
  ]);

  const handleNext = useCallback(async () => {
    setLoading(true);
    setMissingFields([]);

    try {
      // Usar valores actuales de refs para evitar dependencias innecesarias
      const currentOwner = ownerRef.current;
      const currentDriver = driverRef.current;
      const currentCar = carRef.current;
      const currentIsSamePerson = isSamePersonRef.current;
      const currentPendingOwnerDocs = pendingOwnerDocsRef.current;
      const currentPendingDriverDocs = pendingDriverDocsRef.current;
      const currentPendingCarDocs = pendingCarDocsRef.current;

      let res;
      if (step === 1) {
        const missingAll: string[] = [];
        const ownerMissing = getMissingPersonFields(currentOwner);
        const driverMissing = currentIsSamePerson ? [] : getMissingPersonFields(currentDriver);
        if (ownerMissing.length) missingAll.push(...ownerMissing.map(f => `Titular: ${f}`));
        if (driverMissing.length) missingAll.push(...driverMissing.map(f => `Conductor: ${f}`));
        if (missingAll.length) {
          setMissingFields(missingAll);
          setShowMissingDataModal(true);
          setLoading(false);
          return;
        }

        // Guardar titular
        // Convertir strings vacíos a null para campos opcionales
        res = await fetch(`/api/applications/${applicationId}/owner`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: currentOwner.first_name?.trim() || null,
            last_name: currentOwner.last_name?.trim() || null,
            dni: currentOwner.dni?.trim() || null,
            cuit: currentOwner.cuit?.trim() || null,
            razon_social: currentOwner.razon_social?.trim() || null,
            phone: currentOwner.phone_number?.trim() || null,
            email: currentOwner.email?.trim() || null,
            province: currentOwner.province?.trim() || null,
            city: currentOwner.city?.trim() || null,
            address: currentOwner.street?.trim() || null,
            is_same_person: currentDriver?.is_owner || false,
          }),
        });
        if (!res.ok) throw new Error("Error al guardar el titular");

        // Guardar conductor
        if (currentDriver?.is_owner === true) {
          res = await fetch(`/api/applications/${applicationId}/driver`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_same_person: true }),
          });
        } else {
          // Convertir strings vacíos a null para campos opcionales
          res = await fetch(`/api/applications/${applicationId}/driver`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: currentDriver.first_name?.trim() || null,
              last_name: currentDriver.last_name?.trim() || null,
              dni: currentDriver.dni?.trim() || null,
              cuit: currentDriver.cuit?.trim() || null,
              razon_social: currentDriver.razon_social?.trim() || null,
              phone: currentDriver.phone_number?.trim() || null,
              email: currentDriver.email?.trim() || null,
              province: currentDriver.province?.trim() || null,
              city: currentDriver.city?.trim() || null,
              address: currentDriver.street?.trim() || null,
              is_same_person: false,
            }),
          });
        }

        // Subir docs pendientes
        const uploadedDocs: any[] = [];
        if (currentIsSamePerson) {
          if (currentPendingOwnerDocs.length > 0 || currentPendingDriverDocs.length > 0) {
            const merged = [...currentPendingOwnerDocs, ...currentPendingDriverDocs];
            const up = await uploadPendingDocuments(merged, 'owner');
            uploadedDocs.push(...up);
          }
        } else {
          const promises: Promise<any[]>[] = [];
          if (currentPendingOwnerDocs.length > 0) promises.push(uploadPendingDocuments(currentPendingOwnerDocs, 'owner'));
          if (currentPendingDriverDocs.length > 0) promises.push(uploadPendingDocuments(currentPendingDriverDocs, 'driver'));
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
        const missing = getMissingCarFields(currentCar);
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
  }, [step, applicationId, uploadPendingDocuments, router, id, consumeSlot, saveStickerStep]);

  const handlePrev = useCallback(() => {
    setIsIdle(false)
    if (step > 1) setStep(step - 1);
  }, [setIsIdle, step]);

  // Optimizar renderStepContent: separar por step para evitar recálculos innecesarios
  const step1Content = useMemo(() => (
    <Suspense fallback={<ApplicationSkeleton />}>
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
    </Suspense>
  ), [
    owner,
    driver,
    applicationId,
    isSamePerson,
    existingDocsByRole.owner,
    existingDocsByRole.driver,
    onDeleteOwnerDoc,
    onDeleteDriverDoc,
    // setOwner, setDriver, setIsSamePerson, setPendingOwnerDocs, setPendingDriverDocs son estables
  ]);

  const step2Content = useMemo(() => (
    <Suspense fallback={<ApplicationSkeleton />}>
      <StickerStep
        workshopId={Number(id)}
        car={car}
        setCar={setCar}
      />
    </Suspense>
  ), [id, car]); // setCar es estable

  const step3Content = useMemo(() => (
    <Suspense fallback={<ApplicationSkeleton />}>
      <VehicleForm
        car={car}
        setCar={setCar}
        onPendingCarDocsChange={setPendingCarDocs}
        existingCarDocs={existingDocsByRole.car as any}
        onDeleteCarDoc={onDeleteCarDoc}
        onVehicleDocsCountChange={setVehicleDocsCount}
        ownerDni={owner?.dni}
      />
    </Suspense>
  ), [car, existingDocsByRole.car, onDeleteCarDoc, owner?.dni]); // setCar, setPendingCarDocs, setVehicleDocsCount son estables

  const step4Content = useMemo(() => (
    <Suspense fallback={<ApplicationSkeleton />}>
      <ConfirmationForm applicationId={applicationId} />
    </Suspense>
  ), [applicationId]);

  const renderStepContent = useMemo(() => {
    switch (step) {
      case 1:
        return step1Content;
      case 2:
        return step2Content;
      case 3:
        return step3Content;
      case 4:
        return step4Content;
      default:
        return null;
    }
  }, [step, step1Content, step2Content, step3Content, step4Content]);


  if (isInitializing) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <ApplicationSkeleton />
      </div>
    );
  }

  return (
    <>
      <article className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 items-start sm:items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2 md:px-4">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-gray-600">Inicio</span>
          <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="text-[#0040B8]">Revisiones</span>
          <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="font-bold">{applicationId}</span>
        </div>
        <span className="text-xs sm:text-sm md:text-base text-black">Paso {step}/4</span>
      </article>

      <div>{renderStepContent}</div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center px-1 sm:px-2 md:px-4 pt-6 sm:pt-8 pb-6 sm:pb-10">
        {step !== 1 && (
          <button
            onClick={handlePrev}
            disabled={loading}
            className="w-full sm:w-auto hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-xs sm:text-sm text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2 sm:py-2.5 px-4 sm:px-5"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            Volver
          </button>
        )}
        {step !== 4 && !isIdle && (
          <button
            onClick={handleNext}
            disabled={loading || hasBlockingErrors || (step === 3 && vehicleDocsCount < 1)}
            className="w-full sm:w-auto hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-xs sm:text-sm text-white bg-[#0040B8] flex items-center justify-center py-2 sm:py-2.5 px-4 sm:px-5 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Continuar"}
          </button>
        )}
        {step === 4 && (
          <>
            <button
              disabled={loading || processingAction}
              onClick={() => {
                setConfirmAction("queue");
                setShowConfirmModal(true);
              }}
              className="w-full sm:w-auto hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-xs sm:text-sm text-white bg-[#0040B8] flex items-center justify-center py-2 sm:py-2.5 px-4 sm:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar a cola
            </button>
            <button
              disabled={loading || processingAction}
              onClick={() => {
                setConfirmAction("inspect");
                setShowConfirmModal(true);
              }}
              className="w-full sm:w-auto hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-xs sm:text-sm text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2 sm:py-2.5 px-4 sm:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Inspeccionar"}
            </button>
          </>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-[14px] max-w-md w-full p-4 sm:p-5 md:p-6 max-h-[90vh] overflow-y-auto">
            {/* Título y cuerpo del modal según acción */}
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
              {confirmAction === "confirm_car" ? "¿Estás seguro?" : "¿Estás seguro?"}
            </h2>

            <p className="text-sm sm:text-base mb-3 sm:mb-4">
              {confirmAction === "confirm_car"
                ? "Estás por confirmar los datos de tu vehículo. ¿Deseás continuar?"
                : "Vas a confirmar el trámite. ¿Deseás continuar?"}
            </p>
            {
              (confirmAction === "queue") &&
              (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-[14px]">
                  <div className="flex items-start gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-amber-700 text-xs sm:text-sm font-medium">Una vez enviado a la cola, no se podrán realizar cambios.</p>
                  </div>
                </div>
              )
              
            }
            {
              (confirmAction === "inspect") &&
              (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-[14px]">
                  <div className="flex items-start gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-amber-700 text-xs sm:text-sm font-medium">Una vez iniciada la revisión, no se podrán realizar cambios.</p>
                  </div>
                </div>
              )
            }

            {processingAction && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-[14px]">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-[#0040B8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-[#0040B8] text-xs sm:text-sm font-medium">
                    {confirmAction === "queue" ? "Enviando a cola..." : confirmAction === "inspect" ? "Procesando..." : "Guardando..."}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-5 mt-4 sm:mt-5">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setProcessingAction(false);
                }}
                disabled={processingAction}
                className="w-full sm:w-auto bg-white border border-[#d91e1e] text-[#d91e1e] duration-150 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-[4px] hover:text-white hover:bg-[#d91e1e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setProcessingAction(true);

                  if (confirmAction === "confirm_car") {
                    try {
                      setLoading(true);
                      const ok = await saveVehicle();
                      if (ok) {
                        setStep(4);
                        setShowConfirmModal(false);
                      }
                    } catch (e) {
                      console.error(e);
                      alert("Hubo un error al guardar los datos del vehículo.");
                    } finally {
                      setLoading(false);
                      setProcessingAction(false);
                    }
                    return;
                  }

                  if (confirmAction === "inspect") {
                    try {
                      await consumeSlot();
                      router.push(`/dashboard/${id}/inspections/${applicationId}`);
                    } catch (e) {
                      console.error(e);
                      alert("Hubo un error al iniciar la inspección.");
                      setProcessingAction(false);
                    }
                    return;
                  }

                  if (confirmAction === "queue") {
                    try {
                      await sendToQueue();
                    } catch (e) {
                      console.error(e);
                      alert("Hubo un error al enviar a la cola.");
                      setProcessingAction(false);
                    }
                    return;
                  }
                }}
                disabled={processingAction}
                className="w-full sm:w-auto bg-[#0040B8] text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-[4px] hover:bg-[#0032a0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingAction ? "Procesando..." : "Confirmar"}
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
