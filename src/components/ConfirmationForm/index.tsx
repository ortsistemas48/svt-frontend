'use client'
import { useEffect, useState } from "react";
import { CarType, PersonType } from "@/app/types";
import renderVehicle from "../VehicleTable";
import renderPerson from "../PersonTable";
import { Car } from "lucide-react";

type Doc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  role?: "owner" | "driver" | "car" | "generic";
  created_at?: string;
};

interface ConfirmationFormProps {
  applicationId: string;
}

export default function ConfirmationForm({ applicationId }: ConfirmationFormProps) {
  const [car, setCar] = useState<CarType | null>(null);
  const [owner, setOwner] = useState<PersonType | null>(null);
  const [driver, setDriver] = useState<PersonType | null>(null);

  const [ownerDocs, setOwnerDocs] = useState<Doc[]>([]);
  const [driverDocs, setDriverDocs] = useState<Doc[]>([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/applications/${applicationId}/data`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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

      // si owner y driver son la misma persona, ocultamos driver
      if (data.owner?.id === data.driver?.id) {
        setDriver(null);
      } else {
        setDriver(data.driver || null);
      }

      // documentos por rol
      const byRole = data.documents_by_role || {};
      const allDocs: Doc[] = data.documents || [];

      setOwnerDocs(byRole.owner ?? allDocs.filter((d: Doc) => d.role === "owner"));
      setDriverDocs(byRole.driver ?? allDocs.filter((d: Doc) => d.role === "driver"));
    }

    fetchData();
  }, [applicationId]);

  const isSamePerson = !!(owner && driver && owner.id === driver.id);
  const showDriver = !!(driver && !isSamePerson);

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-8xl mx-auto px-4">
        {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmación la Revisión</h1>
            <p className="text-gray-600 text-sm">Revisa los datos del titular, conductor y vehículo</p>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-amber-700 text-sm font-medium">Una vez enviado a la cola, no se podrán realizar cambios.</p>
              </div>
            </div>
          </div>

        <div className={`grid gap-6 ${showDriver ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          {/* Titular */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Datos del Titular</h2>
                  <p className="text-sm text-gray-600">Información personal y documentos</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {owner ? renderPerson(owner, ownerDocs) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500">Cargando titular...</span>
                </div>
              )}
            </div>
          </div>

          {/* Conductor (si es distinto) */}
          {showDriver && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Datos del Conductor</h2>
                    <p className="text-sm text-gray-600">Información personal y documentos</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {renderPerson(driver!, driverDocs)}
              </div>
            </div>
          )}

          {/* Vehículo */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${showDriver ? "lg:col-span-2" : "lg:col-span-1"}`}>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-purple-500" size={20} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Datos del Vehículo</h2>
                  <p className="text-sm text-gray-600">Información técnica y documentación</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {car ? renderVehicle(car) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-500">Cargando vehículo...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
