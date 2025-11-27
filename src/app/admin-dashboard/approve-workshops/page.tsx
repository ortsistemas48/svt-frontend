// app/admin/workshops/page.tsx
import ApproveWorkshopTable from "@/components/ApproveUserTable";
import { fetchAdminPendingWorkshops } from "@/utils";
import { ChevronRight } from "lucide-react";

export default async function WorkshopsPage() {
  const { workshops } = await fetchAdminPendingWorkshops();
  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2 md:px-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Inicio</span>
          <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="text-[#0040B8]">Aprobar Talleres</span>
        </div>
      </article>

      <div className="flex flex-col items-center gap-1 sm:gap-2 px-1 sm:px-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl text-[#0040B8] text-center">Aprobar nuevos talleres</h2>
        <p className="text-xs sm:text-sm text-gray-500 text-center px-2 sm:px-4">
          Aqui podrás aprobar los talleres registrados en el sistema.
        </p>
      </div>

      <ApproveWorkshopTable workshops={workshops} />
    </div>
  );
}
