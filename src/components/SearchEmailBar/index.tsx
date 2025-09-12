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
    <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto w-full justify-center">
      {/* Wrapper del input más grande y con grow */}
      <div className="flex-1 w-full flex items-center border border-gray-300 rounded-lg px-4 h-14 sm:h-14 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
        <Search size={20} className="text-gray-500 mr-3 flex-shrink-0" />
        <input
          type="email"
          placeholder="Ingrese el email del usuario para crear la cuenta"
          className="w-full text-base sm:text-md focus:outline-none bg-transparent placeholder:text-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          aria-label="Email del usuario"
        />
      </div>

      <button
        onClick={go}
        className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-base min-h-[56px]"
      >
        <span className="hidden sm:inline">Crear Usuario</span>
        <ArrowRight size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
