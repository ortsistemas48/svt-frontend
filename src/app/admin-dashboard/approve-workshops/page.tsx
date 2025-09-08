// app/admin/workshops/page.tsx
import ApproveWorkshopTable from "@/components/ApproveUserTable";
import { fetchAdminPendingWorkshops } from "@/utils";
import { ChevronRight } from "lucide-react";

export default async function WorkshopsPage() {
  const { workshops } = await fetchAdminPendingWorkshops();
  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Talleres</span>
        </div>
      </article>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-3xl text-[#0040B8]">Aprobar nuevos talleres</h2>
        <p className="text-gray-500 text-center">
          Aqui podrás aprobar los talleres registrados en el sistema.
        </p>
      </div>

      <ApproveWorkshopTable workshops={workshops} />
    </div>
  );
}
