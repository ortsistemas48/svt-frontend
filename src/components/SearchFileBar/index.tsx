// app/workshops/[id]/users/page.tsx  (extracto)
"use client";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";

export default function SearchFileBar({ workshopId, onSearch }: { workshopId: number; onSearch?: (query: string) => void }) {
  const [domain, setDomain] = useState("");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(domain.trim());
    }
  };

  return (
    <div className="flex flex-row gap-3 w-full sm:max-w-2xl sm:mx-auto justify-center">
      {/* Wrapper del input más grande y con grow */}
      <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-3 sm:px-4 h-12 sm:h-14 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
        <Search size={18} className="text-gray-500 mr-2 flex-shrink-0 sm:w-5 sm:h-5" />
        <input
          type="text"
          placeholder="Ingrese el dominio"
          className="w-full text-sm sm:text-base focus:outline-none bg-transparent placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-base"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          aria-label="Dominio del legajo"
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
  );
}
