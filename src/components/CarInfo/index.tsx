"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Car = {
  id: number;
  license_plate: string;
  brand?: string;
  model?: string;
  usage_type?: string;
  chassis_number?: string;
  engine_number?: string;
  manufacture_year?: number | string;
};
const carInfo = [
  {
    name: "license_plate",
    label: "Dominio"
  },
  {
    name: "brand",
    label: "Marca"
  },
  {
    name: "model",
    label: "Modelo"
  },
  {
    name: "manufacture_year",
    label: "Año"
  },
  {
    name: "usage_type",
    label: "Uso"
  },
  {
    name: "chassis_number",
    label: "Chasis"
  },
  {
    name: "engine_number",
    label: "Motor"
  },
]
export default function CarInfo({ licence_plate }: { licence_plate: string }) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!licence_plate) {
      setCar(null);
      setError("");
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        setCar(null);

        const plate = encodeURIComponent(licence_plate.trim().toUpperCase());
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles/get-vehicle-data/${plate}`,
          { credentials: "include", signal: controller.signal }
        );

        if (res.status === 404) {
          setError("No se encontró ningún vehículo con esa patente.");
          return;
        }
        if (!res.ok) {
          setError("Ocurrió un error al cargar los datos del vehículo.");
          return;
        }

        const data = (await res.json()) as Car;
        setCar(data);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching car data:", err);
          setError("No se pudo conectar con el servidor.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [licence_plate]);

  const handleCancel = () => {
    setError("");
    setCar(null);

    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    sp.delete("licence_plate");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleChangeRoute = () => {
    if (!car) return;

    router.push(`${pathname}/${car.license_plate}`);
  };
  return (
    <div className="mt-8 w-full max-w-2xl">
      
      {/* Loading */}
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-gray-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          Cargando…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="py-3 px-4 border-2 border-red-300 text-red-600 font-bold rounded-2xl text-center">{error}</p>
      )}

      {/* Datos */}
      {!loading && !error && car && (
        <div className="flex flex-col gap-y-2">
          <div className="p-4 border border-gray-300 rounded">
            <h3 className="text-xl font-bold mb-4 text-center">Datos del Auto</h3>
            <div className="grid grid-cols-1  sm:grid-cols-3 gap-x-8 gap-y-6">
              {carInfo.map((info) => (
                <div
                  key={info.name}
                  className="w-full min-h-[56px] flex flex-col items-center text-center max-md:text-sm"
                >
                  <span className="text-gray-500 text-lg">{info.label}</span>
                  <span className="mt-1 font-medium break-all">
                    {String(car[info.name as keyof Car] ?? "-")}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-4 items-center justify-center">
            <button
              disabled={loading}
              onClick={handleCancel}
              className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-5 w-36"
            >
              <ChevronLeft size={18} />
              Cancelar
            </button>
            <button
              onClick={handleChangeRoute}
              disabled={loading}
              className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-5 w-36"
            >
              Confirmar
            </button>
          </div>
        </div>

      )}

      {/* Estado vacío */}
      {!loading && !error && !car && licence_plate.trim() === "" && (
        <p className="text-gray-500">Ingresá una patente para ver la información.</p>
      )}
    </div>
  );
}
