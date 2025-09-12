import { ChevronRight } from "lucide-react";
import CompletedApplicationsTable from "@/components/CompletedApplicationsTable";

export default async function ReprintCrtPage( { params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Reimpresión de CRT</span>
          </div>
        </article>

        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Busca tus certificados
          </h2> 
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Aquí podrás buscar y descargar los certificados de las aplicaciones completadas.
          </p>
        </div>

        {/* Completed Applications Table */}
        <div className="overflow-hidden">
          <CompletedApplicationsTable />
        </div>
      </div>
    </div>
  );
}
