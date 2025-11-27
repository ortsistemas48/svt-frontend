"use client";

import QueueTable from "@/components/QueueTable";
import { ChevronRight, Search, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function QueuePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    // La búsqueda se pasará al componente QueueTable
  };

  return (
    <div className="">
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-4 md:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Cola de Revisiones</span>
          </div>
        </article>

        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Cola de Revisiones
          </h2> 
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Aquí podrás iniciar las revisiones que se encuentren en la cola.
          </p>
        </div>

        {/* Barra de búsqueda para mobile */}
        <div className="sm:hidden mb-4 mx-1">
          <div className="flex flex-row gap-3 w-full justify-center">
            <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-3 h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
              <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar revisiones"
                className="w-full text-sm focus:outline-none bg-transparent placeholder:text-gray-400 placeholder:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                aria-label="Buscar revisiones"
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

        {/* Queue Table */}
        <div className="overflow-hidden">
          <QueueTable externalSearchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}