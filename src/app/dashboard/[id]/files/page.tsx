"use client";
import FileHistoryTable from "@/components/FileHistoryTable";
import { ChevronRight } from "lucide-react";
import SearchFileBar from "@/components/SearchFileBar";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function FilesPage() {
  const { id } = useParams();
  const workshopId = Number(id);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="">
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-4 md:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Legajos</span>
          </div>
        </article>

        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Detalle de legajos
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-6 md:mb-8">
          Aquí podrás ver y buscar el detalle de cualquier legajo.
          </p>
          <SearchFileBar workshopId={workshopId} onSearch={setSearchQuery} />
        </div>

        {/* File History Table */}
        <div className="overflow-hidden">
          <FileHistoryTable workshopId={workshopId} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}