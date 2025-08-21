import { ChevronRight } from "lucide-react";
import CompletedApplicationsTable from "@/components/CompletedApplicationsTable";

export default async function ReprintCrtPage( { params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-w-full">  
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Reimpresion de CRT</span>
        </div>
      </article>

      <div className="flex flex-col items-center gap-2">
        {/* Título */}
        <h2 className="text-3xl text-[#0040B8]">
          Busca tus certificados
        </h2> 
         <p className=" text-gray-500 text-center">
          Aqui podrás crear o asociar usuarios existentes a tu taller.
        </p>
        {/* Subtítulo */}
      </div>
        <CompletedApplicationsTable />
    </div>
  );
}
