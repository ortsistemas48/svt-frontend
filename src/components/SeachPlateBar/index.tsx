// app/workshops/[id]/users/page.tsx  (extracto)
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";

export default function SearchPlateBar( { workshopId }: { workshopId: number }) {
  const [licencePlate, setLicencePlate] = useState("");
  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setLicencePlate(value);  
};

  const go = () => {
    if (!licencePlate.trim()) return;
    router.push(`/dashboard/${workshopId}/reasign-oblea?licence_plate=${encodeURIComponent(licencePlate.trim())}`);
  };

  return (
    <div className="grid grid-cols-[500px_50px] gap-x-3 mt-6">
      <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-12">
        <Search size={20} className="text-gray-500 mr-1" />
        <input
          type="type"
          placeholder="Busca el dominio del auto para reasignar la oblea"
          className="flex-1 text-sm focus:outline-none"
          value={licencePlate}
          onChange={(e) => handleChange(e)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          maxLength={7}
        />  
      </div>
      <button onClick={go}className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center">
        <ArrowRight size={30} strokeWidth={3} className="p-1" />
      </button>
    </div>
  );
}
