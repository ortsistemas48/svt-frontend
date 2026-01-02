"use client";

import { ChevronRight, ChevronLeft, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AllStickersTable from "@/components/AllStickersTable";


export default function BuyObleaPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    // La búsqueda se pasará al componente AllStickersTable
  };

  return (
    <div>
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-4 md:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Obleas</span>
          </div>
        </article>

        <div className="text-center mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Obleas de tu taller
          </h2> 
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Aquí podrás ver y gestionar todo el stock de obleas en tu taller.
          </p>
        </div>

        {/* Barra de búsqueda para obleas */}
        <div className="mb-4 sm:mb-6 mx-1 sm:mx-0 sm:hidden">
          <div className="flex flex-row gap-3 w-full sm:max-w-2xl sm:mx-auto justify-center">
            <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-3 sm:px-4 h-12 sm:h-14 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
              <Search size={18} className="text-gray-500 mr-2 flex-shrink-0 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar obleas"
                className="w-full text-sm sm:text-base focus:outline-none bg-transparent placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                aria-label="Buscar obleas"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#0040B8] hover:bg-[#0035A0] active:bg-[#002F8F] text-white px-3 sm:px-5 py-3 rounded-[4px] flex items-center justify-center transition-colors duration-200 font-medium text-sm sm:text-base h-12 sm:h-14 flex-shrink-0 min-w-[80px] sm:min-w-[56px]"
            >
              <span className="sm:hidden">Buscar</span>
              <ArrowRight size={18} strokeWidth={2.5} className="hidden sm:block sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </div>

        <AllStickersTable externalSearchQuery={searchQuery} />

        {/* Botón volver - debajo de la paginación, centrado */}
        <div className="mt-4 sm:mt-6 flex justify-center px-1 sm:px-0">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-gray-300 bg-white px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto min-w-[120px] sm:min-w-[140px]"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
