// app/dashboard/[id]/inspections-queue/loading.tsx
import { ChevronRight } from "lucide-react";
import InspectionTableSkeleton from "@/components/InspectionTableSkeleton";

export default function Loading() {
  return (
    <div className="min-w-full px-4 pt-10">
      {/* Breadcrumb */}
      <article className="flex items-center justify-between text-lg mb-6">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Inicio</span>
          <ChevronRight size={20} className="text-gray-300" />
          <span className="text-[#0040B8]/60">Cola de Inspecciones</span>
        </div>
      </article>

      {/* Barra de búsqueda + acciones (skeletons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-14 gap-3">
        <div className="border px-4 py-3 rounded-[4px] w-full flex-1 bg-gray-50">
          <div className="h-4 w-2/3 bg-gray-200/80 rounded animate-pulse" />
        </div>

        <div className="flex gap-2">
          <div className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px]">
            <div className="h-4 w-20 bg-gray-200/80 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <InspectionTableSkeleton rows={5} />
    </div>
  );
}
