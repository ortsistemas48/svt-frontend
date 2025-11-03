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
    <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full justify-center">
      {/* Wrapper del input más grande y con grow */}
      <div className="flex-1 w-full flex items-center border border-gray-300 rounded-[4px] px-4 h-14 sm:h-14 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
        <Search size={20} className="text-gray-500 mr-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Ingrese el dominio que desea buscar"
          className="w-full text-base sm:text-md focus:outline-none bg-transparent placeholder:text-gray-400"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          aria-label="Dominio del legajo"
        />
      </div>

      <button
        onClick={handleSearch}
        className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-5 py-3 rounded-[4px] flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-base min-h-[56px]"
      >
        <ArrowRight size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
