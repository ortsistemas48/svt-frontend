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
  const showBothPersonClassname = driver && !isSamePerson ? "xl:grid-cols-3" : "pr-10";
  return (
    <div>
      <h1 className="text-2xl max-md:text-xl font-bold mb-4">Confirmación de Datos</h1>
      <div className={`grid ${showBothPersonClassname} grid-cols-2 gap-6 max-lg:grid-cols-1`}>

        <div className="border rounded-lg p-4">
          <h1 className="text-lg max-md:text-base font-bold mb-3">Datos del titular</h1>
          {owner ? renderPerson(owner) : <span>Cargando titular...</span>}
        </div>

        {driver && !isSamePerson && (
          <div className="border rounded-lg p-4 ">
            <h1 className="text-lg max-md:text-base font-bold mb-3">Datos del conductor</h1>
            {renderPerson(driver)}
          </div>
        )}

        <div className="border rounded-lg p-4 lg:pb-10">
          <h1 className="text-lg font-bold">Datos del vehículo</h1>
          {car ? renderVehicle(car) : <span>Cargando vehículo...</span>}
        </div>
      </div>
    </div>
  );
}