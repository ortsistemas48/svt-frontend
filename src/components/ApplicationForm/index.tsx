'use client';

import { useEffect, useState } from "react";
import PersonForm from "@/components/PersonForm";
import VehicleForm from "@/components/VehicleForm";
import ConfirmationForm from "@/components/ConfirmationForm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams } from 'next/navigation'
import { getMissingCarFields, getMissingPersonFields } from "@/utils";
import MissingDataModal from "../MissingDataModal";
import { useApplication } from "@/context/ApplicationContext";

type Props = {
  applicationId: string;
  initialData?: {
    owner?: any;
    driver?: any;
    car?: any;
  };
};


export default function ApplicationForm({ applicationId, initialData }: Props) {
  const { isIdle, setIsIdle } = useApplication();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMissingDataModal, setShowMissingDataModal] = useState(false);

  const [confirmAction, setConfirmAction] = useState<"inspect" | "queue" | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  
  const [owner, setOwner] = useState<any>({ ...(initialData?.owner || {}) });
  const [driver, setDriver] = useState<any>({});
  const [isSamePerson, setIsSamePerson] = useState(false);
  const [car, setCar] = useState<any>({ ...(initialData?.car || {}) });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/data`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al obtener los datos");

        const json = await res.json();
        setOwner({ ...(json.owner || {}) });

        if (json.driver?.is_owner || (json.owner?.id && json.driver?.id && json.driver.id === json.owner.id)) {
          setIsSamePerson(true);
          setDriver({ ...(json.owner || {}), is_owner: true });
        } else {
          setIsSamePerson(false);
          setDriver({ ...(json.driver || {}) });
        }
        setCar({ ...(json.car || {}) });
      } catch (err) {
        console.error("Error al cargar los datos:", err);
      }
    };

    fetchData();
    setMissingFields([]);
  }, [step]);

  const sendToQueue = async () => {
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
  };

  const handleNext = async () => {
    setLoading(true);
    setMissingFields([]);

    try {
      let res;
      if (step === 1) {
        if (!isSamePerson) {
          if (getMissingPersonFields(owner).length > 0 || getMissingPersonFields(driver).length > 0) {
            const missing = getMissingPersonFields(owner).map(field => `Titular: ${field}`)
            setMissingFields(e => [...e, ...missing]);

            setShowMissingDataModal(true);
            setLoading(false);

            if (getMissingPersonFields(driver).length > 0) {
              const missing = getMissingPersonFields(driver).map(field => `Conductor: ${field}`)
              setMissingFields(e => [...e, ...missing]);
              setLoading(false);
            }
            return
          }
        }
        else if (getMissingPersonFields(owner).length > 0) {
          const missing = getMissingPersonFields(owner).map(field => `Titular: ${field}`)
          setMissingFields(e => [...e, ...missing]);
          setShowMissingDataModal(true);
          setLoading(false);
          return
        }

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

        if (driver?.is_owner === true) {
          // es la misma persona

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


        if (!res.ok) throw new Error("Error al guardar el conductor");
      }

      // Paso 2: Guardar vehículo
      if (step === 2) {

        if (getMissingCarFields(car).length > 0) {
          const missing = getMissingCarFields(car).map(field => `Vehículo: ${field}`)
          setMissingFields(e => [...e, ...missing]);
          setShowMissingDataModal(true);
          setLoading(false);
          return
        }
        console.log(car)
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/car`, {
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
      }

      // Paso 3: Confirmar trámite
      if (step === 3) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/confirm`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error("Error al confirmar el trámite");
      }

      if (step < 3) setStep(step + 1);
    } catch (error: any) {
      console.error(error);
      alert("Hubo un error al guardar los datos. Revisá los campos o intentá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setIsIdle(false)
    if (step > 1) setStep(step - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <PersonForm
            owner={owner}
            setOwner={setOwner}
            driver={driver}
            setDriver={setDriver}
            isSamePerson={isSamePerson}
            setIsSamePerson={setIsSamePerson}
          />
        );
      case 2:
        return <VehicleForm car={car} setCar={setCar} />;
      case 3:
        return <ConfirmationForm applicationId={applicationId} />;
      default:
        return null;
    }
  };

  return (
    <>
      <article className="flex max-md:flex-col gap-y-2 items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Inspecciones</span>
        </div>
        <span className="text-md mr-4  text-black">Paso {step}/3</span>
      </article>

      <div>{renderStepContent()}</div>

      
        <div className="flex gap-x-3 justify-center px-4 pt-8 pb-10">
          { step !== 1 && (
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
              disabled={loading}
              className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-5"
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
            <h2 className="text-lg font-semibold mb-3">¿Estás seguro?</h2>

            <p className="mb-4">Vas a confirmar el trámite. ¿Deseás continuar?</p>

            <div className="flex justify-center gap-5 mt-5">
              <button onClick={() => setShowConfirmModal(false)} className="bg-white border border-[#d91e1e] text-[#d91e1e] duration-150 px-4 py-2 rounded-[4px] hover:text-white hover:bg-[#d91e1e]">Cancelar</button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  if (confirmAction === "inspect") {
                    await handleNext(); // paso final
                  } else if (confirmAction === "queue") {
                    await sendToQueue();
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
      {
        showMissingDataModal && <MissingDataModal missingFields={missingFields} onClose={setShowMissingDataModal} />
      }
    </>
  );
}
