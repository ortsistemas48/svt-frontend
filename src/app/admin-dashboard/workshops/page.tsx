import WorkshopTable from "@/components/WorkshopTable/page";
import { fetchAdminWorkshops } from "@/utils";
import { ChevronRight } from "lucide-react";

export default async function WorkshopsPage() {
    const { workshops } = await fetchAdminWorkshops();
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
        {/* Título */}
        <h2 className="text-3xl text-[#0040B8]">
          Talleres registrados
        </h2>
        <p className="text-gray-500 text-center">
          Aquí podrás ver y gestionar los talleres existentes en el sistema.
        </p>
      </div>
      <WorkshopTable workshops={workshops} />
    </div>
  );
}