"use client";

import { ChevronRight, ScrollText, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import StickerOrdersTable from "@/components/StickerOrdersTable";

export default function BuyObleaPage() {
  const params = useParams();
  const id = params.id as string;
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    // La búsqueda se pasará al componente StickerOrdersTable
    // Necesitamos pasar el searchQuery como prop o usar un contexto
    // Por ahora, lo dejamos como estado local que se puede pasar
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

        <section className="bg-white rounded-lg border-gray-300 border p-3 sm:p-4 md:p-6 sm:px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 mx-1 sm:mx-0">
          <div>
            <h2 className="text-[#0040B8] text-base sm:text-lg mb-0">Obleas</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Aquí podrás asignar y ver todas tus obleas</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-0 w-full sm:w-auto">
            <Link
              href={`/dashboard/${id}/stickers/all`}
              className="border border-[#0040B8] text-[#0040B8] bg-white hover:bg-[#f0f6ff] font-medium rounded px-4 py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center transition"
            >
              <ScrollText size={16} className="mr-2" />
              Mis obleas
            </Link>

            <Link
              href={`/dashboard/${id}/stickers/assign-stickers`}
              className="bg-[#0040B8] hover:bg-[#003080] text-white font-medium rounded px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center transition"
            >
              Asignar
              <ChevronRight size={16} className="ml-2" />
            </Link>
          </div>
        </section>

        {/* Barra de búsqueda para obleas - Solo visible en mobile */}
        <div className="sm:hidden mb-4 mx-1">
          <div className="flex flex-row gap-3 w-full justify-center">
            <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-3 h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
              <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar obleas"
                className="w-full text-sm focus:outline-none bg-transparent placeholder:text-gray-400 placeholder:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                aria-label="Buscar obleas"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#0040B8] hover:bg-[#0035A0] active:bg-[#002F8F] text-white px-3 py-3 rounded-[4px] flex items-center justify-center transition-colors duration-200 font-medium text-sm h-12 flex-shrink-0 min-w-[80px]"
            >
              <span>Buscar</span>
            </button>
          </div>
        </div>

        <StickerOrdersTable externalSearchQuery={searchQuery} />
      </div>
    </div>
  );
}
