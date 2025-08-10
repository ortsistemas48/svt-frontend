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
    <div className="grid grid-cols-[500px_50px] gap-x-3 mt-6">
      <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-12">
        <Search size={20} className="text-gray-500 mr-1" />
        <input
          type="email"
          placeholder="Ingrese el mail del usuario para crear la cuenta"
          className="flex-1 text-sm focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
      </div>
      <button onClick={go} className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center">
        <ArrowRight size={30} strokeWidth={3} className="p-1" />
      </button>
    </div>
  );
}
