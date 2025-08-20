// app/workshops/[id]/users/page.tsx  (extracto)
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";

export default function SearchEmailBar() {
  const [licencePlate, setLicencePlate] = useState("");
  const router = useRouter();

//   const go = () => {
//     if (!email.trim()) return;
//     router.push(`/dashboard/${workshopId}/users/create-user?email=${encodeURIComponent(email.trim())}`);
//   };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicencePlate(e.target.value.toUpperCase());
  };
  return (
    <div className="grid grid-cols-[500px_50px] gap-x-3 mt-6">
      <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-12">
        <Search size={20} className="text-gray-500 ml-2" />
        <input
          type="text"
          placeholder="Ingrese el domino al que deseas reasignar"
          className="flex-1 text-sm focus:outline-none placeholder:pl-3"
          value={licencePlate}
          onChange={handleChange}
        //   onKeyDown={(e) => e.key === "Enter" && go()}
        />
      </div>
      <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center">
        <ArrowRight size={30} strokeWidth={3} className="p-1" />
      </button>
    </div>
  );
}
