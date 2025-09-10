// app/workshops/[id]/users/page.tsx  (extracto)
"use client";
import { useRouter, useSearchParams } from "next/navigation";
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
    <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full justify-center">
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 sm:py-3 h-12 sm:h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
        <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
        <input
          type="email"
          placeholder="Ingrese el email del usuario para crear la cuenta"
          className="flex-1 text-sm sm:text-base focus:outline-none bg-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
      </div>
      <button 
        onClick={go} 
        className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-4 py-2 sm:py-3 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-sm sm:text-base min-h-[48px] sm:min-h-[48px]"
      >
        <span className="hidden sm:inline">Crear Usuario</span>
        <ArrowRight size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
