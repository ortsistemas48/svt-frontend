'use client'
import { useEffect, useState } from "react";
import { CarType, PersonType } from "@/app/types";
import renderVehicle from "../VehicleTable";
import renderPerson from "../PersonTable";

interface ConfirmationFormProps {
  applicationId: string;
}
export default function ConfirmationForm({ applicationId }: ConfirmationFormProps) {
  const [car, setCar] = useState<CarType | null>(null);
  const [owner, setOwner] = useState<PersonType | null>(null);
  const [driver, setDriver] = useState<PersonType | null>(null);
  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${applicationId}/data`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error al traer la aplicación:", text);
        return;
      }
      const data = await res.json();
      console.log(data);
      setCar(data.car || null);
      setOwner(data.owner || null);
      if ( data.owner?.id === data.driver?.id ) {
        setDriver(null);
      } else {
      setDriver(data.driver || null);
      }
    }
    fetchData();
  }, []);

  const isSamePerson = owner && driver && owner.id === driver.id;
  // const isSamePerson = false
  const showDriver = driver && !isSamePerson;
  return (
    <div className="">
      <div className={`grid max-lg:grid-cols-1 ${showDriver ? "grid-cols-2" : "grid-cols-1"} gap-y-8`}>
        {/* Titular */}
        <div className="px-4 ">
          <h2 className="max-md:text-base font-regular mb-5 text-xl text-[#000000]">Datos del titular</h2>
          {owner ? renderPerson(owner) : <span>Cargando titular...</span>}
        </div>

        {/* Conductor (si es distinto) */}
        {showDriver && (
          <div className="px-4">
            <h2 className="max-md:text-base font-regular mb-5 text-xl text-[#000000]">Datos del conductor</h2>
            {renderPerson(driver)}
          </div>
        )}

        {/* Vehículo */}
        <div className={`xl:col-span-2 px-6`}>
          <h2 className="max-md:text-base font-regular mb-8 text-xl text-[#000000]">Datos del vehículo</h2>
          {car ? renderVehicle(car) : <span>Cargando vehículo...</span>}
        </div>
      </div>
    </div>
  );
}
