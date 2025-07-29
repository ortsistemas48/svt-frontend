

import { ChevronRight, ChevronLeft  } from "lucide-react"
import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm";
export default function InspectionsPage() {

    return (
        <section className="w-full">
            <article className="flex items-center justify-between text-lg mb-6">
                <div className="flex items-center gap-1">
                <span>Home</span>
                <ChevronRight size={20} />
                <span className="text-[#0040B8]">Inspecciones</span>
                </div>
                <span className="text-md mr-4 text-[#000000]">Paso 1/3</span>
            </article>

            <div className="grid grid-cols-[1fr_1px_1fr] gap-8 mb-4 items-start">
                {/* Datos del titular */}
                <div>
                    <DriverForm />
                </div>

                {/* Línea divisoria */}
                <div className="bg-[#dedede] h-full w-px" />

                {/* Datos del conductor */}
                <div>
                    <OwnerForm />
                </div>
            </div>

            <div className="flex gap-x-3 justify-center px-4 pt-8 pb-10">
                <button className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-7">
                <ChevronLeft size={18} />
                Volver
                </button>
                <button className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-7">
                    Continuar
                </button>
            </div>
        </section>
    )
}