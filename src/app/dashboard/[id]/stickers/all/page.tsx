"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import AllStickersTable from "@/components/AllStickersTable";


export default function BuyObleaPage() {
  const router = useRouter();

  return (
    <div>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Obleas</span>
          </div>
        </article>

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Obleas de tu taller
          </h2> 
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Aquí podrás ver y gestionar todo el stock de obleas en tu taller.
          </p>
        </div>

        <AllStickersTable />

        <div className="mt-8 flex justify-start">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-[4px] border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
