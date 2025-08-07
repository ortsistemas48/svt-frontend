import QueueTable from "@/components/QueueTable";
import { ChevronRight } from "lucide-react";

export default async function QueuePage() {

  return (
    <div className="min-w-full">  
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Cola de Inspecciones</span>
        </div>
      </article>

      <QueueTable/>
    </div>
  );
}