// app/workshops/[id]/users/page.tsx  (extracto)
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";

export default function SearchEmailBar({ workshopId }: { workshopId: number }) {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const go = () => {
    if (!email.trim()) return;
    router.push(`/dashboard/${workshopId}/users/create-user?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <div className="flex flex-row gap-3 sm:gap-3 w-full sm:max-w-2xl sm:mx-auto justify-center">
      {/* Wrapper del input más grande y con grow */}
      <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-4 sm:px-3 md:px-4 h-14 sm:h-12 md:h-14 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
        <Search size={20} className="text-gray-500 mr-3 flex-shrink-0 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
        <input
          type="email"
          placeholder="Agregar usuario"
          className="w-full text-base sm:text-sm md:text-base focus:outline-none bg-transparent placeholder:text-gray-400 placeholder:text-base sm:placeholder:text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          aria-label="Email del usuario"
        />
      </div>

      <button
        onClick={go}
        className="bg-[#0040B8] hover:bg-[#0035A0] active:bg-[#002F8F] text-white px-4 sm:px-4 md:px-5 py-3 sm:py-2.5 md:py-3 rounded-[4px] flex items-center justify-center transition-colors duration-200 font-medium text-base sm:text-sm md:text-base h-14 sm:h-12 md:h-14 flex-shrink-0 min-w-[56px]"
      >
        <ArrowRight size={20} strokeWidth={2.5} className="sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" />
        <span className="hidden sm:inline-flex sm:items-center sm:gap-2 sm:ml-2">
          Crear Usuario
        </span>
      </button>
    </div>
  );
}
