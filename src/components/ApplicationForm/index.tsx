'use client';

import { useEffect, useState } from "react";
import PersonForm from "@/components/PersonForm";
import VehicleForm from "@/components/VehicleForm";
import ConfirmationForm from "@/components/ConfirmationForm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams  } from 'next/navigation'

type Props = {
  applicationId: string;
  initialData?: {
    owner?: any;
    driver?: any;
    car?: any;
  };
};  

const FIELD_LABELS: Record<string, string> = {
  first_name: "Nombre",
  last_name: "Apellido",
  dni: "DNI",
  phone_number: "Teléfono",
  email: "Email",
  province: "Provincia",
  city: "Ciudad",
  street: "Dirección",
  license_plate: "Patente",
  brand: "Marca",
  model: "Modelo",
  manufacture_year: "Año",
  weight: "Peso",
  fuel_type: "Tipo de combustible",
  vehicle_type: "Tipo de vehículo",
  usage_type: "Tipo de uso",
  engine_brand: "Marca de motor",
  engine_number: "Número de motor",
  chassis_number: "Número de chasis",
  chassis_brand: "Marca de chasis",
  green_card_number: "Nº de cédula verde",
  green_card_expiration: "Vencimiento de cédula verde",
  license_number: "Número de licencia",
  license_expiration: "Vencimiento de licencia",
};

export default function ApplicationForm({ applicationId, initialData }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const params = useParams()
  const id = params.id 
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"inspect" | "queue" | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [owner, setOwner] = useState<any>({ ...(initialData?.owner || {}) });
  const [driver, setDriver] = useState<any>({});
  const [isSamePerson, setIsSamePerson] = useState(false);
  const [car, setCar] = useState<any>({ ...(initialData?.car || {}) });

  const validateMissingFields = () => {
    const requiredFields = {
      owner: ["first_name", "last_name", "dni", "phone_number", "email", "province", "city", "street"],
      car: ["license_plate", "brand", "model", "manufacture_year", "weight", "fuel_type", "vehicle_type"],
    };

    const missing: string[] = [];

    for (const key in requiredFields.owner) {
      const field = requiredFields.owner[key];
      if (!owner?.[field]) missing.push(`Titular: ${field}`);
    }

    if (!isSamePerson) {
      for (const key in requiredFields.owner) {
        const field = requiredFields.owner[key];
        if (!driver?.[field]) missing.push(`Conductor: ${field}`);
      }
    }

    for (const key in requiredFields.car) {
      const field = requiredFields.car[key];
      if (!car?.[field]) missing.push(`Vehículo: ${field}`);
    }

    return missing;
  };

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
        console.log(json, 'json')
        setCar({ ...(json.car || {}) });
      } catch (err) {
        console.error("Error al cargar los datos:", err);
      }
    };

    fetchData();
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

    try {
      let res;

      // Paso 1: Guardar titular y conductor
      if (step === 1) {
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
        return <ConfirmationForm applicationId={applicationId}/>;
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
        <button
          onClick={handlePrev}
          disabled={loading}
          className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-5"
        >
          <ChevronLeft size={18} />
          Volver
        </button>
        {step !== 3 && (
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
                  const missing = validateMissingFields();
                  setMissingFields(missing);
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
                  const missing = validateMissingFields();
                  console.log(missing, 'missing')
                  setMissingFields(missing);
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
            {missingFields.length > 0 ? (
              <div className="text-sm text-red-600 mb-4">
                Faltan campos por completar:
                <ul className="list-disc list-inside mt-2">
                  {missingFields.map((field, i) => (
                    <li key={i}>
                      {(() => {
                        const [section, rawField] = field.split(":").map(s => s.trim());
                        const label = FIELD_LABELS[rawField] || rawField;
                        return `${section}: ${label}`;
                      })()}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">¿Deseás continuar de todas formas?</p>
              </div>
            ) : (
              <p className="mb-4">Vas a confirmar el trámite. ¿Deseás continuar?</p>
            )}
            <div className="flex justify-center gap-5 mt-10">
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

    </>
  );
}
