// app/dashboard/[id]/reasign-oblea/page.tsx (o la ruta que corresponda)
"use client";

import CarInfo from "@/components/CarInfo";
import SearchPlateBar from "@/components/SeachPlateBar";
import { ChevronRight } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";

export default function ReasignObleaPage() {
  // ✅ hooks de cliente
  const { id } = useParams<{ id: string }>();
  const workshopId = Number(id);

  const searchParams = useSearchParams();
  const licencePlate = searchParams.get("licence_plate") ?? "";

  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Reasignación de Oblea</span>
        </div>
      </article>

      <div className="min-h-[40vh] flex flex-col items-center justify-center mt-14">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl text-[#0040B8]">Reasigna tus Obleas</h2>
          <p className="text-gray-500 text-center">
            Busca el dominio del auto para reasignar la oblea
          </p>

          {/* Podés usar `email` si lo necesitás como prop */}
          <SearchPlateBar workshopId={workshopId} />
        </div>
      { licencePlate && <CarInfo licence_plate={licencePlate} />}
      </div>

        
    </div>
  );
}
